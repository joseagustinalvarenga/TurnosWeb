import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/Icon';
import styles from './RegisterPage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error, setError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    specialization: '',
    clinic_name: ''
  });
  const [localError, setLocalError] = useState('');
  const [registrationPending, setRegistrationPending] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!formData.email || !formData.password || !formData.name) {
      setLocalError('Por favor completa los campos requeridos');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      specialization: formData.specialization,
      clinic_name: formData.clinic_name
    });

    if (result.success) {
      if (result.pending) {
        // Mostrar mensaje de cuenta pendiente
        setRegistrationPending(true);
        setLocalError('');
      } else {
        // Caso normal - ir al dashboard
        navigate('/dashboard');
      }
    } else {
      setLocalError(result.error);
    }
  };

  if (registrationPending) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>¡Cuenta Creada!</h1>
            <p className={styles.subtitle}>Pendiente de aprobación</p>
          </div>

          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <p>
              Tu cuenta ha sido creada correctamente. El administrador revisará tu solicitud y recibirás acceso una vez aprobada.
            </p>
            <p>
              Este proceso generalmente toma poco tiempo. Revisa tu email para más información.
            </p>
          </div>

          <Link to="/login" className={styles.backLink}>
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Crear Cuenta de Doctor</h1>
          <p className={styles.subtitle}>Regístrate para comenzar</p>
        </div>

        {(localError || error) && (
          <div className={styles.error}>
            {localError || error}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            window.location.href = `${API_BASE_URL}/api/auth/google`;
          }}
          className={styles.googleBtn}
          disabled={loading}
        >
          <Icon name="mail" size={18} color="currentColor" />
          Crear Cuenta con Google
        </button>

        <div className={styles.divider}>
          <span>o</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name">Nombre Completo *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dr. Juan Pérez"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="specialization">Especialización</label>
            <input
              type="text"
              id="specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="ej. Cardiología"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="clinic_name">Nombre de la Clínica</label>
            <input
              type="text"
              id="clinic_name"
              name="clinic_name"
              value={formData.clinic_name}
              onChange={handleChange}
              placeholder="ej. Clínica La Salud"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className={styles.link}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
