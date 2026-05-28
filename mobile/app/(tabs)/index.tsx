import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Image, FlatList, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
    title: 'Timeless Rings',
    subtitle: '100% Purity Certified',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
    title: 'Royal Necklaces',
    subtitle: 'Classic & Modern Sets',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&auto=format&fit=crop&q=80',
    title: 'Fine Bracelets',
    subtitle: 'Crafted with Passion',
  },
  {
    id: '4',
    image: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
    title: 'Breathtaking Earrings',
    subtitle: 'Made for Every Occasion',
  }
];

const CATEGORIES = [
  { id: '1', name: 'Gold', icon: 'diamond' },
  { id: '2', name: 'Silver', icon: 'star' },
  { id: '3', name: 'Rudraksha', icon: 'leaf' },
  { id: '4', name: 'Antique', icon: 'shield' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [rates, setRates] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingRates, setLoadingRates] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    if (user && user.token) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [user]);

  const fetchRates = async () => {
    try {
      const response = await axios.get(`${API_URL}/rates`);
      setRates(response.data);
    } catch (error) {
      console.error('Error fetching rates:', error);
      // Fallback
      setRates({ gold22K: 6250, gold24K: 6820, gold18K: 5120, silver: 74, lastUpdated: new Date() });
    } finally {
      setLoadingRates(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await axios.get(`${API_URL}/orders/my`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const renderBanner = ({ item }) => (
    <View style={styles.bannerSlide}>
      <Image source={{ uri: item.image }} style={styles.bannerImage} />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
            <View>
              <Text style={styles.title}>Brahmani</Text>
              <Text style={styles.subtitle}>JEWELLERS</Text>
            </View>
          </View>
          <Text style={styles.headerTagline}>ELEGANCE THAT DEFINES YOU</Text>
        </View>

        {/* Carousel / Banner Slider */}
        <FlatList
          data={HERO_SLIDES}
          renderItem={renderBanner}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
        />

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryCard} 
                onPress={() => router.push('/collections')}
              >
                <View style={styles.categoryIconBg}>
                  <FontAwesome name={cat.icon} size={22} color="#3D2B1F" />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Live Market Rates Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={20} color="#EBA938" />
            <Text style={styles.cardTitle}>Live Market Rates</Text>
          </View>
          
          {loadingRates ? (
            <ActivityIndicator size="small" color="#EBA938" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.ratesGrid}>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Gold 24K (10g)</Text>
                <Text style={styles.rateValue}>₹{(rates?.gold24K || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Gold 22K (10g)</Text>
                <Text style={styles.rateValue}>₹{(rates?.gold22K || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Gold 18K (10g)</Text>
                <Text style={styles.rateValue}>₹{(rates?.gold18K || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>Silver (1kg)</Text>
                <Text style={styles.rateValue}>₹{(rates?.silver90 || rates?.silver || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          )}
          <Text style={styles.rateFooter}>* Prices are subject to market fluctuations.</Text>
        </View>

        {/* User Account & Dashboard */}
        {user ? (
          <View style={styles.dashboardCard}>
            <View style={styles.dashboardHeader}>
              <Ionicons name="person" size={20} color="#EBA938" />
              <Text style={styles.dashboardTitle}>My Dashboard</Text>
            </View>

            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user.name}</Text>
              <View style={styles.profileInfoRow}>
                <Ionicons name="mail-outline" size={14} color="rgba(61, 43, 31, 0.6)" />
                <Text style={styles.profileInfoText}>{user.email}</Text>
              </View>
              {user.mobile && (
                <View style={styles.profileInfoRow}>
                  <Ionicons name="call-outline" size={14} color="rgba(61, 43, 31, 0.6)" />
                  <Text style={styles.profileInfoText}>{user.mobile}</Text>
                </View>
              )}
            </View>

            <View style={styles.orderSection}>
              <Text style={styles.orderSectionTitle}>Order History</Text>
              {loadingOrders ? (
                <ActivityIndicator size="small" color="#EBA938" style={{ marginVertical: 10 }} />
              ) : orders.length === 0 ? (
                <Text style={styles.noOrdersText}>You haven't placed any orders yet.</Text>
              ) : (
                orders.map((order) => (
                  <View key={order._id} style={styles.orderBox}>
                    <View style={styles.orderHeaderRow}>
                      <Text style={styles.orderId} numberOfLines={1}>ID: {order._id.substring(12)}</Text>
                      <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <View style={styles.orderFooterRow}>
                      <Text style={styles.orderStatus}>{order.status}</Text>
                      <Text style={styles.orderTotal}>Total: ₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutButtonText}>LOGOUT</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginBanner}>
            <FontAwesome name="lock" size={40} color="#EBA938" />
            <Text style={styles.loginBannerTitle}>Unlock Premium Experience</Text>
            <Text style={styles.loginBannerDesc}>Sign in to save products, view exclusive collection details, and track your orders.</Text>
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/login')}>
              <Text style={styles.loginButtonText}>LOGIN TO ACCOUNT</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF6E6',
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 36,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3D2B1F',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#EBA938',
    letterSpacing: 4,
    marginTop: 2,
    fontWeight: 'bold',
  },
  headerTagline: {
    fontSize: 10,
    color: 'rgba(61, 43, 31, 0.5)',
    letterSpacing: 3,
    marginTop: 8,
    fontWeight: '600',
  },
  carousel: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerSlide: {
    width: 380,
    height: 180,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(61, 43, 31, 0.6)',
    padding: 16,
  },
  bannerTitle: {
    color: '#FFF6E6',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Playfair Display',
  },
  bannerSubtitle: {
    color: '#EBA938',
    fontSize: 12,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    alignItems: 'center',
    width: '22%',
  },
  categoryIconBg: {
    backgroundColor: '#FCF0DA',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.3)',
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3D2B1F',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FCF0DA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
    shadowColor: '#3D2B1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
    letterSpacing: 0.5,
  },
  ratesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  rateBox: {
    width: '48%',
    backgroundColor: '#FFF6E6',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#EBA938',
  },
  rateLabel: {
    fontSize: 12,
    color: 'rgba(61, 43, 31, 0.6)',
    marginBottom: 4,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  rateFooter: {
    fontSize: 10,
    color: 'rgba(61, 43, 31, 0.4)',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  dashboardCard: {
    backgroundColor: '#FCF0DA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 31, 0.1)',
    paddingBottom: 12,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  profileDetails: {
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 6,
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  profileInfoText: {
    fontSize: 14,
    color: 'rgba(61, 43, 31, 0.7)',
  },
  orderSection: {
    marginBottom: 20,
  },
  orderSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61, 43, 31, 0.1)',
    paddingTop: 16,
  },
  noOrdersText: {
    fontSize: 14,
    color: 'rgba(61, 43, 31, 0.5)',
    fontStyle: 'italic',
  },
  orderBox: {
    backgroundColor: '#FFF6E6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.15)',
  },
  orderHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  orderDate: {
    fontSize: 12,
    color: 'rgba(61, 43, 31, 0.5)',
  },
  orderFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderStatus: {
    fontSize: 11,
    color: '#EBA938',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    fontSize: 13,
  },
  loginBanner: {
    backgroundColor: '#FCF0DA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
  },
  loginBannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginTop: 12,
    marginBottom: 6,
  },
  loginBannerDesc: {
    fontSize: 13,
    color: 'rgba(61, 43, 31, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#3D2B1F',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFF6E6',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1.5,
  }
});
