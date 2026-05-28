import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

// Replace with your actual backend URL for mobile testing
const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CollectionsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

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
        
        {/* Search Bar inside Designs Tab */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="rgba(255, 246, 230, 0.6)" style={styles.searchIcon} />
          <TextInput
            placeholder="Search gold, silver, necklace..."
            placeholderTextColor="rgba(255, 246, 230, 0.4)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {filteredItems.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="rgba(61, 43, 31, 0.3)" />
            <Text style={styles.noResultsText}>No designs match your search query</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map(item => (
              <View key={item._id} style={styles.card}>
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
                <View style={styles.cardInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name || `${item.category} Ornament`}</Text>
                  <Text style={styles.itemDetails} numberOfLines={1}>
                    {item.subCategory ? `${item.subCategory}` : `${item.category}`}
                    {item.weight ? ` • ${item.weight}g` : ''}
                  </Text>
                  <Text style={styles.itemPrice}>₹{(item.price || 0).toLocaleString('en-IN')}</Text>
                  <TouchableOpacity style={styles.button} onPress={() => addToCart(item._id)}>
                    <Text style={styles.buttonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  header: { padding: 20, backgroundColor: '#3D2B1F', alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EBA938', letterSpacing: 1, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 246, 230, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.3)',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF6E6', fontSize: 14 },
  container: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FCF0DA', borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  image: { width: '100%', height: 150 },
  cardInfo: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#3D2B1F', marginBottom: 2, textTransform: 'capitalize', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  itemDetails: { fontSize: 11, color: 'rgba(61, 43, 31, 0.5)', marginBottom: 8, textTransform: 'capitalize' },
  itemPrice: { fontSize: 15, fontWeight: 'bold', color: '#EBA938', marginBottom: 12 },
  button: { backgroundColor: '#3D2B1F', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#FFF6E6', fontWeight: 'bold', fontSize: 12 },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  noResultsText: { fontSize: 14, color: 'rgba(61, 43, 31, 0.5)', marginTop: 12, fontWeight: '600' }
});
