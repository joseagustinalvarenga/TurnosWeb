import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import DoctorLayout from '../components/DoctorLayout';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { googleAPI } from '../services/api';
import styles from './SettingsPage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function SettingsPage() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [profileData, setProfileData] = useState({
    specialization: '',
    clinic_name: '',
    license_number: '',
    phone: '',
    address: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchGoogleStatus();

    // Cargar datos del usuario
    if (user) {
      setProfileData({
        specialization: user.specialization || '',
        clinic_name: user.clinic_name || '',
        license_number: user.license_number || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }

    // Detectar si viene del callback de Google
    if (searchParams.get('connected') === 'true') {
      setSuccessMessage('✓ Google Calendar conectado exitosamente');
      setTimeout(() => setSuccessMessage(''), 5000);
    }

    if (searchParams.get('error') === 'true') {
      setSuccessMessage('✗ Error al conectar Google Calendar');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams, user]);

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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/auth/profile`,
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSuccessMessage('✓ Perfil actualizado correctamente');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error guardando perfil:', err);
      setSuccessMessage('✗ Error al guardar cambios');
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setSavingProfile(false);
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

        {/* Profile Settings */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <Icon name="users" size={24} color="#2563eb" />
              Datos Profesionales
            </div>
            <p className={styles.sectionDescription}>
              Actualiza tu información profesional y de contacto
            </p>
          </div>

          <div className={styles.card}>
            <form onSubmit={handleSaveProfile} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="specialization">Especialidad de Medicina</label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={profileData.specialization}
                    onChange={handleProfileChange}
                    placeholder="Ej: Cardiología, Dermatología, etc."
                    disabled={savingProfile}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="license_number">Número de Matrícula</label>
                  <input
                    type="text"
                    id="license_number"
                    name="license_number"
                    value={profileData.license_number}
                    onChange={handleProfileChange}
                    placeholder="Ej: MED-123456"
                    disabled={savingProfile}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="clinic_name">Nombre de la Clínica</label>
                  <input
                    type="text"
                    id="clinic_name"
                    name="clinic_name"
                    value={profileData.clinic_name}
                    onChange={handleProfileChange}
                    placeholder="Ej: Clínica Central"
                    disabled={savingProfile}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Ej: +54 9 11 1234-5678"
                    disabled={savingProfile}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="address">Dirección</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  placeholder="Ej: Calle Principal 123, Departamento 4"
                  disabled={savingProfile}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={savingProfile}
              >
                {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DoctorLayout>
  );
}
