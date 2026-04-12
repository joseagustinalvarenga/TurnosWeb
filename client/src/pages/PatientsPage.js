import React, { useState, useEffect } from 'react';
import DoctorLayout from '../components/DoctorLayout';
import { patientAPI } from '../services/api';
import styles from './PatientsPage.module.css';

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'M',
    address: ''
  });

  // Cargar pacientes
  useEffect(() => {
    fetchPatients();
  }, []);

  // Filtrar pacientes
  useEffect(() => {
    if (searchTerm) {
      const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone?.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientAPI.getPatients();

      if (response.success) {
        setPatients(response.patients);
      }

      setError(null);
    } catch (err) {
      console.error('Error cargando pacientes:', err);
      setError('Error al cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    try {
      let response;

      if (editingId) {
        response = await patientAPI.updatePatient(editingId, formData);
        if (response.success) {
          setPatients(prev =>
            prev.map(p => p.id === editingId ? response.patient : p)
          );
          alert('Paciente actualizado exitosamente');
        }
      } else {
        response = await patientAPI.createPatient(formData);
        if (response.success) {
          setPatients(prev => [response.patient, ...prev]);
          alert('Paciente creado exitosamente');
        }
      }

      resetForm();
    } catch (err) {
      console.error('Error guardando paciente:', err);
      alert('Error al guardar el paciente');
    }
  };

  const handleEdit = (patient) => {
    setFormData({
      name: patient.name,
      email: patient.email || '',
      phone: patient.phone || '',
      date_of_birth: patient.date_of_birth || '',
      gender: patient.gender || 'M',
      address: patient.address || ''
    });
    setEditingId(patient.id);
    setShowForm(true);
  };

  const handleDelete = async (patientId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      return;
    }

    try {
      const response = await patientAPI.deletePatient(patientId);
      if (response.success) {
        setPatients(prev => prev.filter(p => p.id !== patientId));
        alert('Paciente eliminado exitosamente');
      }
    } catch (err) {
      console.error('Error eliminando paciente:', err);
      alert('Error al eliminar el paciente');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'M',
      address: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <DoctorLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Cargando pacientes...</p>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout>
      <div className={styles.patientsPage}>
        <div className={styles.header}>
          <h1>👥 Mis Pacientes</h1>
          <button
            className={styles.addBtn}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Nuevo Paciente
          </button>
        </div>

        {error && (
          <div className={styles.alert}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className={styles.formContainer}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <h3>{editingId ? 'Editar Paciente' : 'Nuevo Paciente'}</h3>

              <div className={styles.formGroup}>
                <label>Nombre *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="email@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="+56912345678"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleFormChange}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Género</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="O">Otro</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Dirección"
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn}>
                  {editingId ? 'Actualizar' : 'Crear'} Paciente
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Búsqueda */}
        <div className={styles.controls}>
          <input
            type="text"
            placeholder="🔍 Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button
            className={styles.refreshBtn}
            onClick={fetchPatients}
            title="Actualizar"
          >
            🔄
          </button>
        </div>

        {/* Lista de pacientes */}
        <div className={styles.listContainer}>
          {filteredPatients.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No hay pacientes registrados 📋</p>
            </div>
          ) : (
            <div className={styles.patientsList}>
              {filteredPatients.map((patient) => (
                <div key={patient.id} className={styles.patientCard}>
                  <div className={styles.patientHeader}>
                    <h3 className={styles.patientName}>{patient.name}</h3>
                    <div className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEdit(patient)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(patient.id)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className={styles.patientInfo}>
                    {patient.email && (
                      <p className={styles.infoItem}>
                        📧 <a href={`mailto:${patient.email}`}>{patient.email}</a>
                      </p>
                    )}
                    {patient.phone && (
                      <p className={styles.infoItem}>
                        📞 <a href={`tel:${patient.phone}`}>{patient.phone}</a>
                      </p>
                    )}
                    {patient.date_of_birth && (
                      <p className={styles.infoItem}>
                        🎂 {new Date(patient.date_of_birth).toLocaleDateString('es-ES')}
                      </p>
                    )}
                    {patient.gender && (
                      <p className={styles.infoItem}>
                        👤 {patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}
                      </p>
                    )}
                    {patient.address && (
                      <p className={styles.infoItem}>
                        📍 {patient.address}
                      </p>
                    )}
                  </div>

                  <div className={styles.patientFooter}>
                    <small>Registrado: {new Date(patient.created_at).toLocaleDateString('es-ES')}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen */}
        <div className={styles.summary}>
          <p>
            Mostrando <strong>{filteredPatients.length}</strong> de{' '}
            <strong>{patients.length}</strong> pacientes
          </p>
        </div>
      </div>
    </DoctorLayout>
  );
}
