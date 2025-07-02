// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ApontamentosInjetoraInicial from './components/ApontamentosInjetoraInicial';
import ApontamentosInjetoraHoraria from './components/ApontamentosInjetoraHoraria';
import DashboardInjetora from './pages/DashboardInjetora';
import ProductQualityDashboard from './pages/ProductQualityDashboard';
import Layout from './layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
// ADICIONE Box e CircularProgress AQUI:
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material'; // <-- Linha corrigida
import theme from './theme';

// Modificado para aceitar uma prop `requiredLevel`
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
    return <Navigate to="/login" />;
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
            {/* Rotas Públicas */}
            <Route path="/Login" element={<Login />} />

            {/* Rotas Protegidas que usam o Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              {/* Rota Index, redireciona para o Dashboard padrão */}
              <Route index element={<Navigate to="/dashboard/injetora" replace />} />
              
              {/* Dashboards */}
              <Route path="dashboard/injetora" element={<DashboardInjetora />} />
              {/* NOVA ROTA: Dashboard de Qualidade (Nível de acesso 2 ou mais) */}
              <Route
                path="dashboard/qualidade"
                element={
                  <PrivateRoute requiredLevel={2}> {/* Requer nível 2 para esta rota */}
                    <ProductQualityDashboard />
                  </PrivateRoute>
                }
              />

              {/* Apontamentos */}
              <Route path="apontamentos/injetora/inicial" element={<ApontamentosInjetoraInicial />} />
              <Route path="apontamentos/injetora/horaria" element={<ApontamentosInjetoraHoraria />} />

              {/* Outras Rotas */}
              <Route path="home" element={<HomePage />} />

              {/* Rota Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard/injetora" replace />} />
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;