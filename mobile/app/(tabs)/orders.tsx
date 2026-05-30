import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/my`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setOrders(response.data || []);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch orders list");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}><Text style={styles.title}>My Orders</Text></View>
        <View style={styles.noUserContainer}>
          <Ionicons name="lock-closed" size={64} color="rgba(28, 28, 30, 0.2)" />
          <Text style={styles.noUserText}>Please login to view your orders</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.subtitle}>Track your purchases, deliveries, and in-store pickups</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="rgba(28, 28, 30, 0.2)" />
            <Text style={styles.emptyText}>You haven't placed any orders yet.</Text>
          </View>
        ) : (
          orders.map((order, index) => (
            <Reanimated.View 
              entering={FadeInDown.duration(350).delay(Math.min(index * 40, 240))}
              key={order._id} 
              style={styles.orderCard}
            >
              {/* Order Card Header */}
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderIdText}>Order #{order._id.substring(16).toUpperCase()}</Text>
                  <Text style={styles.orderDateText}>{new Date(order.createdAt).toLocaleString('en-IN')}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  order.status === 'Delivered' ? styles.statusDelivered :
                  order.status === 'Processing' ? styles.statusProcessing :
                  order.status === 'Shipped' ? styles.statusShipped : styles.statusPending
                ]}>
                  <Text style={styles.statusBadgeText}>{order.status}</Text>
                </View>
              </View>

              {/* Order Items */}
              <View style={styles.itemsContainer}>
                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Image 
                      source={{ uri: item.product?.imageUrl || 'https://images.unsplash.com/photo-1610660233042-498c4714659b?auto=format&fit=crop&w=800&q=80' }} 
                      style={styles.itemImage} 
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.product?.name || `${item.product?.category} Ornament`}</Text>
                      <Text style={styles.itemQty}>Qty: {item.quantity} • Weight: {item.product?.weight || 'N/A'}g</Text>
                    </View>
                    <Text style={styles.itemPrice}>₹{item.priceAtPurchase?.toLocaleString('en-IN')}</Text>
                  </View>
                ))}
              </View>

              {/* Delivery mode specific UI */}
              {order.deliveryMode === 'Pickup' ? (
                <View style={styles.pickupBox}>
                  <View style={styles.pickupBoxHeader}>
                    <MaterialCommunityIcons name="store-clock-outline" size={18} color="#D4AF37" />
                    <Text style={styles.pickupTitle}>In-Store Pickup Details</Text>
                  </View>
                  <Text style={styles.pickupDesc}>Show this code to the store executive to collect your items:</Text>
                  <View style={styles.codeContainer}>
                    <Text style={styles.pickupCodeText}>Secure Code: {order.pickupCode || 'BP-8329'}</Text>
                  </View>
                  <Text style={styles.storeAddress}>Amraiwadi Showroom, Near Hatkeshwar Circle, Ahmedabad</Text>
                </View>
              ) : (
                order.trackingId && (
                  <View style={styles.trackingBox}>
                    <View style={styles.pickupBoxHeader}>
                      <FontAwesome name="truck" size={16} color="#D4AF37" />
                      <Text style={styles.pickupTitle}>Delhivery Shipment Tracking</Text>
                    </View>
                    <Text style={styles.trackingNumber}>AWB / Tracking ID: <Text style={{ fontWeight: 'bold', color: '#1C1C1E' }}>{order.trackingId}</Text></Text>
                    <Text style={styles.deliveryPartner}>Partner: {order.deliveryPartner}</Text>
                  </View>
                )
              )}

              {/* Order Card Footer */}
              <View style={styles.orderCardFooter}>
                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                  <Text style={styles.paymentMethodLabel}>Payment:</Text>
                  <Text style={styles.paymentMethodVal}>{order.paymentMethod} ({order.paymentStatus})</Text>
                </View>
                <Text style={styles.totalLabel}>Total: <Text style={styles.totalValue}>₹{order.totalAmount?.toLocaleString('en-IN')}</Text></Text>
              </View>
            </Reanimated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FAF9F6', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 11, color: '#8E8E93', marginTop: 4, fontWeight: '500', textAlign: 'center' },

  container: { padding: 16 },
  noUserContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  noUserText: { fontSize: 16, color: '#8E8E93', marginTop: 14, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 120 },
  emptyText: { fontSize: 14, color: '#8E8E93', marginTop: 14, fontWeight: '600' },

  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderIdText: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },
  orderDateText: { fontSize: 10, color: '#8E8E93', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#FFFFFF' },
  statusPending: { backgroundColor: '#f1c40f' },
  statusProcessing: { backgroundColor: '#e67e22' },
  statusShipped: { backgroundColor: '#3498db' },
  statusDelivered: { backgroundColor: '#2ecc71' },

  itemsContainer: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  itemImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: '#FAF9F6' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', textTransform: 'capitalize' },
  itemQty: { fontSize: 10, color: '#8E8E93', marginTop: 1 },
  itemPrice: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },

  pickupBox: {
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    padding: 12,
    marginBottom: 12,
  },
  pickupBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  pickupTitle: { fontSize: 12, fontWeight: 'bold', color: '#1C1C1E' },
  pickupDesc: { fontSize: 11, color: 'rgba(28,28,30,0.6)', lineHeight: 14, marginBottom: 8 },
  codeContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D4AF37',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  pickupCodeText: { fontSize: 15, fontWeight: 'bold', color: '#D4AF37', letterSpacing: 0.5 },
  storeAddress: { fontSize: 9, color: '#8E8E93', fontStyle: 'italic', textAlign: 'center' },

  trackingBox: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 12,
    marginBottom: 12,
  },
  trackingNumber: { fontSize: 11, color: 'rgba(28,28,30,0.6)', marginBottom: 2 },
  deliveryPartner: { fontSize: 10, color: '#8E8E93', fontStyle: 'italic' },

  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 10,
  },
  paymentMethodLabel: { fontSize: 11, color: '#8E8E93' },
  paymentMethodVal: { fontSize: 11, color: '#1C1C1E', fontWeight: 'bold' },
  totalLabel: { fontSize: 12, color: '#1C1C1E' },
  totalValue: { fontSize: 16, fontWeight: 'bold', color: '#D4AF37' }
});
