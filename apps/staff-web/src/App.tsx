/**
 * CrowdFlow Staff Dashboard — App Root
 *
 * Sets up routing, auth context, and WebSocket context.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { LoginPage } from './components/Auth/LoginPage';
import { DashboardLayout } from './components/Dashboard/DashboardLayout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <WebSocketProvider>
                  <DashboardLayout />
                </WebSocketProvider>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
