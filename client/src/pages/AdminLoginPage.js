import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import Icon from '../components/Icon';
import styles from './AdminLoginPage.module.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, loading, error, setError, isAuthenticated } = useAdminAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftSide}>
        <div className={styles.branding}>
          <h1 className={styles.brandTitle}>MediHub Admin</h1>
          <p className={styles.brandSubtitle}>Panel de Administración</p>

          <div className={styles.features}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>👤</div>
              <div>
                <h3>Gestión de Doctores</h3>
                <p>Aprueba y supervisa doctores</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>💰</div>
              <div>
                <h3>Control de Suscripciones</h3>
                <p>Administra suscripciones activas</p>
              </div>
            </div>

            <div className={styles.feature}>
              <div className={styles.featureIcon}>📊</div>
              <div>
                <h3>Reportes</h3>
                <p>Visualiza métricas del sistema</p>
              </div>
            </div>
          </div>
        </div>

        <Link to="/login" className={styles.doctorLinkLeft}>
          👨‍⚕️ Entrar como Doctor
        </Link>
      </div>

      <div className={styles.rightSide}>
        <div className={styles.card}>
          <h2 className={styles.title}>Inicia Sesión Administrador</h2>
          <p className={styles.subtitle}>Accede al panel de administración</p>

          {(localError || error) && (
            <div className={styles.error}>
              {localError || error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
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
            <p>¿Olviste tu contraseña?</p>
            <a href="#" className={styles.link}>
              Contacta al administrador del sistema
            </a>
          </div>
        </div>

        <div className={styles.credentials}>
          <p className={styles.credentialsTitle}>Credenciales de Prueba:</p>
          <div className={styles.credentialsBox}>
            <div className={styles.credItem}>
              <span className={styles.label}>Email:</span>
              <code>admin@example.com</code>
            </div>
            <div className={styles.credItem}>
              <span className={styles.label}>Contraseña:</span>
              <code>adminpass123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
