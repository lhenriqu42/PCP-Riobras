import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomePage from './components/HomePage';
import ApontamentosInjetoraInicial from './components/ApontamentosInjetoraInicial';
import ApontamentosInjetoraHoraria from './components/ApontamentosInjetoraHoraria';
import DashboardInjetora from './pages/DashboardInjetora';
import Layout from './layout/Layout'; // Importe o novo componente de Layout
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';

// Componente para rotas protegidas
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
            {/* Rota de Login */}
            <Route path="/Login" element={<Login />} />

            {/* Todas as rotas protegidas aninhadas dentro do Layout */}
            <Route
              path="/" // A rota raiz agora usa o Layout
              element={
                <PrivateRoute>
                  <Layout /> {/* O Layout será renderizado aqui */}
                </PrivateRoute>
              }
            >
              {/* Dashboard Injetora como rota padrão (index) para usuários logados */}
              <Route index element={<Navigate to="/dashboard/injetora" replace />} />
              <Route path="dashboard/injetora" element={<DashboardInjetora />} />

              {/* Rotas de Apontamento Injetora (dentro do Layout) */}
              <Route path="apontamentos/injetora/inicial" element={<ApontamentosInjetoraInicial />} />
              <Route path="apontamentos/injetora/horaria" element={<ApontamentosInjetoraHoraria />} />

              {/* Rota da Página Inicial (se ainda quiser mantê-la separada, mas pode ser integrada ao Dashboard) */}
              <Route path="home" element={<HomePage />} />

              {/* Rota para Apontamentos Gerais (futura) */}
              {/* <Route path="apontamentos/gerais" element={<ApontamentosGerais />} /> */}

              {/* Redirecionamento para a página padrão (Dashboard) se a URL dentro do Layout não corresponder */}
              <Route path="*" element={<Navigate to="/dashboard/injetora" replace />} />
            </Route>

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;