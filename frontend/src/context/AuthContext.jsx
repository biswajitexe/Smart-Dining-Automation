import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('smart_dining_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => {
    return localStorage.getItem('smart_dining_token') || null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login({ username, password });
      setUser({ _id: data._id, username: data.username, role: data.role });
      setToken(data.token);
      
      localStorage.setItem('smart_dining_user', JSON.stringify({ _id: data._id, username: data.username, role: data.role }));
      localStorage.setItem('smart_dining_token', data.token);
      
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smart_dining_user');
    localStorage.removeItem('smart_dining_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
