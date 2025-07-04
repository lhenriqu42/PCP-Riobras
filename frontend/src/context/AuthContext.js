import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token'); 
    
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (e) {
        console.error("Erro ao fazer parse do usuário ou token do localStorage", e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization']; 
      }
    }
    setLoading(false); 
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('REACT_APP_API_URL/login', { username, password });
      
      if (response.status === 200) {
        setIsAuthenticated(true);
        const { user: userData, token } = response.data; 
        
        const userToStore = {
          username: userData.username,
          level: userData.level
        };

        setUser(userToStore);
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('token', token); 
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        return { success: true };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token'); 
      delete axios.defaults.headers.common['Authorization'];
      return { success: false, message: error.response?.data?.message || 'Erro ao fazer login' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token'); 
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};