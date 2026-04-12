import { verifyAndDecodeToken } from '../middleware/auth.js';

const connectedClients = new Map();
const appointmentSubscriptions = new Map();

export const setupWebSocket = (wss) => {
  console.log('🔌 Configurando WebSocket...');

  wss.on('connection', (ws, req) => {
    console.log('✓ Cliente conectado');

    let clientId = null;
    let clientType = null; // 'doctor' o 'patient'

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        switch (message.type) {
          case 'auth':
            handleAuth(ws, message, connectedClients, clientId);
            break;
          case 'subscribe':
            handleSubscribe(ws, message, appointmentSubscriptions);
            break;
          case 'unsubscribe':
            handleUnsubscribe(ws, message, appointmentSubscriptions);
            break;
          case 'update_appointment':
            handleAppointmentUpdate(message, appointmentSubscriptions, wss);
            break;
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Tipo de mensaje no reconocido'
            }));
        }
      } catch (error) {
        console.error('Error procesando WebSocket mensaje:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error procesando mensaje'
        }));
      }
    });

    ws.on('close', () => {
      console.log('✓ Cliente desconectado');
      if (clientId) {
        connectedClients.delete(clientId);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};

const handleAuth = (ws, message, connectedClients, clientId) => {
  const { token } = message;

  if (!token) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Token requerido'
    }));
    return;
  }

  const decoded = verifyAndDecodeToken(token);

  if (!decoded) {
    ws.send(JSON.stringify({
      type: 'auth_error',
      message: 'Token inválido'
    }));
    return;
  }

  clientId = decoded.id;
  const client = {
    id: clientId,
    role: decoded.role,
    ws: ws,
    connectedAt: new Date()
  };

  connectedClients.set(clientId, client);

  ws.send(JSON.stringify({
    type: 'auth_success',
    clientId: clientId,
    role: decoded.role
  }));

  console.log(`✓ Cliente autenticado: ${decoded.email} (${decoded.role})`);
};

const handleSubscribe = (ws, message, appointmentSubscriptions) => {
  const { appointmentId } = message;

  if (!appointmentId) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'appointmentId requerido'
    }));
    return;
  }

  if (!appointmentSubscriptions.has(appointmentId)) {
    appointmentSubscriptions.set(appointmentId, []);
  }

  appointmentSubscriptions.get(appointmentId).push(ws);

  ws.send(JSON.stringify({
    type: 'subscribed',
    appointmentId: appointmentId,
    message: 'Suscrito a actualizaciones de cita'
  }));

  console.log(`✓ Cliente suscrito a cita: ${appointmentId}`);
};

const handleUnsubscribe = (ws, message, appointmentSubscriptions) => {
  const { appointmentId } = message;

  if (appointmentSubscriptions.has(appointmentId)) {
    const subscribers = appointmentSubscriptions.get(appointmentId);
    const index = subscribers.indexOf(ws);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  }

  console.log(`✓ Cliente desuscrito de cita: ${appointmentId}`);
};

const handleAppointmentUpdate = (message, appointmentSubscriptions, wss) => {
  const { appointmentId, update } = message;

  if (!appointmentId) {
    console.error('appointmentId requerido en update');
    return;
  }

  // Enviar actualización a todos los clientes suscritos
  const subscribers = appointmentSubscriptions.get(appointmentId);

  if (subscribers && subscribers.length > 0) {
    const updateMessage = JSON.stringify({
      type: 'appointment_update',
      appointmentId: appointmentId,
      update: update,
      timestamp: new Date()
    });

    subscribers.forEach(ws => {
      if (ws.readyState === ws.OPEN) {
        ws.send(updateMessage);
      }
    });

    console.log(`📤 Actualización enviada a ${subscribers.length} clientes para cita ${appointmentId}`);
  }
};

export const broadcastAppointmentUpdate = (wss, appointmentId, update) => {
  const message = JSON.stringify({
    type: 'appointment_update',
    appointmentId: appointmentId,
    update: update,
    timestamp: new Date()
  });

  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
};
