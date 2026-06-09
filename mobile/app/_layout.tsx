import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const fadeAnim = new Animated.Value(1);

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch("https://clients3.google.com/generate_204", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      });
      clearTimeout(timeoutId);
      return response.ok || response.status === 204;
    } catch (error) {
      return false;
    }
  };

  const verifyNetwork = async () => {
    const online = await checkConnection();
    setIsOffline(!online);
  };

  useEffect(() => {
    // Show splash screen for 2.5 seconds, then fade out
    const splashTimeout = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2500);

    // Initial network check
    verifyNetwork();

    // Periodically verify network connection every 7 seconds
    const interval = setInterval(() => {
      verifyNetwork();
    }, 7000);

    return () => {
      clearTimeout(splashTimeout);
      clearInterval(interval);
    };
  }, []);

  const handleRetry = async () => {
    setChecking(true);
    const online = await checkConnection();
    setIsOffline(!online);
    setChecking(false);
  };

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: fadeAnim }]}>
        <Image source={require('../assets/images/logo.png')} style={styles.splashLogo} />
        <Text style={styles.splashTitle}>Brahmani</Text>
        <Text style={styles.splashSubtitle}>JEWELLERS</Text>
        <StatusBar style="dark" />
      </Animated.View>
    );
  }

  if (isOffline) {
    return (
      <View style={styles.offlineContainer}>
        <Feather name="wifi-off" size={64} color="#D4AF37" style={{ marginBottom: 16 }} />
        <Text style={styles.offlineTitle}>No Internet Connection</Text>
        <Text style={styles.offlineSubtitle}>
          This application requires an active internet connection to browse collections, view live gold rates, and manage orders.
        </Text>
        
        <TouchableOpacity 
          onPress={handleRetry} 
          disabled={checking}
          style={styles.retryButton}
        >
          {checking ? (
            <ActivityIndicator color="#1C1C1E" size="small" />
          ) : (
            <Text style={styles.retryButtonText}>TRY AGAIN</Text>
          )}
        </TouchableOpacity>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="register" options={{ headerShown: false, presentation: 'modal' }} />
          <Stack.Screen name="checkout" options={{ headerShown: false, presentation: 'card' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Premium White Background
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  splashLogo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  splashTitle: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#1C1C1E', // Charcoal
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#D4AF37', // Shiny Gold
    letterSpacing: 6,
    fontWeight: 'bold',
  },
  offlineContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  offlineSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 6,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: '#1C1C1E',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  }
});
