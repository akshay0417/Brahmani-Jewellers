import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Reanimated, { SlideOutRight, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CartScreen() {
  const router = useRouter();
  const { user, refreshCartCount } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<any>(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (user && user.token) {
        fetchRates();
        fetchCart();
      } else {
        setLoading(false);
      }
    }, [user])
  );

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API_URL}/rates`);
      setRates(response.data);
    } catch (error) {
      console.error("Error fetching rates in Cart:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const response = await axios.put(`${API_URL}/cart/update`, { productId, quantity }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart(response.data);
      refreshCartCount();
    } catch (error) {
      Alert.alert("Error", "Could not update quantity");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await fetch(`${API_URL}/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        refreshCartCount();
      } else {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to remove item");
      }
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      Alert.alert("Error", error.message || "Could not remove item");
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: 12 }]}><Text style={styles.title}>Shopping Cart</Text></View>
        <View style={styles.container}>
          <FontAwesome name="lock" size={64} color="rgba(61, 43, 31, 0.2)" />
          <Text style={styles.emptyText}>Please login to view your cart</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/login')}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#EBA938" />
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: 12 }]}><Text style={styles.title}>Shopping Cart</Text></View>
        <View style={styles.container}>
          <FontAwesome name="shopping-bag" size={64} color="rgba(61, 43, 31, 0.2)" />
          <Text style={styles.emptyText}>Your cart is currently empty</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.push('/collections')}>
            <Text style={styles.buttonText}>Browse Jewellery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const calculatePrice = (product: any) => {
    if (!product) return 0;
    if (product.price) return Math.round(Number(product.price) * 1.03);
    if (!rates || !product.weight || !product.purity) return 0;

    let ratePerGram = 0;
    const p = (product.purity || '').toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('92.5') || p.includes('925')) ratePerGram = (rates.silver90 / 1000) * (92.5 / 90);
    else if (p.includes('90') || p.includes('SILVER')) ratePerGram = rates.silver90 / 1000;

    if (!ratePerGram) return 0;

    const weight = parseFloat(product.weight);
    const basePrice = ratePerGram * weight;
    const makingPercent = product.makingCharges || 0;
    const makingAmount = basePrice * (makingPercent / 100);
    const other = product.otherCharges || 0;
    const subtotal = basePrice + makingAmount + other;
    const gst = subtotal * 0.03;
    return Math.round(subtotal + gst);
  };

  const total = cart.items.reduce((sum, item) => sum + (item.product ? (calculatePrice(item.product) * item.quantity) : 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: 12 }]}><Text style={styles.title}>Shopping Cart</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
        {cart.items.filter(item => item.product).map((item) => {
          const itemPrice = calculatePrice(item.product);
          return (
            <Reanimated.View 
              layout={LinearTransition}
              exiting={SlideOutRight.duration(250)}
              key={item.product._id} 
              style={styles.cartItem}
            >
              <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.product.category} Ornament</Text>
                <Text style={styles.itemPrice}>₹{itemPrice.toLocaleString('en-IN')}</Text>
                <View style={styles.quantityContainer}>
                  <Text style={styles.qtyStaticText}>Qty: 1</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeFromCart(item.product._id)} style={styles.removeBtn}><FontAwesome name="trash" size={20} color="#FF6B6B" /></TouchableOpacity>
            </Reanimated.View>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 70 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount:</Text>
          <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => router.push('/checkout')}>
          <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FFFFFF', alignItems: 'center', paddingTop: 30, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContainer: { padding: 16 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 16, marginBottom: 24, fontWeight: '500' },
  button: { backgroundColor: '#1C1C1E', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  cartItem: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 12, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  itemImage: { width: 80, height: 80, borderRadius: 8 },
  itemDetails: { flex: 1, marginLeft: 16 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', textTransform: 'capitalize', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  itemPrice: { fontSize: 14, color: '#D4AF37', fontWeight: 'bold', marginVertical: 4 },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  qtyBtn: { backgroundColor: '#1C1C1E', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  qtyText: { marginHorizontal: 12, fontWeight: 'bold', color: '#1C1C1E' },
  qtyStaticText: { fontSize: 13, color: '#8E8E93', fontWeight: 'bold', marginTop: 4 },
  removeBtn: { padding: 10 },
  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#1C1C1E', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  checkoutBtn: { backgroundColor: '#1C1C1E', paddingVertical: 16, borderRadius: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  checkoutText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});
