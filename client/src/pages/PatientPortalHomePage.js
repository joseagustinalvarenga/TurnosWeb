import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import styles from './PatientPortalHomePage.module.css';

export default function PatientPortalHomePage() {
  const navigate = useNavigate();
  const [searchType, setSearchType] = useState('data'); // 'data' o 'code'
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    documentNumber: ''
  });
  const [appointmentCode, setAppointmentCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          <h2 className={styles.clinicName}>CLÍNICA CENTRAL</h2>
          <h1 className={styles.mainTitle}>Consulta tu Turno</h1>
          <p className={styles.subtitle}>Ingresa tus datos para ver el estado de tu cita</p>
        </div>

        <div className={styles.card}>
          {/* Tabs de búsqueda */}
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

          {/* Formulario - Búsqueda por datos */}
          {searchType === 'data' && (
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
          {searchType === 'code' && (
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
            <p><strong>Email:</strong> turnos@clinicacentral.com</p>
            <p><strong>Dirección:</strong> Calle Principal 123 - De Lunes a Viernes 9:00 AM a 6:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
