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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

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
    if (!termsAccepted) {
      alert('You must accept the Terms & Conditions and Privacy Policy to register.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('https://brahmani-jewellers-api.onrender.com/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, mobile, password, country: 'India', state, city, termsAccepted }),
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

          {/* Terms & Conditions Checkbox */}
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, termsAccepted && styles.checkboxActive]}
              onPress={() => setTermsAccepted(!termsAccepted)}
            >
              {termsAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </TouchableOpacity>
            <View style={styles.checkboxLabelContainer}>
              <Text style={styles.checkboxText}>I agree to the </Text>
              <TouchableOpacity onPress={() => setShowTermsModal(true)}>
                <Text style={styles.checkboxLink}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={styles.checkboxText}> and </Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(true)}>
                <Text style={styles.checkboxLink}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
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

      {/* TERMS & CONDITIONS MODAL */}
      <Modal visible={showTermsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                <Text style={{ fontWeight: 'bold' }}>1. Acceptance of Terms</Text>
                {"\n"}
                By accessing and using this app, you agree to be bound by these Terms & Conditions. Please read them carefully before making any purchases.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Pricing & Live Gold/Silver Rates</Text>
                {"\n"}
                Gold and silver rates fluctuate daily according to the bullion market. The pricing for products on our site/app is dynamically calculated based on current live rates. The price presented at checkout when you place your order is final and binding. Even if gold/silver market rates change afterwards, the price of your placed order remains unchanged.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. Product Details & Weight Variance</Text>
                {"\n"}
                All our jewellery pieces are handcrafted. Because they are handmade, the final weight of the delivered jewellery may vary by approximately +/- 5% compared to the estimated weight listed online. The final bill will be adjusted and calculated according to the actual weight of the shipped product.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>4. Order Validation & Cancellation</Text>
                {"\n"}
                Brahmani Jewellers reserves the right to cancel any orders under exceptional circumstances (e.g. wrong price displays, lack of raw materials, or verification issues). If we cancel an order, we will issue a full refund to the customer.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>5. Contact Information</Text>
                {"\n"}
                Email: info.brahmanijewellers@gmail.com
                {"\n"}
                Phone: +91 9925811771
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowTermsModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                <Text style={{ fontWeight: 'bold' }}>1. Introduction</Text>
                {"\n"}
                Welcome to Brahmani Jewellers. We value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Information We Collect</Text>
                {"\n"}
                A. Personal Info: Name, shipping address, billing address, email, and phone number when you create an account or order.
                {"\n"}
                B. Payments: We do NOT store your credit card, debit card, or UPI credentials on our servers. All transaction details are processed securely by Razorpay.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. How We Use Your Data</Text>
                {"\n"}
                - To process, ship, and deliver your luxury jewellery orders.
                {"\n"}
                - To send order confirmations, tracking information, and customer support updates.
                {"\n"}
                - To share daily live rate updates.
                {"\n"}
                - To prevent fraud and maintain security.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>4. Data Sharing & Third Parties</Text>
                {"\n"}
                We never sell or rent your personal data. We only share details with courier services to ship packages and payment gateways to process payments.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>5. Contact Us</Text>
                {"\n"}
                Email: info.brahmanijewellers@gmail.com
                {"\n"}
                Phone: +91 9925811771
                {"\n"}
                Address: Near Amraiwadi Metro, Ahmedabad, Gujarat, India
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
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
  
  // Checkbox Styles
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#3D2B1F',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF6E6',
  },
  checkboxActive: {
    backgroundColor: '#3D2B1F',
  },
  checkboxLabelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
  },
  checkboxText: {
    fontSize: 12,
    color: '#3D2B1F',
  },
  checkboxLink: {
    fontSize: 12,
    color: '#EBA938',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  legalBodyText: {
    fontSize: 13,
    color: '#3D2B1F',
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF6E6', borderRadius: 16, maxHeight: '80%', padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#3D2B1F', marginBottom: 16, textAlign: 'center' },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(61, 43, 31, 0.1)' },
  modalItemText: { fontSize: 16, color: '#3D2B1F' },
  modalCloseButton: { marginTop: 16, backgroundColor: '#3D2B1F', padding: 14, borderRadius: 8, alignItems: 'center' },
  modalCloseText: { color: '#FFF6E6', fontWeight: 'bold' }
});
