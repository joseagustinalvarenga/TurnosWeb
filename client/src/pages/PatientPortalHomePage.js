import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './PatientPortalHomePage.module.css';

export default function PatientPortalHomePage() {
  const navigate = useNavigate();
  const [appointmentCode, setAppointmentCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = appointmentCode.trim().toUpperCase();

    if (!code) {
      setError('Por favor ingresa tu código de turno');
      return;
    }

    if (code.length < 8) {
      setError('El código debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    // Guardar el código en sessionStorage y navegar
    sessionStorage.setItem('appointmentCode', code);
    setTimeout(() => {
      navigate(`/patient/appointment/${code}`);
    }, 500);
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

          {/* Formulario */}
          <form onSubmit={handleSubmit} className={styles.form}>
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
                placeholder="Ingresa tu código"
                className={styles.input}
                disabled={loading}
                autoFocus
              />
              <small className={styles.hint}>
                📌 Lo encontrarás en el comprobante o SMS que recibiste
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
