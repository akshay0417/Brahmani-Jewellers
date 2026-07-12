import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Razorpay WebView states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [pendingOrderInfo, setPendingOrderInfo] = useState<any>(null);

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setShowPaymentModal(false);
      
      if (data.status === 'success') {
        setPlacingOrder(true);
        const { orderData, randomPickupCode } = pendingOrderInfo;
        
        await axios.post(`${API_URL}/orders/verify-payment`, {
          orderData,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        showOrderSuccess(randomPickupCode);
      } else if (data.status === 'cancelled') {
        Alert.alert("Payment Cancelled", "The payment process was cancelled.");
        setPlacingOrder(false);
      } else {
        Alert.alert("Payment Failed", data.error?.description || data.message || "Payment transaction failed.");
        setPlacingOrder(false);
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Verification Error", "Failed to parse payment details or verify payment.");
      setPlacingOrder(false);
    }
  };

  // Checkout Form State
  const [deliveryMode, setDeliveryMode] = useState('Delivery'); // 'Delivery' | 'Pickup'
  const [paymentMethod, setPaymentMethod] = useState('Razorpay'); // 'Razorpay' | 'COD'
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  // Delivery settings state
  const [deliveryRates, setDeliveryRates] = useState({ freeDeliveryKmLimit: 10, deliveryChargePerKm: 15, codEnabled: true });

  // Coupon states
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchCart();
        fetchDeliveryRates();
      } else {
        setLoading(false);
      }
    }, [user])
  );

  const fetchDeliveryRates = async () => {
    try {
      const response = await axios.get(`${API_URL}/rates`);
      if (response.data) {
        setDeliveryRates({
          freeDeliveryKmLimit: response.data.freeDeliveryKmLimit ?? 10,
          deliveryChargePerKm: response.data.deliveryChargePerKm ?? 15,
          codEnabled: response.data.codEnabled ?? true
        });
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
    }
  };

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

  const calculateDistance = (pinStr: string) => {
    const pin = parseInt(pinStr);
    if (!pin || isNaN(pin) || pinStr.length < 6) return 0;
    
    // If it's the shop's pincode (Amraiwadi)
    if (pin === 380026) return 1;

    // Specifically handle Vastral (382418)
    if (pin === 382418) return 5;
    
    // If it's in Ahmedabad/Gandhinagar region (starts with 380... or 382...)
    if (pinStr.startsWith('380') || pinStr.startsWith('382')) {
      const lastThree = pin % 1000;
      return 3 + (lastThree % 15);
    }
    
    // If it's in Gujarat but outside Ahmedabad/Gandhinagar
    if (pinStr.startsWith('37') || pinStr.startsWith('38') || pinStr.startsWith('39')) {
      const lastThree = pin % 1000;
      return 30 + (lastThree % 170);
    }
    
    // Outside Gujarat
    return 500;
  };

  const getDistance = () => {
    if (deliveryMode === 'Pickup') return 0;
    return calculateDistance(pincode);
  };

  const getItemsBaseTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (item.product ? (Math.round(item.product.price / 1.03) * item.quantity) : 0), 0);
  };

  const getShippingCharge = () => {
    if (deliveryMode === 'Pickup') return 0;
    const dist = getDistance();
    if (dist <= deliveryRates.freeDeliveryKmLimit) {
      return 0;
    } else {
      return Math.round((dist - deliveryRates.freeDeliveryKmLimit) * deliveryRates.deliveryChargePerKm);
    }
  };

  const getGST = () => {
    const baseTotal = getItemsBaseTotal();
    return Math.round(baseTotal * 0.03);
  };

  const getDiscountAmount = () => {
    const baseTotal = getItemsBaseTotal();
    return Math.round((baseTotal * discountPercent) / 100);
  };

  const getGatewayCharge = () => {
    if (paymentMethod === 'Razorpay') {
      const subtotal = getItemsBaseTotal() + getGST() + getShippingCharge() - getDiscountAmount();
      return Math.round(subtotal * 0.02); // 2% Razorpay Gateway Fee
    }
    return 0;
  };

  const getGrandTotal = () => {
    return getItemsBaseTotal() + getGST() + getShippingCharge() - getDiscountAmount() + getGatewayCharge();
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/coupons/validate`, { code: couponInput.trim() }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data) {
        setCouponCode(response.data.code);
        setDiscountPercent(response.data.discountPercent);
        setCouponSuccess(`Coupon "${response.data.code}" applied! ${response.data.discountPercent}% Discount.`);
      }
    } catch (error: any) {
      setCouponCode('');
      setDiscountPercent(0);
      setCouponError(error.response?.data?.message || 'Invalid coupon code');
    }
  };

  const showOrderSuccess = (randomPickupCode: string) => {
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
  };

  const handlePlaceOrder = async () => {
    if (!user) return;

    if (deliveryMode === 'Delivery') {
      if (!name || !mobile || !address || !city || !state || !pincode) {
        Alert.alert("Missing Information", "Please fill in all shipping address fields.");
        return;
      }
    }

    // No payment reference validation needed since UPI/Bank are removed

    try {
      setPlacingOrder(true);
      
      const orderItems = cart.items
        .filter(item => item.product)
        .map(item => ({
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

      const orderData = {
        items: orderItems,
        totalAmount: getGrandTotal(),
        shippingAddress,
        shippingCharge: getShippingCharge(),
        distanceKm: getDistance(),
        couponCode: couponCode || undefined,
        discountAmount: getDiscountAmount()
      };

      if (paymentMethod === 'COD') {
        const payload = {
          ...orderData,
          paymentMethod: 'COD',
          paymentReference: 'COD Order',
          deliveryMode,
          pickupCode: deliveryMode === 'Pickup' ? randomPickupCode : undefined,
        };

        await axios.post(`${API_URL}/orders`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        showOrderSuccess(randomPickupCode);
      } else {
        // Razorpay checkout
        const rzpOrderRes = await axios.post(`${API_URL}/orders/razorpay-order`, { totalAmount: getGrandTotal() }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const rzpOrderId = rzpOrderRes.data.id;

        if (rzpOrderRes.data.isMock) {
          // Simulation mode
          Alert.alert(
            "[RAZORPAY SIMULATION]",
            `Simulate payment of ₹${getGrandTotal().toLocaleString('en-IN')}?`,
            [
              { text: "Cancel", style: "cancel", onPress: () => setPlacingOrder(false) },
              {
                text: "Pay (Simulate)",
                onPress: async () => {
                  try {
                    setPlacingOrder(true);
                    const mockPaymentId = 'pay_mock_' + Math.random().toString(36).substring(2, 15);
                    const mockSignature = 'sig_mock_' + Math.random().toString(36).substring(2, 15);

                    await axios.post(`${API_URL}/orders/verify-payment`, {
                      orderData,
                      razorpay_payment_id: mockPaymentId,
                      razorpay_order_id: rzpOrderId,
                      razorpay_signature: mockSignature
                    }, {
                      headers: { Authorization: `Bearer ${user.token}` }
                    });

                    showOrderSuccess(randomPickupCode);
                  } catch (verifyErr: any) {
                    Alert.alert("Payment Error", verifyErr.response?.data?.message || "Payment verification failed");
                  } finally {
                    setPlacingOrder(false);
                  }
                }
              }
            ]
          );
        } else {
          // Live Razorpay mode: Open Razorpay WebView modal
          const rzpKey = rzpOrderRes.data.key || 'rzp_test_mockKeyId123';
          const rzpAmount = rzpOrderRes.data.amount;
          const rzpCurrency = rzpOrderRes.data.currency || 'INR';

          setPendingOrderInfo({ orderData, randomPickupCode });
          const html = generateRazorpayHtml(
            rzpKey,
            rzpAmount,
            rzpCurrency,
            rzpOrderId,
            name,
            mobile,
            user?.email || ''
          );
          setPaymentHtml(html);
          setShowPaymentModal(true);
        }
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error.response?.data?.message || "Could not place order");
    } finally {
      if (paymentMethod !== 'Razorpay') {
        setPlacingOrder(false);
      }
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.title}>Checkout Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
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
                Choksi Bazar, Azad Chowk, Amraiwadi, Ahmedabad.
                {"\n"}
                Phone: +91 7621967577
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {deliveryRates.codEnabled && (
              <TouchableOpacity 
                style={[styles.paymentToggleBtn, paymentMethod === 'COD' && styles.activePaymentToggleBtn]}
                onPress={() => setPaymentMethod('COD')}
              >
                <Text style={[styles.paymentToggleBtnText, paymentMethod === 'COD' && styles.activePaymentToggleBtnText]}>COD</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[styles.paymentToggleBtn, paymentMethod === 'Razorpay' && styles.activePaymentToggleBtn]}
              onPress={() => setPaymentMethod('Razorpay')}
            >
              <Text style={[styles.paymentToggleBtnText, paymentMethod === 'Razorpay' && styles.activePaymentToggleBtnText]}>Online (UPI/Card)</Text>
            </TouchableOpacity>
          </View>
          
          {paymentMethod === 'Razorpay' ? (
            <View style={styles.bankBox}>
              <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>Online Payment via Razorpay:</Text></Text>
              <Text style={styles.bankText}>Pay securely using Cards, Netbanking, UPI, or Wallet.</Text>
            </View>
          ) : (
            <View style={styles.bankBox}>
              <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>Cash on Delivery (COD):</Text></Text>
              <Text style={styles.bankText}>Pay in cash when your order is delivered to your door.</Text>
            </View>
          )}
        </View>

        {/* Coupon Code Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TextInput
              placeholder="Enter Coupon Code"
              placeholderTextColor="rgba(28,28,30,0.3)"
              autoCapitalize="characters"
              style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
              value={couponInput}
              onChangeText={(text) => setCouponInput(text.toUpperCase())}
              editable={!couponCode}
            />
            {couponCode ? (
              <TouchableOpacity 
                style={[styles.couponBtn, { backgroundColor: '#FF3B30' }]} 
                onPress={() => {
                  setCouponCode('');
                  setCouponInput('');
                  setDiscountPercent(0);
                  setCouponSuccess('');
                  setCouponError('');
                }}
              >
                <Text style={styles.couponBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.couponBtn} 
                onPress={handleApplyCoupon}
              >
                <Text style={styles.couponBtnText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>
          {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
          {couponSuccess ? <Text style={styles.successText}>{couponSuccess}</Text> : null}
        </View>

        {/* Pricing Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Items Subtotal</Text>
            <Text style={styles.priceVal}>₹{getItemsBaseTotal().toLocaleString('en-IN')}</Text>
          </View>
          {discountPercent > 0 && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: '#34C759' }]}>Coupon Discount ({discountPercent}%)</Text>
              <Text style={[styles.priceVal, { color: '#34C759' }]}>- ₹{getDiscountAmount().toLocaleString('en-IN')}</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Shipping Charge</Text>
            <Text style={styles.priceVal}>{getShippingCharge() === 0 ? 'FREE' : `₹${getShippingCharge()}`}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (3%)</Text>
            <Text style={styles.priceVal}>₹{getGST().toLocaleString('en-IN')}</Text>
          </View>
          {paymentMethod === 'Razorpay' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Gateway Charges (2%)</Text>
              <Text style={styles.priceVal}>₹{getGatewayCharge().toLocaleString('en-IN')}</Text>
            </View>
          )}
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalVal}>₹{getGrandTotal().toLocaleString('en-IN')}</Text>
          </View>
          {getDistance() > 0 && deliveryRates.freeDeliveryKmLimit > 0 && (
            <Text style={{ fontSize: 10, color: '#8E8E93', marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>
              * Free delivery up to {deliveryRates.freeDeliveryKmLimit} km. ₹{deliveryRates.deliveryChargePerKm}/km above it.
            </Text>
          )}
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

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentModal(false);
          setPlacingOrder(false);
          Alert.alert("Payment Cancelled", "Payment process was cancelled.");
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' }}>Secure Payment Gateway</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowPaymentModal(false);
                setPlacingOrder(false);
                Alert.alert("Payment Cancelled", "Payment process was cancelled.");
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: paymentHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            androidHardwareAccelerationDisabled={false}
            scalesPageToFit={true}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>

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
  browseBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  paymentToggleBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FAF9F6',
    marginBottom: 6,
    gap: 6
  },
  activePaymentToggleBtn: {
    backgroundColor: '#1C1C1E',
    borderColor: '#1C1C1E'
  },
  paymentToggleBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93'
  },
  activePaymentToggleBtnText: {
    color: '#FFFFFF'
  },
  couponBtn: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  couponBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13
  },
  errorText: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 6,
    fontWeight: 'bold'
  },
  successText: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 6,
    fontWeight: 'bold'
  }
});

const generateRazorpayHtml = (key: string, amount: number, currency: string, orderId: string, name: string, contact: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://checkout.razorpay.com" crossorigin>
      <link rel="dns-prefetch" href="https://checkout.razorpay.com">
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #D4AF37;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .message {
          margin-top: 20px;
          font-size: 15px;
          font-weight: 500;
          color: #1C1C1E;
        }
      </style>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <div class="loader-container">
        <div class="loader"></div>
        <div class="message" id="msg">Initializing secure payment...</div>
      </div>

      <script>
        const options = {
          key: "${key}",
          amount: ${amount},
          currency: "${currency}",
          name: "Brahmani Jewellers",
          description: "Luxury Jewellery Purchase",
          order_id: "${orderId}",
          handler: function (response) {
            document.getElementById('msg').innerText = "Payment successful! Verifying transaction...";
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'success',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }));
          },
          prefill: {
            name: "${name}",
            contact: "${contact}",
            email: "${email}"
          },
          theme: {
            color: "#1C1C1E"
          },
          modal: {
            ondismiss: function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'cancelled'
              }));
            }
          }
        };

        window.onload = function() {
          try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'failed',
                error: response.error
              }));
            });
            rzp.open();
          } catch (err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'error',
              message: err.message
            }));
          }
        };
      </script>
    </body>
    </html>
  `;
};
