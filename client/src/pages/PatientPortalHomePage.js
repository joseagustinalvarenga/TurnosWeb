import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import styles from './PatientPortalHomePage.module.css';

export default function PatientPortalHomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('search'); // 'search' o 'book'
  const [searchType, setSearchType] = useState('data'); // 'data' o 'code'
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    documentNumber: ''
  });
  const [appointmentCode, setAppointmentCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // State para agendar turno
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Cargar especialidades al montar el componente
  useEffect(() => {
    loadSpecializations();
  }, []);

  // Cargar médicos cuando cambia la especialidad
  useEffect(() => {
    if (selectedSpecialization) {
      loadDoctors(selectedSpecialization);
      setSelectedDoctor('');
      setDoctors([]);
    }
  }, [selectedSpecialization]);

  // Cargar horarios cuando cambia el médico o fecha
  useEffect(() => {
    if (selectedDoctor && appointmentDate) {
      loadAvailableSlots(selectedDoctor, appointmentDate);
    }
  }, [selectedDoctor, appointmentDate]);

  const loadSpecializations = async () => {
    try {
      const response = await appointmentAPI.getPublicSpecializations();
      if (response.success) {
        setSpecializations(response.specializations);
      }
    } catch (err) {
      console.error('Error cargando especialidades:', err);
    }
  };

  const loadDoctors = async (specialization) => {
    try {
      const response = await appointmentAPI.getPublicDoctors(specialization);
      if (response.success) {
        setDoctors(response.doctors);
      }
    } catch (err) {
      console.error('Error cargando médicos:', err);
      setBookingError('Error al cargar médicos');
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      const response = await appointmentAPI.getPublicAvailableSlots(doctorId, date);
      if (response.success) {
        setAvailableSlots(response.slots || []);
        setSelectedSlot('');
      }
    } catch (err) {
      console.error('Error cargando horarios:', err);
      setAvailableSlots([]);
    }
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (searchType === 'data') {
        // Búsqueda por datos personales
        const response = await appointmentAPI.searchByPatientData({
          name: formData.name,
          lastName: formData.lastName,
          documentNumber: formData.documentNumber
        });

        if (response.success && response.appointment) {
          sessionStorage.setItem('appointmentCode', response.appointment.id);
          setTimeout(() => {
            navigate(`/patient/appointment/${response.appointment.id}`, {
              state: { appointment: response.appointment }
            });
          }, 500);
        }
      } else {
        // Búsqueda por código
        const code = appointmentCode.trim().toUpperCase();

        if (!code || code.length < 8) {
          setError('El código debe tener al menos 8 caracteres');
          setLoading(false);
          return;
        }

        sessionStorage.setItem('appointmentCode', code);
        setTimeout(() => {
          navigate(`/patient/appointment/${code}`);
        }, 500);
      }
    } catch (err) {
      console.error('Error buscando cita:', err);
      setError(
        err.response?.data?.message ||
        'No se encontró ninguna cita. Verifica tu información e intenta nuevamente.'
      );
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}></div>

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.headerSection}>
          <h2 className={styles.clinicName}>MediHub</h2>
          <h1 className={styles.mainTitle}>Consulta tu Turno</h1>
          <p className={styles.subtitle}>Ingresa tus datos para ver el estado de tu cita</p>
        </div>

        <div className={styles.card}>
          {/* Tabs principales */}
          <div className={styles.mainTabs}>
            <button
              className={`${styles.mainTab} ${activeTab === 'search' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('search');
                setError('');
              }}
            >
              🔍 Buscar Turno
            </button>
            <button
              className={`${styles.mainTab} ${activeTab === 'book' ? styles.active : ''}`}
              onClick={() => {
                setActiveTab('book');
                setBookingError('');
              }}
            >
              📅 Agendar Turno
            </button>
          </div>

          {/* Tabs de búsqueda (solo en pestaña search) */}
          {activeTab === 'search' && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${searchType === 'data' ? styles.active : ''}`}
                onClick={() => {
                  setSearchType('data');
                  setError('');
                }}
              >
                Buscar por Datos
              </button>
              <button
                className={`${styles.tab} ${searchType === 'code' ? styles.active : ''}`}
                onClick={() => {
                  setSearchType('code');
                  setError('');
                }}
              >
                Buscar por Código
              </button>
            </div>
          )}

          {/* Formulario - BÚSQUEDA DE TURNO */}
          {activeTab === 'search' && searchType === 'data' && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h3 className={styles.formTitle}>Buscar Turno</h3>
              <p className={styles.formSubtitle}>Completa los campos para encontrar tu cita</p>

              <div className={styles.formGroup}>
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleDataChange}
                  placeholder="Ej: Juan"
                  className={styles.input}
                  disabled={loading}
                />
                <small>Ingresa tu nombre</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName">Apellido</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleDataChange}
                  placeholder="Ej: García"
                  className={styles.input}
                  disabled={loading}
                />
                <small>Ingresa tu apellido</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="documentNumber">DNI / Documento</label>
                <input
                  type="text"
                  id="documentNumber"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleDataChange}
                  placeholder="Ej: 12345678"
                  className={styles.input}
                  disabled={loading}
                />
                <small>Ingresa tu número de documento</small>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? '⏳ Buscando...' : '🔍 Buscar Turno'}
              </button>
            </form>
          )}

          {/* Formulario - Búsqueda por código */}
          {activeTab === 'search' && searchType === 'code' && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <h3 className={styles.formTitle}>Ingresa tu Código</h3>
              <p className={styles.formSubtitle}>Usa el código que recibiste por email o SMS</p>

              <div className={styles.formGroup}>
                <label htmlFor="code">Código de Turno</label>
                <input
                  type="text"
                  id="code"
                  value={appointmentCode}
                  onChange={(e) => {
                    setAppointmentCode(e.target.value);
                    setError('');
                  }}
                  placeholder="Ej: ABC123DEF456"
                  className={styles.input}
                  disabled={loading}
                />
                <small>📌 Lo encontrarás en el comprobante o SMS</small>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? '⏳ Buscando...' : '🔍 Ver Mi Turno'}
              </button>
            </form>
          )}

          {/* Formulario - AGENDAR TURNO */}
          {activeTab === 'book' && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              // Aquí irá la lógica para crear la cita
              console.log('Agendar turno:', { selectedSpecialization, selectedDoctor, appointmentDate, selectedSlot });
            }} className={styles.form}>
              <h3 className={styles.formTitle}>Agendar Turno</h3>
              <p className={styles.formSubtitle}>Selecciona especialidad, médico y horario</p>

              <div className={styles.formGroup}>
                <label htmlFor="specialization">Especialidad</label>
                <select
                  id="specialization"
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className={styles.select}
                  disabled={bookingLoading}
                >
                  <option value="">Selecciona una especialidad</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <small>Elige el área médica que necesitas</small>
              </div>

              {selectedSpecialization && doctors.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="doctor">Médico</label>
                  <select
                    id="doctor"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                    className={styles.select}
                    disabled={bookingLoading}
                  >
                    <option value="">Selecciona un médico</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.name}
                      </option>
                    ))}
                  </select>
                  <small>Elige el médico que prefieres</small>
                </div>
              )}

              {selectedDoctor && (
                <div className={styles.formGroup}>
                  <label htmlFor="date">Fecha</label>
                  <input
                    type="date"
                    id="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className={styles.input}
                    disabled={bookingLoading}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <small>Elige la fecha deseada</small>
                </div>
              )}

              {appointmentDate && availableSlots.length > 0 && (
                <div className={styles.formGroup}>
                  <label htmlFor="slot">Horario</label>
                  <select
                    id="slot"
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    className={styles.select}
                    disabled={bookingLoading}
                  >
                    <option value="">Selecciona un horario</option>
                    {availableSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                  <small>Elige tu horario preferido</small>
                </div>
              )}

              {appointmentDate && availableSlots.length === 0 && (
                <div className={styles.warning}>
                  No hay horarios disponibles para la fecha seleccionada
                </div>
              )}

              {bookingError && <div className={styles.error}>{bookingError}</div>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!selectedSpecialization || !selectedDoctor || !appointmentDate || !selectedSlot || bookingLoading}
              >
                {bookingLoading ? '⏳ Agendando...' : '✓ Agendar Turno'}
              </button>
            </form>
          )}

          {/* Help Section */}
          <div className={styles.helpSection}>
            <h4 className={styles.helpTitle}>¿Necesitas ayuda?</h4>
            <p className={styles.helpText}>
              Si no encuentras tu turno, verifica que hayas ingresado correctamente tus datos.
            </p>
          </div>

          {/* Footer Info */}
          <div className={styles.footerInfo}>
            <p><strong>Teléfono:</strong> (555) 123-4567</p>
            <p><strong>Email:</strong> turnos@medihub.com</p>
            <p><strong>Dirección:</strong> Calle Principal 123 - De Lunes a Viernes 9:00 AM a 6:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
