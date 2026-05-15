import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function HomeScreen() {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      // Note: localhost works for Web. For Android emulator, use 10.0.2.2
      const response = await fetch('http://192.168.1.13:5000/api/rates');
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Brahmani</Text>
          <Text style={styles.subtitle}>JEWELLERS</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Live Rates</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#EBA938" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.ratesContainer}>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Gold 24K</Text>
                <Text style={styles.rateValue}>₹{rates?.gold24K || '---'}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Gold 22K</Text>
                <Text style={styles.rateValue}>₹{rates?.gold22K || '---'}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Gold 18K</Text>
                <Text style={styles.rateValue}>₹{rates?.gold18K || '---'}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Silver</Text>
                <Text style={styles.rateValue}>₹{rates?.silver90 || rates?.silver || '---'}</Text>
              </View>
            </View>
          )}
        </View>

        {user ? (
          <View style={styles.userSection}>
            <Text style={styles.welcomeText}>Welcome, {user.name}!</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Link href="/login" asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Login to Account</Text>
            </TouchableOpacity>
          </Link>
        )}
        
        <StatusBar style="dark" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF6E6', // cream
  },
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3D2B1F', // coffee
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#EBA938', // ochre
    letterSpacing: 4,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FCF0DA', // cream-alt
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)', // ochre with opacity
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3D2B1F',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ratesContainer: {
    gap: 16,
  },
  rateBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF6E6',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EBA938',
  },
  rateLabel: {
    fontSize: 16,
    color: '#3D2B1F',
    fontWeight: '500',
  },
  rateValue: {
    fontSize: 18,
    color: '#3D2B1F',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 40,
    backgroundColor: '#3D2B1F', // coffee
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF6E6', // cream
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  userSection: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FCF0DA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.3)',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: 'rgba(61, 43, 31, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#3D2B1F',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  }
});
