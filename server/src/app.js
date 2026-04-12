import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

// Cargar variables de entorno
dotenv.config();

// Imports de rutas
import authRoutes from './routes/auth.js';
import appointmentRoutes from './routes/appointments.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctor.js';
import availabilityRoutes from './routes/availability.js';
import googleCalendarRoutes from './routes/googleCalendar.js';
import insuranceRoutes from './routes/insurance.js';
import adminRoutes from './routes/admin.js';

// Imports de middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Imports de WebSocket
import { setupWebSocket } from './websocket/server.js';

const app = express();
const httpServer = createServer(app);

// Seguridad y CORS
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware de parseo
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logger
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/google', googleCalendarRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/admin', adminRoutes);

// Configurar WebSocket
const wss = new WebSocketServer({ server: httpServer });
setupWebSocket(wss);

// Manejador de errores (debe ser último)
app.use(errorHandler);

// Rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Variables globales
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Iniciar servidor
httpServer.listen(PORT, HOST, () => {
  console.log(`\n🚀 Servidor iniciado en http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  console.log(`🔌 WebSocket disponible en ws://${HOST}:${process.env.WS_PORT || 5001}\n`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;
