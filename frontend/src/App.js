import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ApontamentosInjetoraInicial from './components/ApontamentosInjetoraInicial';
import ApontamentosInjetoraHoraria from './components/ApontamentosInjetoraHoraria';
import DashboardInjetora from './pages/DashboardInjetora';
import Layout from './layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {}
            <Route path="/Login" element={<Login />} />

            {}
            <Route
              path="/" 
              element={
                <PrivateRoute>
                  <Layout /> {}
                </PrivateRoute>
              }
            >
              {}
              <Route index element={<Navigate to="/dashboard/injetora" replace />} />
              <Route path="dashboard/injetora" element={<DashboardInjetora />} />

              {}
              <Route path="apontamentos/injetora/inicial" element={<ApontamentosInjetoraInicial />} />
              <Route path="apontamentos/injetora/horaria" element={<ApontamentosInjetoraHoraria />} />

              {}
              <Route path="home" element={<HomePage />} />

              {}
              {}

              {}
              <Route path="*" element={<Navigate to="/dashboard/injetora" replace />} />
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;