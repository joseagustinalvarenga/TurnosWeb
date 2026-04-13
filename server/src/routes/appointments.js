import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';
import * as appointmentController from '../controllers/appointmentController.js';
import { query } from '../db/config.js';
import { sendDelayNotification } from '../services/emailService.js';

const router = express.Router();

// Rutas protegidas para doctores
router.post('/', verifyToken, verifyDoctorRole, appointmentController.createAppointment);
router.get('/', verifyToken, verifyDoctorRole, appointmentController.getAppointments);
router.get('/today', verifyToken, verifyDoctorRole, appointmentController.getTodayAppointments);
router.get('/available-slots', verifyToken, verifyDoctorRole, appointmentController.getAvailableSlots);
router.get('/statistics', verifyToken, verifyDoctorRole, appointmentController.getStatistics);
router.get('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.getAppointment);
router.patch('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.updateAppointment);
router.delete('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.cancelAppointment);

// Ruta pública para buscar por nombre (sin autenticación)
router.get('/public/search/name/:patientName', async (req, res) => {
  try {
    const { patientName } = req.params;

    if (!patientName || patientName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe tener al menos 2 caracteres'
      });
    }

    console.log('🔓 Búsqueda pública de cita por nombre:', patientName);

    // Buscar citas programadas del paciente con ese nombre
    const result = await query(
      `SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.reason_for_visit,
        a.status,
        p.name as patient_name,
        p.phone as patient_phone,
        p.email as patient_email,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE LOWER(p.name) LIKE LOWER($1)
      AND a.status = 'scheduled'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 1`,
      [`%${patientName}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ninguna cita para este paciente'
      });
    }

    const appointment = result.rows[0];
    console.log('✓ Cita encontrada por nombre:', appointment.patient_name);

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error buscando cita por nombre:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar la cita'
    });
  }
});

// Ruta pública para confirmar cita (sin autenticación)
router.get('/public/:token', async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🔓 Acceso público a cita con token:', token.substring(0, 8) + '...');

    const result = await query(
      `SELECT
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.reason_for_visit,
        a.status,
        p.name as patient_name,
        p.phone as patient_phone,
        d.name as doctor_name,
        d.specialization as doctor_specialization
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN doctors d ON a.doctor_id = d.id
      WHERE a.confirmation_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const appointment = result.rows[0];
    console.log('✓ Cita encontrada:', appointment.patient_name);

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error obteniendo cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la cita'
    });
  }
});

// Actualizar retraso de cita
router.patch('/:appointmentId/delay', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { delay_minutes, delay_reason } = req.body;
    const doctorId = req.user.id;

    // Validar que el doctor es el propietario de la cita
    const appointmentCheck = await query(
      `SELECT a.doctor_id, a.appointment_time, p.name as patient_name, p.email as patient_email, d.name as doctor_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.id
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [appointmentId]
    );

    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const appointmentData = appointmentCheck.rows[0];

    if (appointmentData.doctor_id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta cita'
      });
    }

    // Actualizar el retraso
    const result = await query(
      `UPDATE appointments
       SET delay_minutes = $1,
           delay_reason = $2,
           delayed_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, appointment_time, delay_minutes, delay_reason, patient_id`,
      [delay_minutes || 0, delay_reason || null, appointmentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Error al actualizar la cita'
      });
    }

    const appointment = result.rows[0];

    // Enviar notificación por email al paciente
    if (appointmentData.patient_email && delay_minutes > 0) {
      await sendDelayNotification({
        to: appointmentData.patient_email,
        patientName: appointmentData.patient_name,
        doctorName: appointmentData.doctor_name,
        appointmentTime: appointmentData.appointment_time,
        delayMinutes: delay_minutes
      });
    }

    res.json({
      success: true,
      message: `Retraso actualizado: +${delay_minutes} minutos`,
      appointment
    });
  } catch (error) {
    console.error('Error actualizando retraso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el retraso'
    });
  }
});

export default router;
