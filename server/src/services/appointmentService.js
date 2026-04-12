import { query, transaction } from '../db/config.js';
import { v4 as uuidv4 } from 'uuid';

// Crear una cita
export const createAppointment = async (doctorId, patientId, appointmentData) => {
  const { appointment_date, appointment_time, end_time, reason_for_visit } = appointmentData;

  try {
    const result = await query(
      `INSERT INTO appointments (id, doctor_id, patient_id, appointment_date, appointment_time, end_time, reason_for_visit, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING *`,
      [uuidv4(), doctorId, patientId, appointment_date, appointment_time, end_time, reason_for_visit]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Ya existe una cita en ese horario');
    }
    throw error;
  }
};

// Obtener citas de un doctor
export const getAppointmentsByDoctor = async (doctorId, filters = {}) => {
  let queryText = `
    SELECT
      a.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = $1
  `;

  const params = [doctorId];
  let paramIndex = 2;

  // Filtrar por fecha
  if (filters.date) {
    queryText += ` AND a.appointment_date = $${paramIndex}`;
    params.push(filters.date);
    paramIndex++;
  }

  // Filtrar por estado
  if (filters.status) {
    queryText += ` AND a.status = $${paramIndex}`;
    params.push(filters.status);
    paramIndex++;
  }

  // Ordenar por fecha y hora
  queryText += ` ORDER BY a.appointment_date ASC, a.appointment_time ASC`;

  const result = await query(queryText, params);
  return result.rows;
};

// Obtener citas de un paciente
export const getAppointmentsByPatient = async (patientId) => {
  const result = await query(
    `SELECT
      a.*,
      d.name as doctor_name,
      d.specialization,
      d.clinic_name,
      d.phone as doctor_phone
    FROM appointments a
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.patient_id = $1
    ORDER BY a.appointment_date DESC`,
    [patientId]
  );

  return result.rows;
};

// Obtener cita por ID
export const getAppointmentById = async (appointmentId) => {
  const result = await query(
    `SELECT
      a.*,
      p.name as patient_name,
      p.phone as patient_phone,
      p.email as patient_email,
      d.name as doctor_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors d ON a.doctor_id = d.id
    WHERE a.id = $1`,
    [appointmentId]
  );

  return result.rows[0];
};

// Actualizar cita
export const updateAppointment = async (appointmentId, updateData) => {
  const { appointment_date, appointment_time, end_time, status, reason_for_visit, notes, delay_minutes } = updateData;

  const result = await query(
    `UPDATE appointments
     SET appointment_date = COALESCE($1, appointment_date),
         appointment_time = COALESCE($2, appointment_time),
         end_time = COALESCE($3, end_time),
         status = COALESCE($4, status),
         reason_for_visit = COALESCE($5, reason_for_visit),
         notes = COALESCE($6, notes),
         delay_minutes = COALESCE($7, delay_minutes),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [appointment_date, appointment_time, end_time, status, reason_for_visit, notes, delay_minutes, appointmentId]
  );

  return result.rows[0];
};

// Cancelar cita
export const cancelAppointment = async (appointmentId) => {
  const result = await query(
    `UPDATE appointments
     SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [appointmentId]
  );

  return result.rows[0];
};

// Obtener citas del día (para el dashboard)
export const getAppointmentsForToday = async (doctorId) => {
  const result = await query(
    `SELECT
      a.*,
      p.name as patient_name,
      p.phone as patient_phone
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    WHERE a.doctor_id = $1
      AND a.appointment_date = CURRENT_DATE
      AND a.status != 'cancelled'
    ORDER BY a.appointment_time ASC`,
    [doctorId]
  );

  return result.rows;
};

// Obtener estadísticas de citas
export const getAppointmentStats = async (doctorId, startDate, endDate) => {
  const result = await query(
    `SELECT
      COUNT(*) as total_appointments,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      AVG(delay_minutes) as average_delay
    FROM appointments
    WHERE doctor_id = $1
      AND appointment_date BETWEEN $2 AND $3`,
    [doctorId, startDate, endDate]
  );

  return result.rows[0];
};

// Actualizar posición en cola
export const updateQueuePosition = async (appointmentId, position) => {
  const result = await query(
    `UPDATE appointments
     SET queue_position = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [position, appointmentId]
  );

  return result.rows[0];
};

// Recalcular colas para un día específico
export const recalculateQueueForDate = async (doctorId, appointmentDate) => {
  try {
    await transaction(async (client) => {
      // Obtener todas las citas del día ordenadas por hora
      const appointmentsResult = await client.query(
        `SELECT id FROM appointments
         WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'
         ORDER BY appointment_time ASC`,
        [doctorId, appointmentDate]
      );

      // Actualizar posición en cola
      for (let i = 0; i < appointmentsResult.rows.length; i++) {
        await client.query(
          `UPDATE appointments SET queue_position = $1 WHERE id = $2`,
          [i + 1, appointmentsResult.rows[i].id]
        );
      }
    });

    return true;
  } catch (error) {
    console.error('Error recalculando cola:', error);
    throw error;
  }
};
