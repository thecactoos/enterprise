import React, { createContext, useContext, useState, useEffect } from 'react';
import { handleApiError, logError } from '../utils/errorHandler';
import apiService from '../services/api.service';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiService.login({ email, password });
      
      const { access_token, user } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      logError(error, 'Login attempt');
      const errorInfo = handleApiError(error);
      
      return { 
        success: false, 
        error: errorInfo.message,
        type: errorInfo.type,
        shouldRedirect: errorInfo.shouldRedirect
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await apiService.register({ name, email, password });
      
      return { success: true, data: response };
    } catch (error) {
      logError(error, 'Registration attempt');
      const errorInfo = handleApiError(error);
      
      return { 
        success: false, 
        error: errorInfo.message,
        type: errorInfo.type
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 