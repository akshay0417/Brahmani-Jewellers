import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Image, FlatList, Modal, Pressable, Alert, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
  
  // Drawer & Modals State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'profile' or 'orders' or null
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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

  const initiateWhatsApp = () => {
    const message = "Hello Brahmani Jewellers! I would like to consult about a custom design.";
    const url = `https://wa.me/919925811771?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your phone.");
    });
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
            <Text style={styles.welcomeSub}>Tap the menu icon (☰) to view your profile, orders, and options.</Text>
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
          onPress={initiateWhatsApp}
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
                {/* 1. MY PROFILE */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    if (!user) {
                      Alert.alert("Login Required", "Please login to view your profile details.");
                      setIsDrawerOpen(false);
                      router.push('/login');
                    } else {
                      setActiveSection(activeSection === 'profile' ? null : 'profile');
                    }
                  }}
                >
                  <Ionicons name="person-circle-outline" size={22} color="#3D2B1F" />
                  <Text style={styles.sidebarLinkText}>My Profile</Text>
                  <Ionicons name={activeSection === 'profile' ? "chevron-up" : "chevron-down"} size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {activeSection === 'profile' && user && (
                  <View style={styles.expandedSection}>
                    <Text style={styles.profileDetailLabel}>Name:</Text>
                    <Text style={styles.profileDetailValue}>{user.name}</Text>
                    <Text style={styles.profileDetailLabel}>Email:</Text>
                    <Text style={styles.profileDetailValue}>{user.email}</Text>
                    {user.mobile && (
                      <>
                        <Text style={styles.profileDetailLabel}>Mobile:</Text>
                        <Text style={styles.profileDetailValue}>{user.mobile}</Text>
                      </>
                    )}
                  </View>
                )}

                {/* 2. SHOP NOW */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push('/collections');
                  }}
                >
                  <Ionicons name="diamond-outline" size={22} color="#3D2B1F" />
                  <Text style={styles.sidebarLinkText}>Shop Now</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {/* 3. ORDER HISTORY */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    if (!user) {
                      Alert.alert("Login Required", "Please login to view your order history.");
                      setIsDrawerOpen(false);
                      router.push('/login');
                    } else {
                      setActiveSection(activeSection === 'orders' ? null : 'orders');
                    }
                  }}
                >
                  <Ionicons name="receipt-outline" size={22} color="#3D2B1F" />
                  <Text style={styles.sidebarLinkText}>Order History</Text>
                  <Ionicons name={activeSection === 'orders' ? "chevron-up" : "chevron-down"} size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {activeSection === 'orders' && user && (
                  <View style={styles.expandedSection}>
                    {loadingOrders ? (
                      <ActivityIndicator size="small" color="#EBA938" />
                    ) : orders.length === 0 ? (
                      <Text style={styles.noOrdersTextMobile}>No orders placed yet.</Text>
                    ) : (
                      orders.map((order) => (
                        <View key={order._id} style={styles.orderHistoryItem}>
                          <Text style={styles.orderHistoryId}>ID: {order._id.substring(16).toUpperCase()}</Text>
                          <Text style={styles.orderHistoryStatus}>Status: {order.status}</Text>
                          <Text style={styles.orderHistoryTotal}>Total: ₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* 4. BANK DETAILS */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    setShowBankDetails(true);
                  }}
                >
                  <MaterialCommunityIcons name="bank-outline" size={22} color="#3D2B1F" />
                  <Text style={styles.sidebarLinkText}>Bank Details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {/* 5. NOTIFICATION */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    setShowNotifications(true);
                  }}
                >
                  <Ionicons name="notifications-outline" size={22} color="#3D2B1F" />
                  <Text style={styles.sidebarLinkText}>Notification</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {/* 6. CONTACT US */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={initiateWhatsApp}
                >
                  <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  <Text style={styles.sidebarLinkText}>Contact Us</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {/* 7. ABOUT US */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push('/about');
                  }}
                >
                  <Ionicons name="information-circle-outline" size={22} color="#3D2B1F" />
                  <Text style={styles.sidebarLinkText}>About Us</Text>
                  <Ionicons name="chevron-forward" size={16} color="#3D2B1F" />
                </TouchableOpacity>

                {/* 8. LOGOUT / LOGIN */}
                {user ? (
                  <TouchableOpacity 
                    style={[styles.sidebarLink, styles.logoutLink]} 
                    onPress={() => {
                      logout();
                      setIsDrawerOpen(false);
                      Alert.alert("Logged Out", "You have been logged out successfully.");
                    }}
                  >
                    <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                    <Text style={[styles.sidebarLinkText, { color: '#FF6B6B' }]}>Logout</Text>
                    <Ionicons name="chevron-forward" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.sidebarLink, styles.loginLink]} 
                    onPress={() => {
                      setIsDrawerOpen(false);
                      router.push('/login');
                    }}
                  >
                    <Ionicons name="log-in-outline" size={22} color="#2ecc71" />
                    <Text style={[styles.sidebarLinkText, { color: '#2ecc71' }]}>Login</Text>
                    <Ionicons name="chevron-forward" size={16} color="#2ecc71" />
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.drawerDivider} />

                {/* SHORT LEGAL LINKS */}
                <View style={styles.legalLinksRow}>
                  <TouchableOpacity onPress={() => setShowTerms(true)}>
                    <Text style={styles.legalLinkText}>Terms & Conditions</Text>
                  </TouchableOpacity>
                  <Text style={styles.legalLinkSeparator}>|</Text>
                  <TouchableOpacity onPress={() => setShowPrivacy(true)}>
                    <Text style={styles.legalLinkText}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>

      {/* BANK DETAILS MODAL */}
      <Modal visible={showBankDetails} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Official Bank Details</Text>
            <View style={styles.bankDetailContainer}>
              <Text style={styles.bankLabel}>Bank Name:</Text>
              <Text style={styles.bankValue}>HDFC Bank</Text>
              <Text style={styles.bankLabel}>Account Name:</Text>
              <Text style={styles.bankValue}>Brahmani Jewellers</Text>
              <Text style={styles.bankLabel}>Account Number:</Text>
              <Text style={styles.bankValue}>50200081273891</Text>
              <Text style={styles.bankLabel}>IFSC Code:</Text>
              <Text style={styles.bankValue}>HDFC0001203</Text>
              <Text style={styles.bankLabel}>Branch:</Text>
              <Text style={styles.bankValue}>Amraiwadi, Ahmedabad</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowBankDetails(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal visible={showNotifications} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <ScrollView style={{ maxHeight: 250, marginVertical: 10 }}>
              <View style={styles.notiBox}>
                <Ionicons name="gift-outline" size={20} color="#EBA938" />
                <Text style={styles.notiText}>Welcome to Brahmani Jewellers! Explore our royal legacy collections.</Text>
              </View>
              <View style={styles.notiBox}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#EBA938" />
                <Text style={styles.notiText}>Gold Purity Assured: All items are BIS 916 Hallmark certified.</Text>
              </View>
              <View style={styles.notiBox}>
                <Ionicons name="time-outline" size={20} color="#EBA938" />
                <Text style={styles.notiText}>Rates Updated: Live market gold & silver rates have been refreshed.</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowNotifications(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TERMS AND CONDITIONS MODAL */}
      <Modal visible={showTerms} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                1. All jewellery products purchased are subject to actual store policies.
                {"\n\n"}
                2. Live market rates listed are indicators. Final invoice rates are locked during order confirmation.
                {"\n\n"}
                3. Delivery charges are calculated based on distance from store location.
                {"\n\n"}
                4. Order verification via OTP/Signature is required upon delivery for safety.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTerms(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PRIVACY POLICY MODAL */}
      <Modal visible={showPrivacy} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                1. We collect minimal personal data (Name, Email, Mobile) required to process orders and customize app experience.
                {"\n\n"}
                2. User credentials and verification data are stored securely and never shared with third-party networks.
                {"\n\n"}
                3. Live rates and search tracking cookies are purely used for optimization.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacy(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
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
    padding: 16,
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 31, 0.08)',
  },
  sidebarLinkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#3D2B1F',
    fontWeight: '600',
  },
  logoutLink: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  loginLink: {
    borderBottomWidth: 0,
    marginTop: 10,
  },
  expandedSection: {
    backgroundColor: '#FCF0DA',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  profileDetailLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(61, 43, 31, 0.5)',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  profileDetailValue: {
    fontSize: 14,
    color: '#3D2B1F',
    fontWeight: '600',
    marginBottom: 6,
  },
  noOrdersTextMobile: {
    fontSize: 12,
    color: 'rgba(61, 43, 31, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  orderHistoryItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 31, 0.05)',
    paddingVertical: 8,
  },
  orderHistoryId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3D2B1F',
  },
  orderHistoryStatus: {
    fontSize: 11,
    color: '#EBA938',
    fontWeight: 'bold',
    marginTop: 2,
  },
  orderHistoryTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3D2B1F',
    textAlign: 'right',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(61, 43, 31, 0.1)',
    marginVertical: 20,
  },
  legalLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  legalLinkText: {
    fontSize: 11,
    color: 'rgba(61, 43, 31, 0.5)',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    fontSize: 11,
    color: 'rgba(61, 43, 31, 0.3)',
  },

  // Modal styling
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBody: {
    backgroundColor: '#FFF6E6',
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3D2B1F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(61, 43, 31, 0.1)',
    paddingBottom: 10,
    marginBottom: 14,
    textAlign: 'center',
  },
  bankDetailContainer: {
    backgroundColor: '#FCF0DA',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.2)',
  },
  bankLabel: {
    fontSize: 11,
    color: 'rgba(61, 43, 31, 0.5)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  bankValue: {
    fontSize: 14,
    color: '#3D2B1F',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalCloseBtn: {
    backgroundColor: '#3D2B1F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseBtnText: {
    color: '#FFF6E6',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  notiBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FCF0DA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(235, 169, 56, 0.1)',
  },
  notiText: {
    fontSize: 13,
    color: '#3D2B1F',
    flex: 1,
    lineHeight: 18,
  },
  legalBodyText: {
    fontSize: 13,
    color: '#3D2B1F',
    lineHeight: 20,
    paddingHorizontal: 4,
  }
});
