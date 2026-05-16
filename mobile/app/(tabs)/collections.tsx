import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Replace with your actual backend URL for mobile testing
const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CollectionsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/gallery`);
      setItems(response.data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch collections");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to add items to cart");
      return;
    }

    try {
      await axios.post(`${API_URL}/cart/add`, { productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success", "Item added to cart");
    } catch (error) {
      Alert.alert("Error", "Could not add to cart");
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#EBA938" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Designs</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {items.map(item => (
            <View key={item._id} style={styles.card}>
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
              <View style={styles.cardInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.category} Ornament</Text>
                <Text style={styles.itemPrice}>₹{(item.price || 0).toLocaleString('en-IN')}</Text>
                <TouchableOpacity style={styles.button} onPress={() => addToCart(item._id)}>
                  <Text style={styles.buttonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  header: { padding: 20, backgroundColor: '#3D2B1F', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EBA938', letterSpacing: 1, marginTop: 20 },
  container: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FCF0DA', borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  image: { width: '100%', height: 150 },
  cardInfo: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#3D2B1F', marginBottom: 4, textTransform: 'capitalize' },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#EBA938', marginBottom: 12 },
  button: { backgroundColor: '#3D2B1F', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#FFF6E6', fontWeight: 'bold', fontSize: 12 }
});
