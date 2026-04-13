import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
import styles from './PatientPortalHomePage.module.css';

export default function PatientPortalHomePage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState('code'); // 'code' o 'name'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const input = searchInput.trim();

    if (!input) {
      setError(
        searchType === 'code'
          ? 'Por favor ingresa tu código de turno'
          : 'Por favor ingresa tu nombre'
      );
      return;
    }

    if (searchType === 'code' && input.length < 8) {
      setError('El código debe tener al menos 8 caracteres');
      return;
    }

    if (searchType === 'name' && input.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (searchType === 'code') {
        const code = input.toUpperCase();
        sessionStorage.setItem('appointmentCode', code);
        setTimeout(() => {
          navigate(`/patient/appointment/${code}`);
        }, 500);
      } else {
        // Buscar por nombre
        const response = await appointmentAPI.getByPatientName(input);
        if (response.success && response.appointment) {
          // Navegar a la cita encontrada usando el ID
          sessionStorage.setItem('appointmentCode', response.appointment.id);
          setTimeout(() => {
            navigate(`/patient/appointment/${response.appointment.id}`, {
              state: { appointment: response.appointment }
            });
          }, 500);
        }
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
        <div className={styles.card}>
          {/* Encabezado */}
          <div className={styles.header}>
            <div className={styles.logo}>🏥</div>
            <h1 className={styles.title}>Seguimiento de Turno</h1>
            <p className={styles.subtitle}>
              Consulta el estado de tu cita médica en tiempo real
            </p>
          </div>

          {/* Opciones de búsqueda */}
          <div className={styles.searchTypeSelector}>
            <button
              type="button"
              className={`${styles.searchTypeBtn} ${searchType === 'code' ? styles.active : ''}`}
              onClick={() => {
                setSearchType('code');
                setError('');
              }}
            >
              📝 Por Código
            </button>
            <button
              type="button"
              className={`${styles.searchTypeBtn} ${searchType === 'name' ? styles.active : ''}`}
              onClick={() => {
                setSearchType('name');
                setError('');
              }}
            >
              👤 Por Nombre
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="search">
                {searchType === 'code' ? 'Código de Turno' : 'Tu Nombre Completo'}
              </label>
              <input
                type="text"
                id="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setError('');
                }}
                placeholder={
                  searchType === 'code'
                    ? 'Ej: ABC123DEF456'
                    : 'Ej: Juan Pérez'
                }
                className={styles.input}
                disabled={loading}
                autoFocus
              />
              <small className={styles.hint}>
                {searchType === 'code'
                  ? '📌 Lo encontrarás en el comprobante o SMS que recibiste'
                  : '📌 Usa el nombre tal como está registrado en la clínica'}
              </small>
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

          {/* Información adicional */}
          <div className={styles.infoBox}>
            <h3>💡 ¿Cómo funciona?</h3>
            <ol className={styles.steps}>
              <li>Ingresa el código de tu turno</li>
              <li>Verás el estado en tiempo real</li>
              <li>Te avisaremos cuando sea tu turno</li>
              <li>¡Listo para tu cita! 🎯</li>
            </ol>
          </div>

          {/* Beneficios */}
          <div className={styles.benefitsBox}>
            <div className={styles.benefit}>
              <span className={styles.icon}>⏱️</span>
              <span className={styles.text}>Tiempo real</span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.icon}>📍</span>
              <span className={styles.text}>Tu posición en cola</span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.icon}>🔔</span>
              <span className={styles.text}>Notificaciones</span>
            </div>
            <div className={styles.benefit}>
              <span className={styles.icon}>📱</span>
              <span className={styles.text}>Responsive</span>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <p>¿Necesitas ayuda?</p>
            <a href="tel:+56912345678" className={styles.link}>
              📞 Llamar a la clínica
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
