import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';

const router = express.Router();

// Obtener todos los pacientes del doctor
router.get('/', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 3
    res.json({
      success: true,
      message: 'Funcionalidad de pacientes en desarrollo (FASE 3)',
      patients: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener pacientes'
    });
  }
});

// Crear nuevo paciente
router.post('/', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 3
    res.status(201).json({
      success: true,
      message: 'Funcionalidad de crear paciente en desarrollo (FASE 3)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear paciente'
    });
  }
});

// Obtener detalles de un paciente
router.get('/:patientId', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 3
    res.json({
      success: true,
      message: 'Funcionalidad de obtener paciente en desarrollo (FASE 3)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener paciente'
    });
  }
});

// Actualizar paciente
router.patch('/:patientId', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 3
    res.json({
      success: true,
      message: 'Funcionalidad de actualizar paciente en desarrollo (FASE 3)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar paciente'
    });
  }
});

export default router;
