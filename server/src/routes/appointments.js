import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';

const router = express.Router();

// Obtener citas del doctor
router.get('/', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 2
    res.json({
      success: true,
      message: 'Funcionalidad de citas en desarrollo (FASE 2)',
      appointments: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas'
    });
  }
});

// Crear cita
router.post('/', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 2
    res.status(201).json({
      success: true,
      message: 'Funcionalidad de crear cita en desarrollo (FASE 2)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear cita'
    });
  }
});

// Actualizar estado de cita
router.patch('/:appointmentId', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 2
    res.json({
      success: true,
      message: 'Funcionalidad de actualizar cita en desarrollo (FASE 2)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cita'
    });
  }
});

// Portal paciente: Ver cita por código
router.get('/patient/:appointmentCode', async (req, res) => {
  try {
    // TODO: Implementar en FASE 4 (Portal Paciente)
    res.json({
      success: true,
      message: 'Portal de paciente en desarrollo (FASE 4)'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener información de cita'
    });
  }
});

export default router;
