import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image, Platform } from 'react-native';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    // Show splash screen for 2.5 seconds, then fade out
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800, // 800ms fade animation
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 2500);
  }, []);

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
  }
});
