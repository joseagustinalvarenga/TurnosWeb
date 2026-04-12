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

  useEffect(() => {
    fetchAppointment();
  }, [appointmentCode]);

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
      const response = await appointmentAPI.getAppointments();

      if (response.success) {
        const appt = response.appointments.find(
          a => a.id.substring(0, 8).toUpperCase() === appointmentCode.substring(0, 8).toUpperCase()
        ) || response.appointments[0];

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

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { label: 'Confirmado', class: styles.statusScheduled },
      completed: { label: 'Completado', class: styles.statusCompleted },
      cancelled: { label: 'Cancelado', class: styles.statusCancelled }
    };
    const badge = badges[status] || badges.scheduled;
    return <span className={`${styles.statusBadge} ${badge.class}`}>{badge.label}</span>;
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
          <h2>Error</h2>
          <p>{error || 'No se encontró tu turno'}</p>
          <button
            className={styles.backBtn}
            onClick={() => navigate('/patient')}
          >
            Volver
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
        {/* Estado */}
        <div className={`${styles.header} ${styles[appointment.status]}`}>
          <h1 className={styles.statusText}>
            {appointment.status === 'scheduled' && 'Tu turno está confirmado'}
            {appointment.status === 'completed' && 'Turno completado'}
            {appointment.status === 'cancelled' && 'Turno cancelado'}
          </h1>
          {isToday && appointment.status === 'scheduled' && (
            <div className={styles.todayBadge}>Hoy</div>
          )}
        </div>

        {/* Información Principal */}
        <div className={styles.mainSection}>
          <div className={styles.dateTimeBox}>
            <div className={styles.label}>Fecha y Hora</div>
            <div className={styles.dateDisplay}>
              {appointmentDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className={styles.timeDisplay}>
              {appointment.appointment_time}
            </div>
          </div>

          {appointment.status === 'scheduled' && timeLeft && (
            <div className={styles.countdownBox}>
              <div className={styles.label}>Falta para tu turno</div>
              <div className={styles.countdown}>
                {timeLeft.hours > 0 && (
                  <div className={styles.countdownItem}>
                    <span className={styles.number}>{timeLeft.hours}</span>
                    <span className={styles.unit}>h</span>
                  </div>
                )}
                <div className={styles.countdownItem}>
                  <span className={styles.number}>{timeLeft.minutes}</span>
                  <span className={styles.unit}>m</span>
                </div>
                <div className={styles.countdownItem}>
                  <span className={styles.number}>{timeLeft.seconds}</span>
                  <span className={styles.unit}>s</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información del Doctor */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tu Doctor</h3>
          <div className={styles.doctorInfo}>
            <h4 className={styles.doctorName}>{appointment.doctor_name}</h4>
            {appointment.specialization && (
              <p className={styles.specialization}>{appointment.specialization}</p>
            )}
          </div>
        </div>

        {/* Información del Paciente */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Tu Información</h3>
          <div className={styles.patientInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Nombre:</span>
              <span className={styles.value}>{appointment.patient_name}</span>
            </div>
            {appointment.patient_phone && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Teléfono:</span>
                <a href={`tel:${appointment.patient_phone}`} className={styles.phoneLink}>
                  {appointment.patient_phone}
                </a>
              </div>
            )}
            {appointment.reason_for_visit && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Motivo:</span>
                <span className={styles.value}>{appointment.reason_for_visit}</span>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        {appointment.status === 'scheduled' && (
          <div className={styles.instructions}>
            <h3 className={styles.sectionTitle}>Información Importante</h3>
            <ul className={styles.instructionsList}>
              <li>Presenta tu identificación al llegar</li>
              <li>Procura llegar 5-10 minutos antes</li>
              <li>Ten este código contigo</li>
              {isToday && (
                <li className={styles.highlight}>Tu cita es HOY. No olvides</li>
              )}
            </ul>
          </div>
        )}

        {/* Código de Turno */}
        <div className={styles.codeSection}>
          <div className={styles.label}>Código de Turno</div>
          <div className={styles.code}>{appointmentCode}</div>
          <button
            className={styles.copyBtn}
            onClick={() => {
              navigator.clipboard.writeText(appointmentCode);
              alert('Código copiado');
            }}
          >
            Copiar Código
          </button>
        </div>

        {/* Acciones */}
        <div className={styles.actions}>
          <button
            className={styles.refreshBtn}
            onClick={fetchAppointment}
            title="Actualizar"
          >
            Actualizar
          </button>
          {appointment.patient_phone && (
            <a
              href={`tel:${appointment.patient_phone}`}
              className={styles.callBtn}
            >
              Llamar a la Clínica
            </a>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p>¿Dudas o necesitas cambiar tu turno?</p>
          <p className={styles.footerPhone}>+56 9 1234 5678</p>
        </div>
      </div>
    </div>
  );
}
