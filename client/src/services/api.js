import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a las solicitudes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de Autenticación
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post('/api/auth/login', {
      email,
      password
    });
    return response.data;
  },

  register: async (data) => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  verify: async (token) => {
    const response = await apiClient.get('/api/auth/verify', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  logout: async (token) => {
    const response = await apiClient.post('/api/auth/logout', {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

// Servicios de Doctor (próximamente)
export const doctorAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/api/doctor/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.patch('/api/doctor/profile', data);
    return response.data;
  },

  getDashboard: async () => {
    const response = await apiClient.get('/api/doctor/dashboard');
    return response.data;
  }
};

// Servicios de Appointments (próximamente)
export const appointmentAPI = {
  getAppointments: async () => {
    const response = await apiClient.get('/api/appointments');
    return response.data;
  },

  createAppointment: async (data) => {
    const response = await apiClient.post('/api/appointments', data);
    return response.data;
  },

  updateAppointment: async (appointmentId, data) => {
    const response = await apiClient.patch(`/api/appointments/${appointmentId}`, data);
    return response.data;
  }
};

// Servicios de Patients (próximamente)
export const patientAPI = {
  getPatients: async () => {
    const response = await apiClient.get('/api/patients');
    return response.data;
  },

  createPatient: async (data) => {
    const response = await apiClient.post('/api/patients', data);
    return response.data;
  },

  getPatient: async (patientId) => {
    const response = await apiClient.get(`/api/patients/${patientId}`);
    return response.data;
  },

  updatePatient: async (patientId, data) => {
    const response = await apiClient.patch(`/api/patients/${patientId}`, data);
    return response.data;
  }
};

export default apiClient;
