import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';
import * as appointmentController from '../controllers/appointmentController.js';
import { query } from '../db/config.js';
import { sendDelayNotification } from '../services/emailService.js';
import * as availabilityService from '../services/availabilityService.js';

const router = express.Router();

// ===== RUTAS PÚBLICAS =====

// Obtener especialidades disponibles
router.get('/public/specializations', async (req, res) => {
  try {
    console.log('🔓 Obtener especialidades públicas');

    const result = await query(
      `SELECT DISTINCT specialization
       FROM doctors
       WHERE status = 'approved'
       AND subscription_status IN ('active', 'trial')
       AND specialization IS NOT NULL
       AND specialization != ''
       ORDER BY specialization ASC`
    );

    const specializations = result.rows.map(row => row.specialization).filter(Boolean);

    console.log('✓ Especialidades encontradas:', specializations);

    res.json({
      success: true,
      specializations
    });
  } catch (error) {
    console.error('Error obteniendo especialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades'
    });
  }
});

// Obtener médicos por especialidad
router.get('/public/doctors/:specialization', async (req, res) => {
  try {
    const { specialization } = req.params;

    console.log('🔓 Obtener médicos de especialidad:', specialization);

    const result = await query(
      `SELECT id, name, specialization, clinic_name, phone
       FROM doctors
       WHERE LOWER(specialization) = LOWER($1)
       AND status = 'approved'
       AND subscription_status IN ('active', 'trial')
       ORDER BY name ASC`,
      [specialization]
    );

    console.log('✓ Médicos encontrados:', result.rows.length);

    res.json({
      success: true,
      doctors: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo médicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener médicos'
    });
  }
});

// Obtener horarios disponibles para un médico en una fecha
router.get('/public/available-slots/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;

    console.log('🔓 Obtener horarios disponibles para doctor:', doctorId, 'fecha:', date);

    const slots = await availabilityService.getNextAvailableSlots(doctorId, date);

    res.json({
      success: true,
      slots: slots || []
    });
  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles'
    });
  }
});

// ===== RUTAS PROTEGIDAS PARA DOCTORES =====
router.post('/', verifyToken, verifyDoctorRole, appointmentController.createAppointment);
router.get('/', verifyToken, verifyDoctorRole, appointmentController.getAppointments);
router.get('/today', verifyToken, verifyDoctorRole, appointmentController.getTodayAppointments);
router.get('/available-slots', verifyToken, verifyDoctorRole, appointmentController.getAvailableSlots);
router.get('/statistics', verifyToken, verifyDoctorRole, appointmentController.getStatistics);
router.get('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.getAppointment);
router.patch('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.updateAppointment);
router.delete('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.cancelAppointment);

// Ruta pública para buscar por datos del paciente (sin autenticación)
router.post('/public/search', async (req, res) => {
  try {
    const { name, lastName, documentNumber } = req.body;

    // Validar que al menos un campo esté completo
    if ((!name || name.length < 2) && (!lastName || lastName.length < 2) && !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'Debes ingresar al menos un dato: nombre, apellido o documento'
      });
    }

    console.log('🔓 Búsqueda pública de cita por:', { name, lastName, documentNumber });

    let whereConditions = [];
    let params = [];
    let paramIndex = 1;

    // Construir condiciones dinámicamente
    if (name && name.length >= 2) {
      whereConditions.push(`LOWER(p.name) LIKE LOWER($${paramIndex})`);
      params.push(`%${name}%`);
      paramIndex++;
    }

    if (lastName && lastName.length >= 2) {
      whereConditions.push(`LOWER(p.name) LIKE LOWER($${paramIndex})`);
      params.push(`%${lastName}%`);
      paramIndex++;
    }

    if (documentNumber && documentNumber.length > 0) {
      whereConditions.push(`LOWER(p.document_number) LIKE LOWER($${paramIndex})`);
      params.push(`%${documentNumber}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? whereConditions.join(' OR ')
      : '1=1';

    // Buscar citas programadas del paciente
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
      WHERE (${whereClause})
      AND a.status = 'scheduled'
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
      LIMIT 1`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró ninguna cita con esos datos'
      });
    }

    const appointment = result.rows[0];
    console.log('✓ Cita encontrada:', appointment.patient_name);

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Error buscando cita:', error);
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
