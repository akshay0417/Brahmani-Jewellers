import { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert('Please enter both email/mobile and password');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.13:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login(data.user);
        alert('Login Successful!');
        router.push('/');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#3D2B1F" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email or Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email or mobile"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'LOGIN'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ color: '#3D2B1F' }}>Don't have an account?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity style={{ marginTop: 8 }}>
                <Text style={{ color: '#EBA938', fontWeight: 'bold', fontSize: 16 }}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF6E6', // cream
  },
  topBar: { 
    paddingHorizontal: 20, 
    paddingTop: 16, 
    paddingBottom: 8 
  },
  backArrow: { 
    padding: 4, 
    width: 40 
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3D2B1F', // coffee
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#EBA938', // ochre
  },
  form: {
    backgroundColor: '#FCF0DA', // cream-alt
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3D2B1F',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#FFF6E6',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.2)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#3D2B1F',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#3D2B1F', // coffee
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFF6E6', // cream
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: '#3D2B1F',
    fontWeight: '500',
    fontSize: 16,
  }
});
