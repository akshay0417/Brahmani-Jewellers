import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import Reanimated, { SlideOutRight, LinearTransition } from 'react-native-reanimated';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [user]);

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
    } catch (error) {
      Alert.alert("Error", "Could not update quantity");
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const response = await axios.delete(`${API_URL}/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCart(response.data);
    } catch (error) {
      Alert.alert("Error", "Could not remove item");
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}><Text style={styles.title}>Shopping Cart</Text></View>
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
        <View style={styles.header}><Text style={styles.title}>Shopping Cart</Text></View>
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

  const total = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}><Text style={styles.title}>Shopping Cart</Text></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer}>
        {cart.items.map((item) => (
          <Reanimated.View 
            layout={LinearTransition}
            exiting={SlideOutRight.duration(250)}
            key={item.product._id} 
            style={styles.cartItem}
          >
            <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.product.category} Ornament</Text>
              <Text style={styles.itemPrice}>₹{(item.product.price).toLocaleString('en-IN')}</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={() => updateQuantity(item.product._id, item.quantity - 1)} style={styles.qtyBtn}><FontAwesome name="minus" size={12} color="#FFFFFF" /></TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQuantity(item.product._id, item.quantity + 1)} style={styles.qtyBtn}><FontAwesome name="plus" size={12} color="#FFFFFF" /></TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.product._id)} style={styles.removeBtn}><FontAwesome name="trash" size={20} color="#FF6B6B" /></TouchableOpacity>
          </Reanimated.View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
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
  header: { padding: 16, backgroundColor: '#FAF9F6', alignItems: 'center', paddingTop: 30, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
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
  removeBtn: { padding: 10 },
  footer: { padding: 20, backgroundColor: '#FAF9F6', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel: { fontSize: 16, color: '#1C1C1E', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E' },
  checkoutBtn: { backgroundColor: '#1C1C1E', paddingVertical: 16, borderRadius: 8, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  checkoutText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});
