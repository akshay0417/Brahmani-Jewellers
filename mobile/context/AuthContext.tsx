import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Basic load from localStorage for Web testing
    if (Platform.OS === 'web') {
      try {
        const storedUser = localStorage.getItem('mobile_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    if (Platform.OS === 'web') {
      localStorage.setItem('mobile_user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    if (Platform.OS === 'web') {
      localStorage.removeItem('mobile_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
