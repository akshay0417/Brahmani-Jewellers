import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
        <Text style={styles.splashTitle}>Brahmani</Text>
        <Text style={styles.splashSubtitle}>JEWELLERS</Text>
        <StatusBar style="light" />
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
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#3D2B1F', // Coffee background for rich feel
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFF6E6', // Cream text
    letterSpacing: 2,
    marginBottom: 4,
  },
  splashSubtitle: {
    fontSize: 16,
    color: '#EBA938', // Ochre text
    letterSpacing: 6,
  }
});
