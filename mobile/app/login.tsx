import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth() as any;

  const handleRequestOtp = async () => {
    if (!identifier) {
      alert('Please enter your email or mobile number to receive an OTP');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('https://brahmani-jewellers-api.onrender.com/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('OTP sent successfully! Please enter it to verify.');
        setShowOtpModal(true);
      } else {
        alert(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier || !password) {
      alert('Please enter both email/mobile and password');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('https://brahmani-jewellers-api.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password, source: 'app' }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        login({ ...data.user, token: data.token }, rememberMe);
        alert('Login Successful!');
        router.push('/');
      } else if (response.status === 403 && data.unverified) {
        alert('Your account is not verified yet. An OTP has been generated. Please enter it below to verify.');
        try {
          await fetch('https://brahmani-jewellers-api.onrender.com/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: identifier.trim() }),
          });
        } catch (otpErr) {
          // ignore or log
        }
        setShowOtpModal(true);
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      alert('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      alert('Please enter the OTP');
      return;
    }
    setOtpLoading(true);
    try {
      const response = await fetch('https://brahmani-jewellers-api.onrender.com/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), otp: otp.trim(), source: 'app' }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowOtpModal(false);
        setOtp('');
        login({ ...data.user, token: data.token }, rememberMe);
        alert('Account verified and logged in successfully!');
        router.push('/');
      } else {
        alert(data.message || 'Verification failed');
      }
    } catch (error) {
      alert('Error connecting to server');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backArrow} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#D4AF37" />
            </TouchableOpacity>
          </View>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Login to your account</Text>
            </View>

            <View style={styles.form}>
              {/* Login Method Segment Switcher */}
              <View style={styles.segmentContainer}>
                <TouchableOpacity 
                  style={[styles.segmentButton, loginMethod === 'otp' && styles.segmentButtonActive]}
                  onPress={() => { setLoginMethod('otp'); setPassword(''); }}
                >
                  <Text style={[styles.segmentButtonText, loginMethod === 'otp' && styles.segmentButtonTextActive]}>OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.segmentButton, loginMethod === 'password' && styles.segmentButtonActive]}
                  onPress={() => setLoginMethod('password')}
                >
                  <Text style={[styles.segmentButtonText, loginMethod === 'password' && styles.segmentButtonTextActive]}>Password</Text>
                </TouchableOpacity>
              </View>

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

              {loginMethod === 'password' && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.passwordInputWrapper}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Enter password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor="#A0A0A0"
                    />
                    <TouchableOpacity style={styles.eyeIconContainer} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye" : "eye-off"} size={22} color="#D4AF37" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Remember Me & Forgot Password Row */}
              {loginMethod === 'password' && (
                <View style={styles.checkboxForgotPasswordRow}>
                  <View style={styles.checkboxRow}>
                    <TouchableOpacity 
                      style={[styles.checkbox, rememberMe && styles.checkboxActive]}
                      onPress={() => setRememberMe(!rememberMe)}
                    >
                      {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                    </TouchableOpacity>
                    <Text style={styles.checkboxText}>Remember Me</Text>
                  </View>
                  
                  <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={loginMethod === 'password' ? handleLogin : handleRequestOtp}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading 
                    ? (loginMethod === 'password' ? 'Logging in...' : 'Sending OTP...') 
                    : (loginMethod === 'password' ? 'LOGIN' : 'SEND OTP')
                  }
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={{ color: '#D4AF37' }}>Don&apos;t have an account?</Text>
                <Link href="/register" asChild>
                  <TouchableOpacity style={{ marginTop: 8 }}>
                    <Text style={{ color: '#EBA938', fontWeight: 'bold', fontSize: 16 }}>Create Account</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verify Your Account</Text>
            <Text style={styles.modalSubtitle}>Please enter the 6-digit OTP code sent to your email/mobile.</Text>
            
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="numeric"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              placeholderTextColor="#A0A0A0"
            />

            <TouchableOpacity 
              style={[styles.button, otpLoading && styles.buttonDisabled]} 
              onPress={handleVerifyOtp}
              disabled={otpLoading}
            >
              {otpLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>VERIFY & SIGN IN</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelLink} onPress={() => setShowOtpModal(false)}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // clean white
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: '#D4AF37', // coffee
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(61, 43, 31, 0.7)', // coffee/70
  },
  form: {
    backgroundColor: '#FFFFFF', // White form background
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA', // Light border
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.15)',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#D4AF37',
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.15)',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#D4AF37',
  },
  eyeIconContainer: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    marginTop: 10,
    backgroundColor: '#EBA938', // ochre
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF', // white
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
    color: '#D4AF37',
    fontWeight: '500',
    fontSize: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF6E6',
  },
  checkboxActive: {
    backgroundColor: '#D4AF37',
  },
  checkboxText: {
    fontSize: 14,
    color: '#D4AF37',
    fontWeight: '500',
  },
  checkboxForgotPasswordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
  },
  forgotPasswordText: {
    color: '#EBA938',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(61, 43, 31, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: 'rgba(61, 43, 31, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.15)',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#D4AF37',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  cancelLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  cancelLinkText: {
    color: '#D4AF37',
    fontWeight: '500',
    fontSize: 14,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FAF9F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(61, 43, 31, 0.1)',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#D4AF37',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'rgba(61, 43, 31, 0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  segmentButtonTextActive: {
    color: '#FFF6E6',
  }
});
