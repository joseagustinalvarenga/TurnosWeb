import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Icon from '../components/Icon';
import styles from './LoginPage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, setError, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }

    // Mostrar error de Google si viene en query params
    const googleError = searchParams.get('error');
    if (googleError) {
      setLocalError(`Error de Google: ${googleError}`);
    }
  }, [isAuthenticated, navigate, searchParams]);

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

    if (!formData.email || !formData.password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setLocalError(result.error);
      // Los errores pending y subscriptionExpired son manejados por el contexto
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.branding}>
          <h1 className={styles.brandTitle}>MediHub</h1>
          <p className={styles.brandSubtitle}>Sistema de Gestión de Turnos Médicos</p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Gestión Eficiente</h3>
                <p>Administra tus citas de forma rápida y segura</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Tiempo Real</h3>
                <p>Actualizaciones instantáneas de tus turnos</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>✓</div>
              <div>
                <h3>Portal Paciente</h3>
                <p>Tus pacientes ven el estado de sus citas</p>
              </div>
            </div>
          </div>
        </div>

        <Link to="/admin/login" className={styles.adminLinkLeft}>
          🔐 Entrar como Administrador
        </Link>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.card}>
          <h2 className={styles.title}>Inicia Sesión</h2>
          <p className={styles.subtitle}>Accede a tu panel de doctor</p>

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
            Continuar con Google
          </button>

          <div className={styles.divider}>
            <span>o</span>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@email.com"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password">Contraseña</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} color="#64748b" />
                </button>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p>¿No tienes cuenta?</p>
            <Link to="/register" className={styles.link}>
              Regístrate como doctor
            </Link>
          </div>
        </div>

        <div className={styles.credentials}>
          <p className={styles.credentialsTitle}>Credenciales de Prueba:</p>
          <div className={styles.credentialsBox}>
            <div className={styles.credItem}>
              <span className={styles.label}>Email:</span>
              <code>doctor@example.com</code>
            </div>
            <div className={styles.credItem}>
              <span className={styles.label}>Contraseña:</span>
              <code>password123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
