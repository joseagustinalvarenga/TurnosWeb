import express from 'express';
import { verifyToken, verifyDoctorRole } from '../middleware/auth.js';
import * as appointmentController from '../controllers/appointmentController.js';

const router = express.Router();

// Rutas protegidas para doctores
router.post('/', verifyToken, verifyDoctorRole, appointmentController.createAppointment);
router.get('/', verifyToken, verifyDoctorRole, appointmentController.getAppointments);
router.get('/today', verifyToken, verifyDoctorRole, appointmentController.getTodayAppointments);
router.get('/available-slots', verifyToken, verifyDoctorRole, appointmentController.getAvailableSlots);
router.get('/statistics', verifyToken, verifyDoctorRole, appointmentController.getStatistics);
router.get('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.getAppointment);
router.patch('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.updateAppointment);
router.delete('/:appointmentId', verifyToken, verifyDoctorRole, appointmentController.cancelAppointment);

// Portal paciente (sin autenticación)
// TODO: Implementar en FASE 4

export default router;
