import React, { createContext, useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { getWebSocketClient, closeWebSocketClient } from '../services/websocket.js';

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [wsState, setWsState] = useState('CLOSED');
  const wsClientRef = useRef(null);
  const listenerCountRef = useRef(0);

  // Inicializar WebSocket
  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const initializeWebSocket = async () => {
      try {
        const wsClient = getWebSocketClient();
        wsClientRef.current = wsClient;

        // Manejadores de eventos
        const handleConnected = () => {
          console.log('✓ WebSocket conectado');
          setIsConnected(true);
          setWsState('OPEN');
          setError(null);
        };

        const handleDisconnected = () => {
          console.log('⚠️ WebSocket desconectado');
          setIsConnected(false);
          setWsState('CLOSED');
        };

        const handleError = (err) => {
          console.error('❌ Error WebSocket:', err);
          setError(err?.message || 'Error en conexión WebSocket');
        };

        const handleAuthSuccess = () => {
          console.log('✅ Autenticación WebSocket exitosa');
        };

        // Agregar listeners
        wsClient.on('connected', handleConnected);
        wsClient.on('disconnected', handleDisconnected);
        wsClient.on('error', handleError);
        wsClient.on('auth_success', handleAuthSuccess);

        // Conectar si no está conectado
        if (!wsClient.isConnected()) {
          await wsClient.connect(token);
        } else {
          setIsConnected(true);
          setWsState(wsClient.getState());
        }

        // Limpiar listeners al desmontar
        return () => {
          wsClient.off('connected', handleConnected);
          wsClient.off('disconnected', handleDisconnected);
          wsClient.off('error', handleError);
          wsClient.off('auth_success', handleAuthSuccess);
        };
      } catch (err) {
        console.error('❌ Error inicializando WebSocket:', err);
        setError(err?.message || 'Error en WebSocket');
      }
    };

    const cleanup = initializeWebSocket();
    return cleanup;
  }, [token, user]);

  // Limpiar al desmontar el provider
  useEffect(() => {
    return () => {
      if (wsClientRef.current && listenerCountRef.current === 0) {
        // Solo desconectar si no hay listeners activos
        closeWebSocketClient();
      }
    };
  }, []);

  // Suscribirse a cita
  const subscribeAppointment = useCallback((appointmentId, callback) => {
    if (wsClientRef.current) {
      wsClientRef.current.subscribeAppointment(appointmentId);

      if (callback) {
        wsClientRef.current.on('appointment_updated', callback);
        listenerCountRef.current++;
      }

      return () => {
        wsClientRef.current.unsubscribeAppointment(appointmentId);
        if (callback) {
          wsClientRef.current.off('appointment_updated', callback);
          listenerCountRef.current--;
        }
      };
    }
  }, []);

  // Desuscribirse de cita
  const unsubscribeAppointment = useCallback((appointmentId) => {
    if (wsClientRef.current) {
      wsClientRef.current.unsubscribeAppointment(appointmentId);
    }
  }, []);

  // Suscribirse a doctor
  const subscribeDoctor = useCallback((doctorId, callback) => {
    if (wsClientRef.current) {
      wsClientRef.current.subscribeDoctor(doctorId);

      if (callback) {
        wsClientRef.current.on('doctor_updated', callback);
        listenerCountRef.current++;
      }

      return () => {
        wsClientRef.current.unsubscribeDoctor(doctorId);
        if (callback) {
          wsClientRef.current.off('doctor_updated', callback);
          listenerCountRef.current--;
        }
      };
    }
  }, []);

  // Desuscribirse de doctor
  const unsubscribeDoctor = useCallback((doctorId) => {
    if (wsClientRef.current) {
      wsClientRef.current.unsubscribeDoctor(doctorId);
    }
  }, []);

  // Escuchar evento
  const on = useCallback((event, callback) => {
    if (wsClientRef.current) {
      wsClientRef.current.on(event, callback);
      listenerCountRef.current++;

      return () => {
        wsClientRef.current.off(event, callback);
        listenerCountRef.current--;
      };
    }
  }, []);

  // Dejar de escuchar evento
  const off = useCallback((event, callback) => {
    if (wsClientRef.current) {
      wsClientRef.current.off(event, callback);
      listenerCountRef.current--;
    }
  }, []);

  const value = {
    isConnected,
    error,
    wsState,
    subscribeAppointment,
    unsubscribeAppointment,
    subscribeDoctor,
    unsubscribeDoctor,
    on,
    off
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
