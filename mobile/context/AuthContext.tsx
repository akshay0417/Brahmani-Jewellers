import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCartCount = async (token = user?.token) => {
    if (!token) {
      setCartCount(0);
      return;
    }
    try {
      const response = await fetch('https://brahmani-jewellers-api.onrender.com/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const validItems = (data.items || []).filter((item: any) => item && item.product && item.product._id);
        const count = validItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(count);
      } else {
        setCartCount(0);
      }
    } catch (e) {
      console.error('Failed to fetch cart count', e);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const loadPersistedUser = async () => {
      try {
        if (Platform.OS === 'web') {
          const storedUser = localStorage.getItem('mobile_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            refreshCartCount(parsed.token);
          }
        } else {
          const storedUser = await AsyncStorage.getItem('mobile_user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            refreshCartCount(parsed.token);
          }
        }
      } catch (e) {
        console.error('Failed to load user session', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadPersistedUser();
  }, []);

  useEffect(() => {
    if (user?.token) {
      refreshCartCount(user.token);
    } else {
      setCartCount(0);
    }
  }, [user]);

  const login = async (userData: any, rememberMe = true) => {
    setUser(userData);
    refreshCartCount(userData.token);
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
    setCartCount(0);
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
    <AuthContext.Provider value={{ user, login, logout, cartCount, refreshCartCount, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
