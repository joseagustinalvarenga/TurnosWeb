import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';
import * as appointmentController from '../controllers/appointmentController.js';
import { query } from '../db/config.js';
import { sendDelayNotification, sendAppointmentConfirmation, sendAppointmentRejectionEmail } from '../services/emailService.js';
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

// ===== RUTAS PÚBLICAS ADICIONALES =====

// Ruta pública para crear una cita (sin autenticación)
router.post('/public/create', async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      patientName,
      patientLastName,
      patientEmail,
      patientDocumentNumber,
      patientPhone
    } = req.body;

    // Validaciones
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos de la cita'
      });
    }

    if (!patientName || !patientLastName || !patientEmail || !patientDocumentNumber || !patientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos del paciente'
      });
    }

    console.log('🔓 Crear cita pública para doctor:', doctorId, 'fecha:', appointmentDate, 'hora:', appointmentTime);

    // Verificar que el doctor existe y está aprobado
    const doctorCheck = await query(
      `SELECT id, name, email, specialization, clinic_name
       FROM doctors
       WHERE id = $1
       AND status = 'approved'
       AND subscription_status IN ('active', 'trial')`,
      [doctorId]
    );

    if (doctorCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no disponible'
      });
    }

    const doctor = doctorCheck.rows[0];

    // Buscar o crear paciente
    let patientId;
    const patientCheck = await query(
      `SELECT id FROM patients
       WHERE document_number = $1`,
      [patientDocumentNumber]
    );

    if (patientCheck.rows.length > 0) {
      patientId = patientCheck.rows[0].id;
      // Actualizar datos del paciente si existen cambios
      await query(
        `UPDATE patients
         SET name = $1, phone = $2, email = $3
         WHERE id = $4`,
        [
          `${patientName} ${patientLastName}`,
          patientPhone,
          patientEmail,
          patientId
        ]
      );
    } else {
      // Crear nuevo paciente asociado al doctor
      const newPatientResult = await query(
        `INSERT INTO patients (name, phone, email, document_number, doctor_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          `${patientName} ${patientLastName}`,
          patientPhone,
          patientEmail,
          patientDocumentNumber,
          doctorId
        ]
      );
      patientId = newPatientResult.rows[0].id;
    }

    // Crear la cita con estado 'pending'
    const appointmentResult = await query(
      `INSERT INTO appointments (
        doctor_id,
        patient_id,
        appointment_date,
        appointment_time,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, appointment_date, appointment_time`,
      [
        doctorId,
        patientId,
        appointmentDate,
        appointmentTime,
        'pending'
      ]
    );

    const appointment = appointmentResult.rows[0];

    console.log('✓ Cita pendiente creada:', appointment.id);

    // Aquí se podría enviar un email al doctor notificando sobre la solicitud pendiente
    // Por ahora solo lo registramos
    console.log('📧 Notificación pendiente: Doctor', doctor.name, 'tiene nueva solicitud de cita');

    res.json({
      success: true,
      message: 'Tu solicitud de turno ha sido enviada al médico',
      appointment: {
        id: appointment.id,
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time,
        status: 'pending',
        doctorName: doctor.name,
        clinicName: doctor.clinic_name
      }
    });
  } catch (error) {
    console.error('Error creando cita pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agendar el turno'
    });
  }
});

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

// ===== RUTAS PROTEGIDAS PARA DOCTORES =====
router.post('/', verifyToken, verifyDoctorRole, appointmentController.createAppointment);
router.get('/', verifyToken, verifyDoctorRole, appointmentController.getAppointments);
router.get('/today', verifyToken, verifyDoctorRole, appointmentController.getTodayAppointments);
router.get('/available-slots', verifyToken, verifyDoctorRole, appointmentController.getAvailableSlots);
router.get('/statistics', verifyToken, verifyDoctorRole, appointmentController.getStatistics);
router.get('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.getAppointment);
router.patch('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.updateAppointment);
router.delete('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.cancelAppointment);

// Aceptar una cita pendiente (doctor aprueba la solicitud)
router.patch('/:appointmentId/accept', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    // Verificar que el doctor es el propietario de la cita
    const appointmentCheck = await query(
      `SELECT a.status, a.doctor_id, a.appointment_date, a.appointment_time,
              p.name as patient_name, p.email as patient_email,
              d.name as doctor_name, d.specialization as doctor_specialization
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
        message: 'No tienes permiso para aceptar esta cita'
      });
    }

    if (appointmentData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Esta cita no está pendiente de aprobación'
      });
    }

    // Cambiar status a 'scheduled'
    const result = await query(
      `UPDATE appointments
       SET status = 'scheduled',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, status`,
      [appointmentId]
    );

    console.log('✓ Cita aceptada:', appointmentId);

    // Enviar email de confirmación al paciente
    if (appointmentData.patient_email) {
      await sendAppointmentConfirmation({
        to: appointmentData.patient_email,
        patientName: appointmentData.patient_name,
        doctorName: appointmentData.doctor_name,
        doctorSpecialty: appointmentData.doctor_specialization,
        appointmentDate: appointmentData.appointment_date,
        appointmentTime: appointmentData.appointment_time,
        confirmUrl: `http://localhost:3000/patient/appointment/${appointmentId}`
      });
      console.log('📧 Email de confirmación enviado a:', appointmentData.patient_email);
    }

    res.json({
      success: true,
      message: 'Cita aceptada y confirmada al paciente',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error aceptando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar la cita'
    });
  }
});

// Rechazar una cita pendiente (doctor rechaza la solicitud)
router.patch('/:appointmentId/reject', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { reason } = req.body;
    const doctorId = req.user.id;

    // Verificar que el doctor es el propietario de la cita
    const appointmentCheck = await query(
      `SELECT a.status, a.doctor_id, a.appointment_date, a.appointment_time,
              p.name as patient_name, p.email as patient_email,
              d.name as doctor_name
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
        message: 'No tienes permiso para rechazar esta cita'
      });
    }

    if (appointmentData.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Esta cita no está pendiente de aprobación'
      });
    }

    // Cambiar status a 'rejected'
    const result = await query(
      `UPDATE appointments
       SET status = 'rejected',
           notes = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status`,
      [reason || null, appointmentId]
    );

    console.log('✗ Cita rechazada:', appointmentId);

    // Enviar email de rechazo al paciente
    if (appointmentData.patient_email) {
      await sendAppointmentRejectionEmail({
        to: appointmentData.patient_email,
        patientName: appointmentData.patient_name,
        doctorName: appointmentData.doctor_name,
        appointmentDate: appointmentData.appointment_date,
        appointmentTime: appointmentData.appointment_time,
        reason: reason || null
      });
      console.log('📧 Email de rechazo enviado a:', appointmentData.patient_email);
    }

    res.json({
      success: true,
      message: 'Cita rechazada y paciente notificado',
      appointment: result.rows[0]
    });
  } catch (error) {
    console.error('Error rechazando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar la cita'
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
