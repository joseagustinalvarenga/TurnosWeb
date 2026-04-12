import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import styles from './PatientAppointmentViewPage.module.css';

export default function PatientAppointmentViewPage() {
  const { appointmentCode } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Cargar cita
  useEffect(() => {
    fetchAppointment();
  }, [appointmentCode]);

  // Timer para actualizar tiempo restante
  useEffect(() => {
    if (!appointment) return;

    const interval = setInterval(() => {
      if (appointment.status === 'scheduled') {
        const apptTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const now = new Date();
        const diff = apptTime - now;

        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft({ hours, minutes, seconds });
        } else {
          setTimeLeft(null);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [appointment]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);

      // Para esta demo, buscar una cita que coincida con el código
      // En producción, habría un endpoint específico para esto
      const response = await appointmentAPI.getAppointments();

      if (response.success) {
        // Buscar la cita (en demo usamos el código como parte del ID)
        const appt = response.appointments.find(
          a => a.id.substring(0, 8).toUpperCase() === appointmentCode.substring(0, 8).toUpperCase()
        ) || response.appointments[0]; // Demo: tomar la primera cita

        if (appt) {
          setAppointment(appt);
          setError(null);
        } else {
          setError('No se encontró el turno con este código');
        }
      }
    } catch (err) {
      console.error('Error cargando cita:', err);
      setError('Error al cargar tu turno. Verifica el código e intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'scheduled';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'scheduled':
        return 'Turno Confirmado';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return '⏳';
      case 'completed':
        return '✅';
      case 'cancelled':
        return '❌';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Buscando tu turno...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>❌ Error</h2>
          <p>{error || 'No se encontró tu turno'}</p>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/patient')}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const isToday = new Date(appointment.appointment_date).toDateString() === new Date().toDateString();

  return (
    <div className={styles.container}>
      <button
        className={styles.backBtn}
        onClick={() => navigate('/patient')}
        title="Volver"
      >
        ← Atrás
      </button>

      <div className={styles.card}>
        {/* Encabezado con estado */}
        <div className={`${styles.header} ${styles[getStatusColor(appointment.status)]}`}>
          <span className={styles.statusIcon}>
            {getStatusIcon(appointment.status)}
          </span>
          <h1 className={styles.statusText}>
            {getStatusText(appointment.status)}
          </h1>
          {isToday && appointment.status === 'scheduled' && (
            <p className={styles.badge}>🎯 Hoy</p>
          )}
        </div>

        {/* Información principal */}
        <div className={styles.mainInfo}>
          <div className={styles.infoSection}>
            <h3>📅 Fecha y Hora</h3>
            <p className={styles.largeText}>
              {appointmentDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className={styles.timeText}>
              {appointment.appointment_time}
            </p>
          </div>

          {/* Tiempo restante */}
          {appointment.status === 'scheduled' && timeLeft && (
            <div className={styles.infoSection}>
              <h3>⏱️ Falta Para Tu Turno</h3>
              <div className={styles.countdown}>
                {timeLeft.hours > 0 && (
                  <div className={styles.countdownItem}>
                    <span className={styles.number}>{timeLeft.hours}</span>
                    <span className={styles.label}>h</span>
                  </div>
                )}
                <div className={styles.countdownItem}>
                  <span className={styles.number}>{timeLeft.minutes}</span>
                  <span className={styles.label}>m</span>
                </div>
                <div className={styles.countdownItem}>
                  <span className={styles.number}>{timeLeft.seconds}</span>
                  <span className={styles.label}>s</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detalles del doctor */}
        <div className={styles.doctorSection}>
          <h3>👨‍⚕️ Tu Doctor</h3>
          <div className={styles.doctorInfo}>
            <p className={styles.doctorName}>{appointment.doctor_name}</p>
            {appointment.specialization && (
              <p className={styles.specialization}>
                {appointment.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Información del paciente */}
        <div className={styles.patientSection}>
          <h3>👤 Tu Información</h3>
          <div className={styles.patientInfo}>
            <p><strong>Nombre:</strong> {appointment.patient_name}</p>
            {appointment.patient_phone && (
              <p>
                <strong>Teléfono:</strong>{' '}
                <a href={`tel:${appointment.patient_phone}`}>
                  {appointment.patient_phone}
                </a>
              </p>
            )}
            {appointment.reason_for_visit && (
              <p><strong>Motivo:</strong> {appointment.reason_for_visit}</p>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        {appointment.status === 'scheduled' && (
          <div className={styles.instructionsBox}>
            <h3>📋 Importante</h3>
            <ul>
              <li>Presenta tu identificación al llegar</li>
              <li>Procura llegar 5-10 minutos antes</li>
              <li>Mantén este código contigo</li>
              {isToday && (
                <li className={styles.highlight}>
                  🔔 Tu cita es HOY. ¡No olvides!
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Código de turno */}
        <div className={styles.codeSection}>
          <p className={styles.codeLabel}>Código de Turno</p>
          <div className={styles.code}>
            {appointmentCode}
          </div>
          <button
            className={styles.copyBtn}
            onClick={() => {
              navigator.clipboard.writeText(appointmentCode);
              alert('Código copiado al portapapeles');
            }}
          >
            📋 Copiar
          </button>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <button
            className={styles.refreshBtn}
            onClick={fetchAppointment}
            title="Actualizar"
          >
            🔄 Actualizar
          </button>
          <a
            href={`tel:${appointment.patient_phone || '+56912345678'}`}
            className={styles.callBtn}
          >
            📞 Llamar
          </a>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>¿Dudas? Llama a la clínica</p>
          <p className={styles.phone}>📞 +56 9 1234 5678</p>
        </div>
      </div>
    </div>
  );
}
