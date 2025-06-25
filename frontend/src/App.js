import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import ApontamentosInjetora from './components/ApontamentosInjetora';
import { AuthProvider, useAuth } from './context/AuthContext'; // Vamos criar este contexto

// Componente para rotas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/apontamentos/injetora" element={
            <PrivateRoute>
              <ApontamentosInjetora />
            </PrivateRoute>
          } />
          {/* Rota padrão, redireciona para login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;