import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadPersistedUser = async () => {
      try {
        if (Platform.OS === 'web') {
          const storedUser = localStorage.getItem('mobile_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          const storedUser = await AsyncStorage.getItem('mobile_user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (e) {
        console.error('Failed to load user session', e);
      }
    };
    loadPersistedUser();
  }, []);

  const login = async (userData: any, rememberMe = true) => {
    setUser(userData);
    try {
      if (rememberMe) {
        if (Platform.OS === 'web') {
          localStorage.setItem('mobile_user', JSON.stringify(userData));
        } else {
          await AsyncStorage.setItem('mobile_user', JSON.stringify(userData));
        }
      } else {
        if (Platform.OS === 'web') {
          localStorage.removeItem('mobile_user');
        } else {
          await AsyncStorage.removeItem('mobile_user');
        }
      }
    } catch (e) {
      console.error('Failed to save user session', e);
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('mobile_user');
      } else {
        await AsyncStorage.removeItem('mobile_user');
      }
    } catch (e) {
      console.error('Failed to clear user session', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
