import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';
import { query } from '../db/config.js';

const router = express.Router();

// Obtener perfil del doctor
router.get('/profile', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, name, specialization, phone, clinic_name, clinic_address, profile_image_url
       FROM doctors WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.json({
      success: true,
      doctor: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del doctor'
    });
  }
});

// Actualizar perfil del doctor
router.patch('/profile', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    const { name, specialization, phone, clinic_name, clinic_address } = req.body;

    const result = await query(
      `UPDATE doctors
       SET name = COALESCE($1, name),
           specialization = COALESCE($2, specialization),
           phone = COALESCE($3, phone),
           clinic_name = COALESCE($4, clinic_name),
           clinic_address = COALESCE($5, clinic_address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, email, name, specialization, phone, clinic_name, clinic_address`,
      [name, specialization, phone, clinic_name, clinic_address, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      doctor: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil'
    });
  }
});

// Dashboard del doctor (resumen)
router.get('/dashboard', verifyToken, verifyDoctorRole, async (req, res) => {
  try {
    // TODO: Implementar en FASE 3
    res.json({
      success: true,
      message: 'Dashboard en desarrollo (FASE 3)',
      stats: {
        total_appointments: 0,
        total_patients: 0,
        appointments_today: 0,
        pending_appointments: 0
      }
    });
  } catch (error) {
    console.error('Error al obtener dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard'
    });
  }
});

export default router;
