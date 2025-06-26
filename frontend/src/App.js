import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import HomePage from './components/HomePage'; // Importe a nova HomePage
import ApontamentosInjetoraInicial from './components/ApontamentosInjetoraInicial'; // Renomeado
import ApontamentosInjetoraHoraria from './components/ApontamentosInjetoraHoraria'; // Novo
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
            <Route path="/login" element={<Login />} />

            {/* Rota da Página Inicial (Dashboard) - Protegida */}
            <Route
              path="/home"
              element={
                <PrivateRoute>
                  <HomePage />
                </PrivateRoute>
              }
            />

            {/* Rota para a 1ª fase do Apontamento de Injetora - Protegida */}
            <Route
              path="/apontamentos/injetora/inicial"
              element={
                <PrivateRoute>
                  <ApontamentosInjetoraInicial />
                </PrivateRoute>
              }
            />

            {/* Rota para a 2ª fase do Apontamento de Injetora (Horária) - Protegida */}
            <Route
              path="/apontamentos/injetora/horaria"
              element={
                <PrivateRoute>
                  <ApontamentosInjetoraHoraria />
                </PrivateRoute>
              }
            />

            {/* Rota padrão: se a URL não corresponder a nenhuma, redireciona para /home se logado, senão para /login */}
            <Route
              path="*"
              element={
                <PrivateRoute>
                  <Navigate to="/home" replace /> {/* Redireciona para /home após o login */}
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;