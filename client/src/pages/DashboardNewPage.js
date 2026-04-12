import React, { useState, useEffect } from 'react';
import DoctorLayout from '../components/DoctorLayout';
import { useAuth } from '../hooks/useAuth';
import { useWebSocketContext } from '../hooks/useWebSocketContext';
import { doctorAPI, appointmentAPI } from '../services/api';
import styles from './DashboardNewPage.module.css';

export default function DashboardNewPage() {
  const { user } = useAuth();
  const { isConnected } = useWebSocketContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_appointments: 0,
    total_patients: 0,
    appointments_today: 0,
    pending_appointments: 0,
    completed_appointments: 0,
    cancelled_appointments: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [error, setError] = useState(null);

  // Cargar datos del dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Obtener estadísticas
        const dashboardRes = await doctorAPI.getDashboard();
        if (dashboardRes.success) {
          setStats(dashboardRes.stats);
        }

        // Obtener citas de hoy
        const appointmentsRes = await appointmentAPI.getAppointments();
        if (appointmentsRes.success) {
          const today = new Date().toISOString().split('T')[0];
          const todayAppts = appointmentsRes.appointments.filter(
            appt => appt.appointment_date === today && appt.status !== 'cancelled'
          );
          setTodayAppointments(todayAppts);
        }

        setError(null);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
        setError('Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const StatCard = ({ icon, label, value, trend, color = 'primary' }) => (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {trend && <span className={styles.statTrend}>{trend}</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <DoctorLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando dashboard...</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className={styles.dashboard}>
        {error && (
          <div className={styles.alert}>
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className={styles.header}>
          <h1>📊 Dashboard</h1>
          <p className={styles.subtitle}>
            Bienvenido, {user?.name} {isConnected && '🟢'}
          </p>
        </div>

        {/* Grid de estadísticas */}
        <div className={styles.statsGrid}>
          <StatCard
            icon="📅"
            label="Citas Totales"
            value={stats.total_appointments}
            color="primary"
          />
          <StatCard
            icon="⏳"
            label="Citas Hoy"
            value={stats.appointments_today}
            color="info"
          />
          <StatCard
            icon="🔔"
            label="Pendientes"
            value={stats.pending_appointments}
            color="warning"
          />
          <StatCard
            icon="👥"
            label="Pacientes"
            value={stats.total_patients}
            color="success"
          />
          <StatCard
            icon="✅"
            label="Completadas"
            value={stats.completed_appointments}
            trend="+5 esta semana"
            color="success"
          />
          <StatCard
            icon="❌"
            label="Canceladas"
            value={stats.cancelled_appointments}
            color="danger"
          />
        </div>

        {/* Citas de hoy */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📅 Citas de Hoy</h2>
            <a href="/appointments" className={styles.seeAll}>
              Ver todas →
            </a>
          </div>

          {todayAppointments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay citas programadas para hoy 🎉</p>
            </div>
          ) : (
            <div className={styles.appointmentsList}>
              {todayAppointments.slice(0, 5).map((appt) => (
                <div key={appt.id} className={styles.appointmentItem}>
                  <div className={styles.apptTime}>
                    <span className={styles.time}>
                      {appt.appointment_time}
                    </span>
                  </div>
                  <div className={styles.apptInfo}>
                    <p className={styles.patientName}>
                      {appt.patient_name}
                    </p>
                    <p className={styles.patientContact}>
                      📞 {appt.patient_phone}
                    </p>
                  </div>
                  <div className={styles.apptStatus}>
                    <span className={`${styles.badge} ${styles[appt.status]}`}>
                      {appt.status === 'scheduled' && '⏳ Pendiente'}
                      {appt.status === 'completed' && '✅ Completada'}
                      {appt.status === 'cancelled' && '❌ Cancelada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className={styles.quickStats}>
          <div className={styles.quickStatItem}>
            <h4>⏱️ Velocidad Promedio</h4>
            <p>Citas en tiempo</p>
          </div>
          <div className={styles.quickStatItem}>
            <h4>⭐ Calificación</h4>
            <p>Excelente servicio</p>
          </div>
          <div className={styles.quickStatItem}>
            <h4>🎯 Tasa Asistencia</h4>
            <p>95% de citas</p>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
