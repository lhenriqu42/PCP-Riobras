import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ApontamentosInjetoraInicial from './components/ApontamentosInjetoraInicial';
import ApontamentosInjetoraHoraria from './components/ApontamentosInjetoraHoraria';
import DashboardInjetora from './pages/DashboardInjetora';
import ProductQualityDashboard from './pages/ProductQualityDashboard';
import ApontamentosManutencao from './pages/ApontamentosManutencao';
import Layout from './layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';

import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import theme from './theme';


const PrivateRoute = ({ children, requiredLevel }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" />;
  }

  if (requiredLevel && user && user.level < requiredLevel) {
    return <Navigate to="/home" replace />;
  }

  return children;
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
                  <Layout />
                </PrivateRoute>
              }
            >
              {}
              <Route index element={<Navigate to="/dashboard/injetora" replace />} />

              {}
              <Route path="dashboard/injetora" element={<DashboardInjetora />} />
              <Route
                path="dashboard/qualidade"
                element={
                  <PrivateRoute requiredLevel={2}>
                    <ProductQualityDashboard />
                  </PrivateRoute>
                }
              />
              {}
              <Route
                path="apontamentos/manutencao"
                element={
                  <PrivateRoute requiredLevel={2}> {}
                    <ApontamentosManutencao />
                  </PrivateRoute>
                }
              />

              {}
              <Route path="apontamentos/injetora/inicial" element={<ApontamentosInjetoraInicial />} />
              <Route path="apontamentos/injetora/horaria" element={<ApontamentosInjetoraHoraria />} />

              {}
              <Route path="home" element={<HomePage />} />

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