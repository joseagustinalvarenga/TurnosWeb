import React, { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await authAPI.verify(token);
          if (response.success) {
            setUser(response.doctor);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error('Error verificando token:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);
      if (response.success) {
        const { token, doctor } = response;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(doctor);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, error: response.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.register(data);
      if (response.success) {
        const { token, doctor } = response;
        localStorage.setItem('token', token);
        setToken(token);
        setUser(doctor);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, error: response.message };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al registrar';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authAPI.logout(token);
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
