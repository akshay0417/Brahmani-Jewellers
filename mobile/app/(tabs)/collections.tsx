import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Linking } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

// Replace with your actual backend URL for mobile testing
const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CollectionsScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'collection'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, ratesRes] = await Promise.all([
        axios.get(`${API_URL}/gallery`),
        axios.get(`${API_URL}/rates`).catch(() => null)
      ]);
      setItems(itemsRes.data || []);
      if (ratesRes && ratesRes.data) {
        setRates(ratesRes.data);
      } else {
        // Fallback rates
        setRates({ gold22K: 6250, gold24K: 6820, gold18K: 5120, silver: 74 });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch gallery items");
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

  const calculatePrice = (item) => {
    if (item.price) return item.price;
    if (!rates || !item.weight || !item.purity) return 0;

    let ratePerGram = 0;
    const p = (item.purity || '').toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('90') || p.includes('SILVER')) ratePerGram = (rates.silver90 || rates.silver || 74) / 1000;

    if (!ratePerGram) return 0;

    const weight = parseFloat(item.weight);
    const basePrice = ratePerGram * weight;
    const makingPercent = item.makingCharges || 0;
    const makingAmount = basePrice * (makingPercent / 100);
    const other = item.otherCharges || 0;
    const subtotal = basePrice + makingAmount + other;
    const gst = subtotal * 0.03;
    return Math.round(subtotal + gst);
  };

  const initiateWhatsAppInquiry = (item) => {
    const price = calculatePrice(item);
    let message = `Hello Brahmani Jewellers! I am interested in this design from your Collection Lookbook:\n\n`;
    message += `*Name:* ${item.name || `${item.category} Ornament`}\n`;
    message += `*Category:* ${item.category}\n`;
    if (item.subCategory) message += `*Subcategory:* ${item.subCategory}\n`;
    if (item.weight) message += `*Weight:* ${item.weight}g\n`;
    if (price > 0) message += `*Estimated Price:* ₹${price.toLocaleString('en-IN')}\n`;
    message += `\nImage: ${item.imageUrl}`;

    const url = `https://wa.me/919925811771?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your phone.");
    });
  };

  const filteredItems = items.filter(item => {
    // 1. Tab segmentation filtering
    const isShopItem = item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage;
    const isCollectionItem = item.targetPage === 'collection' || item.targetPage === 'both';
    
    if (activeTab === 'shop' && !isShopItem) return false;
    if (activeTab === 'collection' && !isCollectionItem) return false;

    // 2. Search query filtering
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
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Container */}
      <View style={styles.header}>
        <Text style={styles.title}>Brahmani Showroom</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="rgba(28, 28, 30, 0.4)" style={styles.searchIcon} />
          <TextInput
            placeholder="Search gold, silver, rings..."
            placeholderTextColor="rgba(28, 28, 30, 0.4)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Tab Segment Controller */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'shop' && styles.activeTabButton]}
            onPress={() => setActiveTab('shop')}
          >
            <Ionicons name="cart" size={18} color={activeTab === 'shop' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'shop' && styles.activeTabButtonText]}>Showroom</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'collection' && styles.activeTabButton]}
            onPress={() => setActiveTab('collection')}
          >
            <Ionicons name="diamond" size={16} color={activeTab === 'collection' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'collection' && styles.activeTabButtonText]}>Lookbook</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {filteredItems.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
            <Text style={styles.noResultsText}>No designs match your search query</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item, index) => {
              const computedPrice = calculatePrice(item);
              return (
                <Reanimated.View 
                  entering={FadeInDown.duration(350).delay(Math.min(index * 35, 250))}
                  key={item._id} 
                  style={styles.card}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.image} />
                  
                  {/* Weight tag floating on image if exists */}
                  {item.weight && (
                    <View style={styles.weightTag}>
                      <Text style={styles.weightTagText}>{item.weight}g</Text>
                    </View>
                  )}

                  <View style={styles.cardInfo}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name || `${item.category} Ornament`}</Text>
                    
                    <Text style={styles.itemDetails} numberOfLines={1}>
                      {item.purity ? `${item.purity} ` : ''}
                      {item.subCategory ? `${item.subCategory}` : `${item.category}`}
                    </Text>

                    {/* Weight & Price displayed directly on card */}
                    <View style={styles.priceWeightRow}>
                      {computedPrice > 0 ? (
                        <Text style={styles.itemPrice}>₹{computedPrice.toLocaleString('en-IN')}</Text>
                      ) : (
                        <Text style={styles.itemPrice}>Price on Request</Text>
                      )}
                    </View>

                    {activeTab === 'shop' ? (
                      <TouchableOpacity style={styles.button} onPress={() => addToCart(item._id)}>
                        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.buttonText}>Add to Cart</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.button, styles.whatsappButton]} onPress={() => initiateWhatsAppInquiry(item)}>
                        <FontAwesome name="whatsapp" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>WhatsApp Inquiry</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Reanimated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FAF9F6', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 1, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1C1C1E', fontSize: 14 },
  
  // Tab Segments
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },

  container: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    width: '48%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    marginBottom: 16, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  image: { width: '100%', height: 140, resizeMode: 'cover' },
  weightTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(28, 28, 30, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  weightTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfo: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginBottom: 2, textTransform: 'capitalize', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  itemDetails: { fontSize: 11, color: 'rgba(28, 28, 30, 0.5)', marginBottom: 6, textTransform: 'capitalize' },
  priceWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
  button: { 
    backgroundColor: '#1C1C1E', 
    paddingVertical: 8, 
    borderRadius: 6, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  noResultsText: { fontSize: 14, color: 'rgba(28, 28, 30, 0.5)', marginTop: 12, fontWeight: '600' }
});
