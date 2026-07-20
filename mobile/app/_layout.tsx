import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image, Platform, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { Feather } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import axios from 'axios';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';
const APP_VERSION = '1.0.0';

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [checking, setChecking] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [apkDownloadUrl, setApkDownloadUrl] = useState('https://brahmani-jewellers.vercel.app/download');
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

  const checkUpdates = async () => {
    if (__DEV__) return; // Skip update check in development
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          "New Update Available! 🚀",
          "An updated version of the app has been downloaded. The application will restart now to apply the updates.",
          [
            {
              text: "Restart Now",
              onPress: async () => {
                await Updates.reloadAsync();
              }
            }
          ],
          { cancelable: false }
        );
      }
    } catch (err) {
      console.log("Error checking for EAS updates:", err);
    }
  };
  const checkAppVersion = async () => {
    try {
      const response = await axios.get(`${API_URL}/rates`);
      if (response.data && response.data.latestAppVersion) {
        const remoteVersion = response.data.latestAppVersion;
        if (remoteVersion !== APP_VERSION) {
          const localParts = APP_VERSION.split('.').map(Number);
          const remoteParts = remoteVersion.split('.').map(Number);
          
          let isNewer = false;
          for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
            const localVal = localParts[i] || 0;
            const remoteVal = remoteParts[i] || 0;
            if (remoteVal > localVal) {
              isNewer = true;
              break;
            } else if (localVal > remoteVal) {
              break;
            }
          }
          
          if (isNewer) {
            setApkDownloadUrl(response.data.apkDownloadUrl || 'https://brahmani-jewellers.vercel.app/download');
            setLatestVersion(remoteVersion);
            setUpdateRequired(true);
          }
        }
      }
    } catch (err) {
      console.log("Error checking app version update:", err);
    }
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

    // Check for OTA Updates
    checkUpdates();

    // Check for App Version Updates (Direct APK)
    checkAppVersion();

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

  if (updateRequired) {
    return (
      <View style={styles.updateContainer}>
        <Image source={require('../assets/images/logo.png')} style={styles.updateLogo} />
        <Feather name="download-cloud" size={64} color="#D4AF37" style={{ marginBottom: 16 }} />
        <Text style={styles.updateTitle}>Update Required! 🚀</Text>
        <Text style={styles.updateSubtitle}>
          A new version of the app (v{latestVersion}) is available. Please update to continue using the application.
        </Text>
        
        <TouchableOpacity 
          onPress={() => Linking.openURL(apkDownloadUrl)} 
          style={styles.updateButton}
        >
          <Text style={styles.updateButtonText}>UPDATE NOW</Text>
        </TouchableOpacity>
        <StatusBar style="dark" />
      </View>
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
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="register" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="checkout" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="product-details" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean White Background
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
    color: '#6B1124', // Regal Maroon
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  splashSubtitle: {
    fontSize: 14,
    color: '#D4AF37', // Royal Gold
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
    color: '#6B1124', // Regal Maroon
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
    backgroundColor: '#6B1124', // Regal Maroon
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },
  updateContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  updateLogo: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  updateTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6B1124', // Regal Maroon
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  updateSubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  updateButton: {
    backgroundColor: '#6B1124', // Regal Maroon
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 2,
  }
});
