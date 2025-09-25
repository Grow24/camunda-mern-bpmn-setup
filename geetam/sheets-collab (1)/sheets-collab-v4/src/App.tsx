import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { EnhancedDashboardPage } from './pages/EnhancedDashboardPage';
import { SpreadsheetPage } from './pages/SpreadsheetPage';
import { AuthCallback } from './components/auth/AuthCallback';
import { ToastContainer } from './components/ui/ToastContainer';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <EnhancedDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recent"
                element={
                  <ProtectedRoute>
                    <EnhancedDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/starred"
                element={
                  <ProtectedRoute>
                    <EnhancedDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shared"
                element={
                  <ProtectedRoute>
                    <EnhancedDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trash"
                element={
                  <ProtectedRoute>
                    <EnhancedDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spreadsheet/:id"
                element={
                  <ProtectedRoute>
                    <SpreadsheetPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastContainer />
          </div>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;