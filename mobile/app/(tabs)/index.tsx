import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Image, FlatList, Modal, Pressable } from 'react-native';
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.menuBtn}>
              <FontAwesome name="navicon" size={26} color="#3D2B1F" />
            </TouchableOpacity>
            
            <View style={styles.brandRow}>
              <Image source={require('../../assets/images/logo.png')} style={styles.logo} />
              <View>
                <Text style={styles.title}>Brahmani</Text>
                <Text style={styles.subtitle}>JEWELLERS</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartIconBtn}>
              <Ionicons name="cart-outline" size={28} color="#3D2B1F" />
            </TouchableOpacity>
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

        {/* Welcome Text */}
        {user && (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeText}>Namaste, {user.name}! 🙏</Text>
            <Text style={styles.welcomeSub}>Tap the menu icon (☰) to view your profile and orders.</Text>
          </View>
        )}

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

        {/* WhatsApp Custom Consult Section */}
        <TouchableOpacity 
          style={styles.consultBanner}
          onPress={() => Alert.alert("WhatsApp Chat", "Opening WhatsApp for design consultation...")}
        >
          <FontAwesome name="whatsapp" size={24} color="#FFF6E6" />
          <View style={styles.consultTextContainer}>
            <Text style={styles.consultTitle}>Bespoke Jewellery Design</Text>
            <Text style={styles.consultDesc}>Message us for custom design consultations.</Text>
          </View>
          <FontAwesome name="chevron-right" size={14} color="#FFF6E6" />
        </TouchableOpacity>
      </ScrollView>

      {/* Slide-out Sidebar Drawer Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isDrawerOpen}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Backdrop click to close */}
          <Pressable style={styles.drawerBackdrop} onPress={() => setIsDrawerOpen(false)} />
          
          {/* Drawer Content */}
          <View style={styles.drawerContent}>
            <SafeAreaView style={styles.drawerSafeArea}>
              <View style={styles.drawerHeader}>
                <View style={styles.drawerBrandRow}>
                  <Image source={require('../../assets/images/logo.png')} style={styles.drawerLogo} />
                  <View>
                    <Text style={styles.drawerBrandName}>Brahmani</Text>
                    <Text style={styles.drawerBrandSub}>JEWELLERS</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsDrawerOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={28} color="#3D2B1F" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
                {user ? (
                  <View style={styles.dashboardContainer}>
                    <View style={styles.profileSection}>
                      <Text style={styles.profileHeading}>My Profile</Text>
                      <Text style={styles.drawerProfileName}>{user.name}</Text>
                      <View style={styles.profileRow}>
                        <Ionicons name="mail" size={16} color="#EBA938" />
                        <Text style={styles.profileText}>{user.email}</Text>
                      </View>
                      {user.mobile && (
                        <View style={styles.profileRow}>
                          <Ionicons name="call" size={16} color="#EBA938" />
                          <Text style={styles.profileText}>{user.mobile}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.ordersSection}>
                      <Text style={styles.ordersHeading}>My Orders</Text>
                      {loadingOrders ? (
                        <ActivityIndicator size="small" color="#EBA938" style={{ marginVertical: 10 }} />
                      ) : orders.length === 0 ? (
                        <Text style={styles.noOrders}>No orders placed yet.</Text>
                      ) : (
                        orders.map((order) => (
                          <View key={order._id} style={styles.drawerOrderBox}>
                            <View style={styles.orderBoxTop}>
                              <Text style={styles.orderBoxId}>Order: {order._id.substring(16).toUpperCase()}</Text>
                              <Text style={styles.orderBoxDate}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</Text>
                            </View>
                            <View style={styles.orderBoxBottom}>
                              <Text style={[styles.orderBoxStatus, { color: order.status === 'Delivered' ? '#2ecc71' : '#EBA938' }]}>{order.status}</Text>
                              <Text style={styles.orderBoxTotal}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>

                    <TouchableOpacity 
                      style={styles.drawerLogoutBtn} 
                      onPress={() => {
                        logout();
                        setIsDrawerOpen(false);
                      }}
                    >
                      <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
                      <Text style={styles.drawerLogoutBtnText}>LOGOUT</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.drawerLoginPrompt}>
                    <FontAwesome name="lock" size={50} color="#EBA938" style={{ marginBottom: 12 }} />
                    <Text style={styles.promptTitle}>Guest Account</Text>
                    <Text style={styles.promptDesc}>Login to save items, track orders, and experience personalized support.</Text>
                    <TouchableOpacity 
                      style={styles.drawerLoginBtn} 
                      onPress={() => {
                        setIsDrawerOpen(false);
                        router.push('/login');
                      }}
                    >
                      <Text style={styles.drawerLoginBtnText}>LOGIN NOW</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* About Quick Links */}
                <View style={styles.drawerDivider} />
                <View style={styles.quickLinksContainer}>
                  <TouchableOpacity style={styles.linkRow} onPress={() => { setIsDrawerOpen(false); router.push('/about'); }}>
                    <Ionicons name="information-circle-outline" size={20} color="#3D2B1F" />
                    <Text style={styles.linkText}>About Brahmani</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.linkRow} onPress={() => { setIsDrawerOpen(false); router.push('/collections'); }}>
                    <Ionicons name="diamond-outline" size={20} color="#3D2B1F" />
                    <Text style={styles.linkText}>Collection Designs</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: {
    padding: 8,
  },
  cartIconBtn: {
    padding: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3D2B1F',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#EBA938',
    letterSpacing: 4,
    marginTop: 1,
    fontWeight: 'bold',
  },
  headerTagline: {
    fontSize: 9,
    color: 'rgba(61, 43, 31, 0.4)',
    letterSpacing: 3,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  carousel: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
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
    backgroundColor: 'rgba(61, 43, 31, 0.65)',
    padding: 14,
  },
  bannerTitle: {
    color: '#FFF6E6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#EBA938',
    fontSize: 11,
    marginTop: 2,
  },
  welcomeBox: {
    backgroundColor: '#FCF0DA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  welcomeSub: {
    fontSize: 12,
    color: 'rgba(61, 43, 31, 0.6)',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 12,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.25)',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3D2B1F',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FCF0DA',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  ratesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  rateBox: {
    width: '48%',
    backgroundColor: '#FFF6E6',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EBA938',
  },
  rateLabel: {
    fontSize: 11,
    color: 'rgba(61, 43, 31, 0.5)',
    marginBottom: 2,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  rateFooter: {
    fontSize: 9,
    color: 'rgba(61, 43, 31, 0.4)',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  consultBanner: {
    backgroundColor: '#3D2B1F',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  consultTextContainer: {
    flex: 1,
  },
  consultTitle: {
    color: '#FFF6E6',
    fontWeight: 'bold',
    fontSize: 14,
  },
  consultDesc: {
    color: '#EBA938',
    fontSize: 11,
    marginTop: 2,
  },

  // Drawer modal styles
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    width: '20%',
    height: '100%',
    backgroundColor: 'rgba(61, 43, 31, 0.5)',
  },
  drawerContent: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFF6E6',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 31, 0.1)',
    backgroundColor: '#FCF0DA',
  },
  drawerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drawerLogo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  drawerBrandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  drawerBrandSub: {
    fontSize: 8,
    color: '#EBA938',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  drawerScroll: {
    flex: 1,
    padding: 20,
  },
  dashboardContainer: {
    flex: 1,
  },
  profileSection: {
    marginBottom: 20,
  },
  profileHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EBA938',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  drawerProfileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  profileText: {
    fontSize: 13,
    color: 'rgba(61, 43, 31, 0.7)',
  },
  ordersSection: {
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(61, 43, 31, 0.1)',
    paddingTop: 16,
  },
  ordersHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EBA938',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  noOrders: {
    fontSize: 13,
    color: 'rgba(61, 43, 31, 0.5)',
    fontStyle: 'italic',
  },
  drawerOrderBox: {
    backgroundColor: '#FCF0DA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.15)',
  },
  orderBoxTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  orderBoxId: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  orderBoxDate: {
    fontSize: 11,
    color: 'rgba(61, 43, 31, 0.4)',
  },
  orderBoxBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderBoxStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  orderBoxTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  drawerLogoutBtnText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 13,
  },
  drawerLoginPrompt: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
    marginBottom: 6,
  },
  promptDesc: {
    fontSize: 12,
    color: 'rgba(61, 43, 31, 0.6)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  drawerLoginBtn: {
    backgroundColor: '#3D2B1F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  drawerLoginBtnText: {
    color: '#FFF6E6',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(61, 43, 31, 0.1)',
    marginVertical: 20,
  },
  quickLinksContainer: {
    marginBottom: 30,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 14,
    color: '#3D2B1F',
    fontWeight: '500',
  }
});
