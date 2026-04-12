import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/config.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Registro de doctor
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, specialization, clinic_name } = req.body;

    // Validación básica
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, contraseña y nombre son requeridos'
      });
    }

    // Verificar que el email no exista
    const existingDoctor = await query(
      'SELECT id FROM doctors WHERE email = $1',
      [email]
    );

    if (existingDoctor.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear doctor
    const result = await query(
      `INSERT INTO doctors (email, password_hash, name, specialization, clinic_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, specialization, clinic_name`,
      [email, hashedPassword, name, specialization, clinic_name]
    );

    const doctor = result.rows[0];
    const token = generateToken(doctor);

    res.status(201).json({
      success: true,
      message: 'Doctor registrado exitosamente',
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        specialization: doctor.specialization,
        clinic_name: doctor.clinic_name
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar doctor'
    });
  }
});

// Login de doctor
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Buscar doctor
    const result = await query(
      'SELECT * FROM doctors WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    const doctor = result.rows[0];

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, doctor.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email o contraseña incorrectos'
      });
    }

    // Generar token
    const token = generateToken(doctor);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      doctor: {
        id: doctor.id,
        email: doctor.email,
        name: doctor.name,
        specialization: doctor.specialization,
        clinic_name: doctor.clinic_name
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
});

// Verificar token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const doctor = await query(
      'SELECT id, email, name, specialization, clinic_name FROM doctors WHERE id = $1',
      [req.user.id]
    );

    if (doctor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.json({
      success: true,
      doctor: doctor.rows[0]
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
});

// Logout (en cliente se borra el token)
router.post('/logout', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

export default router;
