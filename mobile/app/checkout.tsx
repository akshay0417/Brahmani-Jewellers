import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Checkout Form State
  const [deliveryMode, setDeliveryMode] = useState('Delivery'); // 'Delivery' | 'Pickup'
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'Bank Transfer'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  useEffect(() => {
    if (user) {
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
      // Pre-fill user profile info if exists
      if (user) {
        setName(user.name || '');
        setMobile(user.mobile || '');
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch shopping cart details");
    } finally {
      setLoading(false);
    }
  };

  const getSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  };

  const getShippingCharge = () => {
    if (deliveryMode === 'Pickup') return 0;
    const sub = getSubtotal();
    return sub > 5000 ? 0 : 150; // Free delivery over ₹5000
  };

  const getGST = () => {
    const sub = getSubtotal();
    // 3% GST is already included in prices, but we can display the component
    return Math.round(sub * (3 / 103));
  };

  const getGrandTotal = () => {
    return getSubtotal() + getShippingCharge();
  };

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (deliveryMode === 'Delivery') {
      if (!name || !mobile || !address || !city || !state || !pincode) {
        Alert.alert("Missing Information", "Please fill in all shipping address fields.");
        return;
      }
    }

    try {
      setPlacingOrder(true);
      
      const orderItems = cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        priceAtPurchase: item.product.price
      }));

      const randomPickupCode = Math.floor(1000 + Math.random() * 9000).toString(); // Generate random pickup pin

      const shippingAddress = deliveryMode === 'Pickup' ? {
        name: 'In-Store Pickup',
        mobile: user.mobile || 'N/A',
        address: 'Brahmani Jewellers Showroom, Ahmedabad',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380026'
      } : {
        name,
        mobile,
        address,
        city,
        state,
        pincode
      };

      const payload = {
        items: orderItems,
        totalAmount: getGrandTotal(),
        shippingAddress,
        paymentMethod: paymentMethod === 'COD' ? 'COD' : 'Bank Transfer',
        deliveryMode,
        pickupCode: deliveryMode === 'Pickup' ? randomPickupCode : undefined,
        shippingCharge: getShippingCharge(),
        distanceKm: deliveryMode === 'Pickup' ? 0 : 5 // Flat average distance for default pricing
      };

      await axios.post(`${API_URL}/orders`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      Alert.alert(
        "Order Placed! 🎉",
        deliveryMode === 'Pickup' 
          ? `Your items are ready for pickup. Secure code: ${randomPickupCode}`
          : "Your order has been placed successfully. You can track progress in the Orders tab.",
        [
          { 
            text: "View Orders", 
            onPress: () => {
              // Direct navigation to orders tab
              router.replace('/orders');
            } 
          }
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.message || "Could not place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={64} color="rgba(28, 28, 30, 0.2)" />
          <Text style={styles.emptyText}>No items to checkout</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/coins')}>
            <Text style={styles.browseBtnText}>Browse Shop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Toggle mode */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleBtn, deliveryMode === 'Delivery' && styles.activeToggleBtn]}
            onPress={() => setDeliveryMode('Delivery')}
          >
            <Ionicons name="truck" size={16} color={deliveryMode === 'Delivery' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.toggleBtnText, deliveryMode === 'Delivery' && styles.activeToggleBtnText]}>Home Delivery</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, deliveryMode === 'Pickup' && styles.activeToggleBtn]}
            onPress={() => setDeliveryMode('Pickup')}
          >
            <Ionicons name="storefront" size={16} color={deliveryMode === 'Pickup' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.toggleBtnText, deliveryMode === 'Pickup' && styles.activeToggleBtnText]}>In-Store Pickup</Text>
          </TouchableOpacity>
        </View>

        {deliveryMode === 'Pickup' ? (
          <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>In-Store Pickup Location</Text>
            <View style={styles.pickupStoreBox}>
              <Ionicons name="location" size={20} color="#D4AF37" style={{ marginBottom: 4 }} />
              <Text style={styles.storeName}>Brahmani Jewellers Showroom</Text>
              <Text style={styles.storeAddress}>
                Shop 4, Brahmani Complex, Near Hatkeshwar Circle, Amraiwadi, Ahmedabad, 380026.
                {"\n"}
                Phone: +91 99258 11771
              </Text>
            </View>
            <Text style={styles.pickupNote}>* You will receive a secure pickup code on confirmation. Show this code at the counter to collect your jewellery.</Text>
          </Reanimated.View>
        ) : (
          <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <TextInput
              placeholder="Receiver's Full Name"
              placeholderTextColor="rgba(28,28,30,0.3)"
              style={styles.textInput}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Mobile Number"
              placeholderTextColor="rgba(28,28,30,0.3)"
              keyboardType="phone-pad"
              style={styles.textInput}
              value={mobile}
              onChangeText={setMobile}
            />
            <TextInput
              placeholder="Shipping Address (Flat, Street, Area)"
              placeholderTextColor="rgba(28,28,30,0.3)"
              style={styles.textInput}
              value={address}
              onChangeText={setAddress}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                placeholder="City"
                placeholderTextColor="rgba(28,28,30,0.3)"
                style={[styles.textInput, { flex: 1 }]}
                value={city}
                onChangeText={setCity}
              />
              <TextInput
                placeholder="State"
                placeholderTextColor="rgba(28,28,30,0.3)"
                style={[styles.textInput, { flex: 1 }]}
                value={state}
                onChangeText={setState}
              />
            </View>
            <TextInput
              placeholder="Pincode"
              placeholderTextColor="rgba(28,28,30,0.3)"
              keyboardType="numeric"
              style={styles.textInput}
              value={pincode}
              onChangeText={setPincode}
            />
          </Reanimated.View>
        )}

        {/* Payment Method Select */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleBtn, paymentMethod === 'COD' && styles.activeToggleBtn]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Text style={[styles.toggleBtnText, paymentMethod === 'COD' && styles.activeToggleBtnText]}>COD / Cash on Pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleBtn, paymentMethod === 'Bank' && styles.activeToggleBtn]}
              onPress={() => setPaymentMethod('Bank')}
            >
              <Text style={[styles.toggleBtnText, paymentMethod === 'Bank' && styles.activeToggleBtnText]}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>
          {paymentMethod === 'Bank' && (
            <View style={styles.bankBox}>
              <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>Bank Name:</Text> HDFC Bank</Text>
              <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>A/C Name:</Text> Brahmani Jewellers</Text>
              <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>A/C Number:</Text> 50200081273891</Text>
              <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>IFSC:</Text> HDFC0001203</Text>
            </View>
          )}
        </View>

        {/* Pricing Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Items Subtotal</Text>
            <Text style={styles.priceVal}>₹{getSubtotal().toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Charge</Text>
            <Text style={styles.priceVal}>{getShippingCharge() === 0 ? 'FREE' : `₹${getShippingCharge()}`}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (3% included)</Text>
            <Text style={styles.priceVal}>₹{getGST().toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalVal}>₹{getGrandTotal().toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Confirm Order Button */}
        <TouchableOpacity 
          style={styles.confirmBtn} 
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>PLACE ORDER (₹{getGrandTotal().toLocaleString('en-IN')})</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FAF9F6', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingTop: 20 },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  container: { padding: 16, paddingBottom: 80 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2, marginBottom: 16 },
  toggleBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 8, borderRadius: 6, gap: 6 },
  activeToggleBtn: { backgroundColor: '#1C1C1E' },
  toggleBtnText: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93' },
  activeToggleBtnText: { color: '#FFFFFF' },

  section: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#F2F2F7', padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { height: 40, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 6, paddingHorizontal: 10, fontSize: 14, color: '#1C1C1E', backgroundColor: '#FAF9F6', marginBottom: 10 },
  
  pickupStoreBox: { backgroundColor: '#FAF9F6', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', alignItems: 'center' },
  storeName: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  storeAddress: { fontSize: 12, color: 'rgba(28,28,30,0.6)', lineHeight: 18, textAlign: 'center' },
  pickupNote: { fontSize: 10, color: '#8E8E93', fontStyle: 'italic', marginTop: 8, lineHeight: 14 },

  bankBox: { backgroundColor: '#FAF9F6', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E5EA', marginTop: 8 },
  bankText: { fontSize: 12, color: '#1C1C1E', marginVertical: 2 },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  priceLabel: { fontSize: 13, color: 'rgba(28,28,30,0.5)' },
  priceVal: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 10 },
  grandTotalLabel: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' },
  grandTotalVal: { fontSize: 18, fontWeight: 'bold', color: '#D4AF37' },

  confirmBtn: { backgroundColor: '#1C1C1E', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4 },
  confirmBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, paddingVertical: 120 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 14, marginBottom: 24, fontWeight: '600' },
  browseBtn: { backgroundColor: '#1C1C1E', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 8 },
  browseBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }
});
