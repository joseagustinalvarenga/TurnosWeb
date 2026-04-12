import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { useAuth } from './hooks/useAuth';

// Páginas
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardNewPage from './pages/DashboardNewPage';
import AppointmentsPage from './pages/AppointmentsPage';
import PatientsPage from './pages/PatientsPage';
import PatientPortalHomePage from './pages/PatientPortalHomePage';
import PatientAppointmentViewPage from './pages/PatientAppointmentViewPage';
import NotFoundPage from './pages/NotFoundPage';

// Componentes
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      {/* Portal del Paciente (públicas) */}
      <Route path="/patient" element={<PatientPortalHomePage />} />
      <Route path="/patient/appointment/:appointmentCode" element={<PatientAppointmentViewPage />} />

      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/dashboard" element={<DashboardNewPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/availability" element={<DashboardNewPage />} />
          <Route path="/reports" element={<DashboardNewPage />} />
          <Route path="/settings" element={<DashboardNewPage />} />
          <Route path="/doctor/*" element={<DashboardNewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <AppContent />
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
