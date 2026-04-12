import React, { useState, useEffect } from 'react';
import DoctorLayout from '../components/DoctorLayout';
import { appointmentAPI } from '../services/api';
import { useWebSocketContext } from '../hooks/useWebSocketContext';
import styles from './AppointmentsPage.module.css';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const { isConnected } = useWebSocketContext();

  // Cargar citas
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let filtered = appointments;

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    // Filtrar por fecha
    if (filterDate) {
      filtered = filtered.filter(a => a.appointment_date === filterDate);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.patient_phone.includes(searchTerm)
      );
    }

    setFilteredAppointments(filtered);
  }, [appointments, searchTerm, filterStatus, filterDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getAppointments();

      if (response.success) {
        // Ordenar por fecha y hora
        const sorted = response.appointments.sort((a, b) => {
          const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
          const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
          return dateB - dateA;
        });
        setAppointments(sorted);
      }

      setError(null);
    } catch (err) {
      console.error('Error cargando citas:', err);
      setError('Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      const response = await appointmentAPI.updateAppointment(appointmentId, {
        status: newStatus
      });

      if (response.success) {
        setAppointments(prev =>
          prev.map(a => a.id === appointmentId ? response.appointment : a)
        );
      }
    } catch (err) {
      console.error('Error actualizando cita:', err);
      alert('Error al actualizar la cita');
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
        return '⏳ Pendiente';
      case 'completed':
        return '✅ Completada';
      case 'cancelled':
        return '❌ Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando citas...</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className={styles.appointmentsPage}>
        <div className={styles.header}>
          <h1>📅 Mis Citas</h1>
          <button className={styles.addBtn}>+ Nueva Cita</button>
        </div>

        {error && (
          <div className={styles.alert}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Controles de filtro */}
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.select}
          >
            <option value="all">Todos los estados</option>
            <option value="scheduled">⏳ Pendiente</option>
            <option value="completed">✅ Completada</option>
            <option value="cancelled">❌ Cancelada</option>
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={styles.select}
          />

          <button
            className={styles.refreshBtn}
            onClick={fetchAppointments}
            title="Actualizar"
          >
            🔄
          </button>
        </div>

        {/* Tabla de citas */}
        <div className={styles.tableContainer}>
          {filteredAppointments.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay citas que coincidan con los filtros 📋</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Paciente</th>
                  <th>Contacto</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className={styles.row}>
                    <td className={styles.time}>
                      <strong>{appt.appointment_time}</strong>
                    </td>
                    <td className={styles.patientName}>
                      {appt.patient_name}
                    </td>
                    <td className={styles.contact}>
                      📞 {appt.patient_phone}
                    </td>
                    <td className={styles.date}>
                      {new Date(appt.appointment_date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className={styles.reason}>
                      {appt.reason_for_visit || '-'}
                    </td>
                    <td className={styles.status}>
                      <select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                        className={`${styles.statusSelect} ${styles[getStatusColor(appt.status)]}`}
                      >
                        <option value="scheduled">⏳ Pendiente</option>
                        <option value="completed">✅ Completada</option>
                        <option value="cancelled">❌ Cancelada</option>
                      </select>
                    </td>
                    <td className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteBtn}
                        title="Cancelar"
                        onClick={() => handleStatusChange(appt.id, 'cancelled')}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen */}
        <div className={styles.summary}>
          <p>
            Mostrando <strong>{filteredAppointments.length}</strong> de{' '}
            <strong>{appointments.length}</strong> citas
            {isConnected && ' 🟢'}
          </p>
        </div>
      </div>
    </DoctorLayout>
  );
}
