import { query, transaction } from '../db/config.js';
import { v4 as uuidv4 } from 'uuid';

// Crear disponibilidad para un día específico
export const createAvailability = async (doctorId, availabilityData) => {
  const { day_of_week, start_time, end_time } = availabilityData;

  const result = await query(
    `INSERT INTO doctor_availability (id, doctor_id, day_of_week, start_time, end_time)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [uuidv4(), doctorId, day_of_week, start_time, end_time]
  );

  return result.rows[0];
};

// Obtener disponibilidades de un doctor
export const getAvailabilitiesByDoctor = async (doctorId) => {
  const result = await query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1 AND is_available = true
     ORDER BY day_of_week ASC, start_time ASC`,
    [doctorId]
  );

  return result.rows;
};

// Obtener disponibilidad para un día específico
export const getAvailabilityForDay = async (doctorId, dayOfWeek) => {
  const result = await query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true`,
    [doctorId, dayOfWeek]
  );

  return result.rows;
};

// Actualizar disponibilidad
export const updateAvailability = async (availabilityId, doctorId, updateData) => {
  const { start_time, end_time, is_available } = updateData;

  const result = await query(
    `UPDATE doctor_availability
     SET start_time = COALESCE($1, start_time),
         end_time = COALESCE($2, end_time),
         is_available = COALESCE($3, is_available),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $4 AND doctor_id = $5
     RETURNING *`,
    [start_time, end_time, is_available, availabilityId, doctorId]
  );

  return result.rows[0];
};

// Eliminar disponibilidad
export const deleteAvailability = async (availabilityId, doctorId) => {
  const result = await query(
    `DELETE FROM doctor_availability
     WHERE id = $1 AND doctor_id = $2
     RETURNING *`,
    [availabilityId, doctorId]
  );

  return result.rows[0];
};

// Agregar vacaciones
export const addVacation = async (doctorId, vacationData) => {
  const { start_date, end_date, reason } = vacationData;

  const result = await query(
    `INSERT INTO doctor_vacation (id, doctor_id, start_date, end_date, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [uuidv4(), doctorId, start_date, end_date, reason]
  );

  return result.rows[0];
};

// Obtener vacaciones de un doctor
export const getVacationsByDoctor = async (doctorId) => {
  const result = await query(
    `SELECT * FROM doctor_vacation
     WHERE doctor_id = $1
     ORDER BY start_date ASC`,
    [doctorId]
  );

  return result.rows;
};

// Obtener vacaciones activas
export const getActiveVacations = async (doctorId) => {
  const result = await query(
    `SELECT * FROM doctor_vacation
     WHERE doctor_id = $1
       AND start_date <= CURRENT_DATE
       AND end_date >= CURRENT_DATE
     ORDER BY start_date ASC`,
    [doctorId]
  );

  return result.rows;
};

// Eliminar vacación
export const deleteVacation = async (vacationId, doctorId) => {
  const result = await query(
    `DELETE FROM doctor_vacation
     WHERE id = $1 AND doctor_id = $2
     RETURNING *`,
    [vacationId, doctorId]
  );

  return result.rows[0];
};

// Verificar si el doctor está disponible en una fecha/hora
export const isAvailableAt = async (doctorId, date, time) => {
  // Obtener el día de la semana (0 = domingo, 6 = sábado)
  // Parsear la fecha sin aplicar compensación UTC
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  console.log('🔍 Verificando disponibilidad:');
  console.log('  Fecha:', date);
  console.log('  Día de semana:', dayOfWeek);
  console.log('  Hora:', time);

  // Verificar vacaciones
  const vacation = await query(
    `SELECT * FROM doctor_vacation
     WHERE doctor_id = $1
       AND start_date <= $2
       AND end_date >= $2`,
    [doctorId, date]
  );

  if (vacation.rows.length > 0) {
    return { available: false, reason: 'Doctor está en vacaciones' };
  }

  // Verificar disponibilidad del día
  const availability = await query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true`,
    [doctorId, dayOfWeek]
  );

  console.log('  Disponibilidades encontradas:', availability.rows.length);

  if (availability.rows.length === 0) {
    console.log('  ❌ No hay disponibilidades');
    return { available: false, reason: 'Doctor no atiende este día' };
  }

  console.log('  ✓ Horarios:', availability.rows[0].start_time, '-', availability.rows[0].end_time);

  // Verificar si la hora está dentro de los rangos disponibles
  const slot = availability.rows[0];
  const timeInMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
  const startInMinutes = parseInt(slot.start_time.split(':')[0]) * 60 + parseInt(slot.start_time.split(':')[1]);
  const endInMinutes = parseInt(slot.end_time.split(':')[0]) * 60 + parseInt(slot.end_time.split(':')[1]);

  if (timeInMinutes < startInMinutes || timeInMinutes >= endInMinutes) {
    return { available: false, reason: 'La hora está fuera del horario disponible' };
  }

  // Verificar si no hay conflictos con otras citas
  const conflict = await query(
    `SELECT * FROM appointments
     WHERE doctor_id = $1
       AND appointment_date = $2
       AND appointment_time = $3
       AND status != 'cancelled'`,
    [doctorId, date, time]
  );

  if (conflict.rows.length > 0) {
    return { available: false, reason: 'Ya existe una cita en este horario' };
  }

  return { available: true };
};

// Obtener próximas disponibilidades para una fecha
export const getNextAvailableSlots = async (doctorId, date, slotDurationMinutes = 30) => {
  // Parsear la fecha sin aplicar compensación UTC
  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  console.log('📅 Buscando slots para:', date);
  console.log('📊 Día de la semana:', dayOfWeek, '(0=Domingo, 1=Lunes, etc)');

  // Verificar si hay vacaciones
  const vacation = await query(
    `SELECT * FROM doctor_vacation
     WHERE doctor_id = $1 AND start_date <= $2 AND end_date >= $2`,
    [doctorId, date]
  );

  if (vacation.rows.length > 0) {
    return [];
  }

  // Obtener disponibilidades del día
  const availabilities = await query(
    `SELECT * FROM doctor_availability
     WHERE doctor_id = $1 AND day_of_week = $2 AND is_available = true`,
    [doctorId, dayOfWeek]
  );

  console.log('Disponibilidades encontradas:', availabilities.rows.length);
  if (availabilities.rows.length > 0) {
    console.log('Horarios:', availabilities.rows[0].start_time, '-', availabilities.rows[0].end_time);
  }

  if (availabilities.rows.length === 0) {
    console.log('⚠️  No hay disponibilidades configuradas para este día');
    return [];
  }

  // Obtener citas existentes
  const appointments = await query(
    `SELECT appointment_time FROM appointments
     WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'
     ORDER BY appointment_time ASC`,
    [doctorId, date]
  );

  // Normalizar horarios reservados (remover segundos si existen)
  const bookedTimes = appointments.rows.map(a => {
    const time = a.appointment_time;
    // Si tiene formato HH:MM:SS, extraer solo HH:MM
    return typeof time === 'string' ? time.substring(0, 5) : time;
  });

  console.log('  Horarios reservados:', bookedTimes);

  // Generar slots disponibles
  const slots = [];
  const availability = availabilities.rows[0];

  const startMinutes = timeToMinutes(availability.start_time);
  const endMinutes = timeToMinutes(availability.end_time);

  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDurationMinutes) {
    const timeSlot = minutesToTime(minutes);

    if (!bookedTimes.includes(timeSlot)) {
      slots.push(timeSlot);
    }
  }

  console.log('  Slots disponibles:', slots.length);
  return slots;
};

// Convertir tiempo a minutos
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Convertir minutos a tiempo
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};
