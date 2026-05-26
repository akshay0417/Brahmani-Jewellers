import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    fetchStates();
  }, []);

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'India' }),
      });
      const data = await response.json();
      if (!data.error) {
        setStates(data.data.states);
      }
    } catch (err) {
      console.log('Error fetching states', err);
    } finally {
      setLoadingStates(false);
    }
  };

  const fetchCities = async (selectedState) => {
    setLoadingCities(true);
    setCities([]);
    try {
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'India', state: selectedState }),
      });
      const data = await response.json();
      if (!data.error) {
        setCities(data.data);
      }
    } catch (err) {
      console.log('Error fetching cities', err);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleStateSelect = (selectedState) => {
    setState(selectedState.name);
    setCity(''); // reset city
    setShowStatePicker(false);
    fetchCities(selectedState.name);
  };

  const handleRegister = async () => {
    if (!name || !email || !mobile || !password || !state || !city) {
      alert('All fields are required to register!');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.4:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password, country: 'India', state, city }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Registration Successful! Please Login.');
        router.push('/login');
      } else {
        alert(data.message || 'Registration failed');
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
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Brahmani Jewellers</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter mobile"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>State *</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowStatePicker(true)}>
              <Text style={{ color: state ? '#3D2B1F' : '#A0A0A0', fontSize: 16 }}>
                {state || (loadingStates ? 'Loading States...' : 'Select State')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>City *</Text>
            <TouchableOpacity style={styles.input} onPress={() => {
              if (!state) alert('Please select a state first');
              else setShowCityPicker(true);
            }}>
              <Text style={{ color: city ? '#3D2B1F' : '#A0A0A0', fontSize: 16 }}>
                {city || (loadingCities ? 'Loading Cities...' : 'Select City')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating...' : 'REGISTER'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* State Picker Modal */}
      <Modal visible={showStatePicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select State</Text>
            <FlatList
              data={states}
              keyExtractor={(item) => item.state_code}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleStateSelect(item)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowStatePicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select City</Text>
            {cities.length === 0 ? (
              <Text style={{textAlign: 'center', padding: 20}}>No cities available</Text>
            ) : (
              <FlatList
                data={cities}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => { setCity(item); setShowCityPicker(false); }}>
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCityPicker(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  topBar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  backArrow: { padding: 4, width: 40 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', paddingVertical: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#3D2B1F', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#EBA938' },
  form: { backgroundColor: '#FCF0DA', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#3D2B1F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#FFF6E6', borderWidth: 1, borderColor: 'rgba(61, 43, 31, 0.2)', borderRadius: 8, padding: 14, color: '#3D2B1F', justifyContent: 'center' },
  button: { marginTop: 10, backgroundColor: '#3D2B1F', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFF6E6', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  backButton: { marginTop: 16, alignItems: 'center', padding: 12 },
  backButtonText: { color: '#3D2B1F', fontWeight: '500', fontSize: 16 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF6E6', borderRadius: 16, maxHeight: '80%', padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3D2B1F', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(61, 43, 31, 0.1)' },
  modalItemText: { fontSize: 16, color: '#3D2B1F' },
  modalCloseButton: { marginTop: 16, backgroundColor: '#3D2B1F', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalCloseText: { color: '#FFF6E6', fontWeight: 'bold' }
});
