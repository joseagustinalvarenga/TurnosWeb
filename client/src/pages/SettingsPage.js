import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DoctorLayout from '../components/DoctorLayout';
import Icon from '../components/Icon';
import { googleAPI } from '../services/api';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchGoogleStatus();

    // Detectar si viene del callback de Google
    if (searchParams.get('connected') === 'true') {
      setSuccessMessage('✓ Google Calendar conectado exitosamente');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (searchParams.get('error') === 'true') {
      setSuccessMessage('✗ Error al conectar Google Calendar');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams]);

  const fetchGoogleStatus = async () => {
    try {
      setLoading(true);
      const response = await googleAPI.getStatus();
      setGoogleConnected(response.connected || false);
    } catch (err) {
      console.error('Error obteniendo estado de Google:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    try {
      // Obtener el token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setSuccessMessage('✗ No hay sesión activa');
        return;
      }

      // Redirigir a Google con el token en la query string
      window.location.href = `http://localhost:5002/api/google/auth?token=${token}`;
    } catch (err) {
      console.error('Error conectando:', err);
      setSuccessMessage('✗ Error al conectar');
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('¿Desconectar Google Calendar?')) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await googleAPI.disconnect();

      if (response.success) {
        setGoogleConnected(false);
        setSuccessMessage('✓ Google Calendar desconectado');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error desconectando:', err);
      setSuccessMessage('✗ Error al desconectar');
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <DoctorLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Configuración</h1>
          <p className={styles.subtitle}>Gestiona tu cuenta y preferencias</p>
        </div>

        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        {/* Google Calendar Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Icon name="calendar" size={24} color="#2563eb" />
              Google Calendar
            </div>
            <p className={styles.sectionDescription}>
              Sincroniza automáticamente tus citas con Google Calendar. Cuando crees, actualices o canceles una cita, se reflejará en tu calendario de Google.
            </p>
          </div>

          <div className={styles.card}>
            {loading ? (
              <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando estado...</p>
              </div>
            ) : (
              <>
                <div className={styles.statusSection}>
                  <div className={styles.statusIndicator}>
                    <div className={`${styles.statusDot} ${googleConnected ? styles.connected : styles.disconnected}`}></div>
                    <div>
                      <h3 className={styles.statusLabel}>
                        {googleConnected ? 'Conectado' : 'Desconectado'}
                      </h3>
                      <p className={styles.statusDescription}>
                        {googleConnected
                          ? 'Tu Google Calendar está sincronizado con MediHub'
                          : 'Conecta tu Google Calendar para sincronizar automáticamente tus citas'}
                      </p>
                    </div>
                  </div>

                  {googleConnected ? (
                    <button
                      className={styles.disconnectBtn}
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                    >
                      {disconnecting ? 'Desconectando...' : 'Desconectar'}
                    </button>
                  ) : (
                    <button
                      className={styles.connectBtn}
                      onClick={handleConnect}
                    >
                      <Icon name="check" size={18} color="currentColor" />
                      Conectar Google Calendar
                    </button>
                  )}
                </div>

                {googleConnected && (
                  <div className={styles.benefits}>
                    <h4>Beneficios:</h4>
                    <ul>
                      <li>✓ Las citas se crean automáticamente en Google Calendar</li>
                      <li>✓ Cambios en el estado de citas se sincronizan al instante</li>
                      <li>✓ Puedes ver tus citas desde cualquier dispositivo</li>
                      <li>✓ Notificaciones de Google Calendar integradas</li>
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Other Settings Placeholder */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <Icon name="settings" size={24} color="#2563eb" />
            Más Configuraciones
          </div>
          <div className={styles.card}>
            <p className={styles.comingSoon}>Más opciones de configuración próximamente...</p>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
