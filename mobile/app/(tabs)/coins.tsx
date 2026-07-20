import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CoinsScreen() {
  const router = useRouter();
  const { user, refreshCartCount } = useAuth();
  const [coins, setCoins] = useState([
    { _id: 'c1', name: '24K Gold Coin (1 Gram)', category: 'gold', weight: '1', purity: '24K', imageUrl: 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80' },
    { _id: 'c2', name: '24K Gold Coin (5 Gram)', category: 'gold', weight: '5', purity: '24K', imageUrl: 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80' },
    { _id: 'c3', name: '999 Silver Coin (10 Gram)', category: 'silver', weight: '10', purity: '999', imageUrl: 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80' }
  ]);
  const [rates, setRates] = useState<any>({ gold22K: 66000, gold24K: 72000, gold18K: 54000, silver: 85000 });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [metalFilter, setMetalFilter] = useState('all'); // 'all' | 'gold' | 'silver'

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    try {
      const [itemsRes, ratesRes] = await Promise.all([
        axios.get(`${API_URL}/gallery`),
        axios.get(`${API_URL}/rates`).catch(() => null)
      ]);
      
      // Filter items to only show coins
      const galleryItems = itemsRes.data || [];
      const coinItems = galleryItems.filter((item: any) => 
        (item.subCategory && item.subCategory.toLowerCase() === 'coin') ||
        (item.name && item.name.toLowerCase().includes('coin'))
      );
      setCoins(coinItems);

      if (ratesRes && ratesRes.data) {
        setRates(ratesRes.data);
      } else {
        setRates({ gold22K: 6250, gold24K: 6820, gold18K: 5120, silver: 74 });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch coins catalog");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const calculatePrice = (item: any) => {
    if (item.price) return Math.round(Number(item.price) * 1.03);
    if (!rates || !item.weight) return 0;

    let ratePerGram = 0;
    const cat = (item.category || '').toLowerCase();
    const purity = (item.purity || '').toUpperCase();

    if (cat === 'gold') {
      if (purity.includes('24')) ratePerGram = rates.gold24K / 10;
      else if (purity.includes('22') || purity === '') ratePerGram = rates.gold22K / 10;
      else if (purity.includes('18')) ratePerGram = rates.gold18K / 10;
    } else if (cat === 'silver') {
      if (purity.includes('92.5') || purity.includes('925')) {
        ratePerGram = ((rates.silver90 || rates.silver || 74) / 1000) * (92.5 / 90);
      } else {
        ratePerGram = (rates.silver90 || rates.silver || 74) / 1000;
      }
    }

    if (!ratePerGram) return 0;

    const weight = parseFloat(item.weight);
    const basePrice = ratePerGram * weight;
    
    // Add making/minting charges (standard making charges or default ₹350 per coin)
    const makingAmount = item.makingCharges ? (basePrice * (item.makingCharges / 100)) : 350;
    const other = item.otherCharges || 0;
    const subtotal = basePrice + makingAmount + other;
    
    // 3% GST
    const gst = subtotal * 0.03;
    return Math.round(subtotal + gst);
  };

  const isValidObjectId = (str: string) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);

  const addToCart = async (productId: any) => {
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to buy gold & silver coins");
      router.push('/login');
      return;
    }

    if (!productId || !isValidObjectId(String(productId))) {
      Alert.alert("Preview Sample", "This coin is a demo sample. Please select a coin from live catalog.");
      return;
    }

    try {
      await axios.post(`${API_URL}/cart/add`, { productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success", "Coin added to cart successfully");
      refreshCartCount();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.");
        router.push('/login');
      } else {
        const errMsg = error.response?.data?.message || error.message || "Could not add coin to cart";
        Alert.alert("Error", errMsg);
      }
    }
  };

  const filteredCoins = coins.filter(coin => {
    if (metalFilter === 'gold' && coin.category.toLowerCase() !== 'gold') return false;
    if (metalFilter === 'silver' && coin.category.toLowerCase() !== 'silver') return false;
    return true;
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
      <View style={styles.header}>
        <Text style={styles.title}>Gold & Silver Coins</Text>
        <Text style={styles.subtitle}>BIS Hallmarked Certified Purity (3% GST Applied)</Text>
        
        {/* Metal Filters */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, metalFilter === 'all' && styles.activeTabButton]}
            onPress={() => setMetalFilter('all')}
          >
            <Text style={[styles.tabButtonText, metalFilter === 'all' && styles.activeTabButtonText]}>All Coins</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, metalFilter === 'gold' && styles.activeTabButton]}
            onPress={() => setMetalFilter('gold')}
          >
            <Text style={[styles.tabButtonText, metalFilter === 'gold' && styles.activeTabButtonText]}>Gold Coins</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, metalFilter === 'silver' && styles.activeTabButton]}
            onPress={() => setMetalFilter('silver')}
          >
            <Text style={[styles.tabButtonText, metalFilter === 'silver' && styles.activeTabButtonText]}>Silver Coins</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D4AF37']} tintColor="#D4AF37" />
        }
      >
        {filteredCoins.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="gift-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
            <Text style={styles.noResultsText}>No coins listed at the moment.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCoins.map((coin, index) => {
              const price = calculatePrice(coin);
              return (
                <Reanimated.View 
                  entering={FadeInDown.duration(350).delay(Math.min(index * 35, 250))}
                  key={coin._id} 
                  style={styles.card}
                >
                  <Image 
                    source={{ uri: coin.imageUrl || 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80' }} 
                    style={styles.image} 
                  />
                  
                  {/* Floating weight tag */}
                  <View style={styles.weightTag}>
                    <Text style={styles.weightTagText}>{coin.weight || '1'}g</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.coinName} numberOfLines={1}>{coin.name || `${coin.weight}g ${coin.category} Coin`}</Text>
                    <Text style={styles.coinDetails}>
                      {coin.purity ? `${coin.purity} Purity` : 'BIS Hallmarked'}
                    </Text>

                    <Text style={styles.coinPrice}>₹{price.toLocaleString('en-IN')}</Text>
                    <Text style={styles.gstNote}>(Incl. 3% GST)</Text>

                    <TouchableOpacity style={styles.button} onPress={() => addToCart(coin._id)}>
                      <Ionicons name="cart" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>Buy Coin</Text>
                    </TouchableOpacity>
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
  header: { padding: 16, backgroundColor: '#FFFFFF', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#6B1124', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 11, color: '#D4AF37', marginTop: 4, marginBottom: 14, fontWeight: '700', letterSpacing: 1 },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(107, 17, 36, 0.06)',
    borderRadius: 8,
    padding: 3,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#6B1124',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B1124',
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
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  image: { width: '100%', height: 130, resizeMode: 'contain', backgroundColor: '#FFFFFF', marginTop: 6 },
  weightTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(107, 17, 36, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  weightTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfo: { padding: 12, alignItems: 'center' },
  coinName: { fontSize: 14, fontWeight: '700', color: '#6B1124', marginBottom: 2, textTransform: 'capitalize', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  coinDetails: { fontSize: 11, color: '#666666', marginBottom: 6 },
  coinPrice: { fontSize: 15, fontWeight: 'bold', color: '#6B1124' },
  gstNote: { fontSize: 9, color: 'rgba(107, 17, 36, 0.5)', marginBottom: 10, fontWeight: '600' },
  button: { 
    backgroundColor: '#6B1124', 
    paddingVertical: 8, 
    width: '100%',
    borderRadius: 6, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, width: '100%' },
  noResultsText: { fontSize: 14, color: 'rgba(107, 17, 36, 0.5)', marginTop: 12, fontWeight: '600' }
});
