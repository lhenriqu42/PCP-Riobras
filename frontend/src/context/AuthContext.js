import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // user pode conter { username, level }

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Erro ao fazer parse do usuário do localStorage", e);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      if (response.status === 200) {
        setIsAuthenticated(true);
        // O backend agora retorna o nível do usuário
        const userData = {
          username: response.data.user.username,
          level: response.data.user.level // <--- Nível de acesso do usuário
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      return { success: false, message: error.response?.data?.message || 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};