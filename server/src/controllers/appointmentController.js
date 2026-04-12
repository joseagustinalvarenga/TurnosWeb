import * as appointmentService from '../services/appointmentService.js';
import * as availabilityService from '../services/availabilityService.js';

// Crear una nueva cita
export const createAppointment = async (req, res) => {
  try {
    const { patientId, appointment_date, appointment_time, end_time, reason_for_visit } = req.body;
    const doctorId = req.user.id;

    // Validaciones
    if (!patientId || !appointment_date || !appointment_time) {
      return res.status(400).json({
        success: false,
        message: 'patientId, appointment_date y appointment_time son requeridos'
      });
    }

    // Verificar disponibilidad
    const availability = await availabilityService.isAvailableAt(doctorId, appointment_date, appointment_time);

    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: availability.reason
      });
    }

    // Crear cita
    const appointment = await appointmentService.createAppointment(doctorId, patientId, {
      appointment_date,
      appointment_time,
      end_time,
      reason_for_visit
    });

    // Recalcular cola
    await appointmentService.recalculateQueueForDate(doctorId, appointment_date);

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error creando cita:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear la cita'
    });
  }
};

// Obtener citas del doctor
export const getAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date, status } = req.query;

    const appointments = await appointmentService.getAppointmentsByDoctor(doctorId, {
      date,
      status
    });

    res.json({
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Error obteniendo citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas'
    });
  }
};

// Obtener citas del día
export const getTodayAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const appointments = await appointmentService.getAppointmentsForToday(doctorId);

    res.json({
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Error obteniendo citas del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas del día'
    });
  }
};

// Obtener detalle de una cita
export const getAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    const appointment = await appointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Verificar que la cita pertenezca al doctor
    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta cita'
      });
    }

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
};

// Actualizar cita
export const updateAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;
    const updateData = req.body;

    // Verificar que la cita exista y pertenezca al doctor
    const appointment = await appointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar esta cita'
      });
    }

    // Si se actualiza la fecha/hora, verificar disponibilidad
    if (updateData.appointment_date || updateData.appointment_time) {
      const newDate = updateData.appointment_date || appointment.appointment_date;
      const newTime = updateData.appointment_time || appointment.appointment_time;

      const availability = await availabilityService.isAvailableAt(doctorId, newDate, newTime);

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: availability.reason
        });
      }
    }

    const updatedAppointment = await appointmentService.updateAppointment(appointmentId, updateData);

    // Recalcular cola si cambió la fecha
    if (updateData.appointment_date) {
      await appointmentService.recalculateQueueForDate(doctorId, updateData.appointment_date);
    }

    res.json({
      success: true,
      message: 'Cita actualizada exitosamente',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error actualizando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la cita'
    });
  }
};

// Cancelar cita
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    const appointment = await appointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (appointment.doctor_id !== doctorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar esta cita'
      });
    }

    const cancelledAppointment = await appointmentService.cancelAppointment(appointmentId);

    // Recalcular cola
    await appointmentService.recalculateQueueForDate(doctorId, appointment.appointment_date);

    res.json({
      success: true,
      message: 'Cita cancelada exitosamente',
      appointment: cancelledAppointment
    });
  } catch (error) {
    console.error('Error cancelando cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar la cita'
    });
  }
};

// Obtener estadísticas de citas
export const getStatistics = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate y endDate son requeridos'
      });
    }

    const stats = await appointmentService.getAppointmentStats(doctorId, startDate, endDate);

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Obtener slots disponibles
export const getAvailableSlots = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'date es requerido'
      });
    }

    const slots = await availabilityService.getNextAvailableSlots(doctorId, date);

    res.json({
      success: true,
      date,
      slots,
      count: slots.length
    });
  } catch (error) {
    console.error('Error obteniendo slots disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener slots disponibles'
    });
  }
};
