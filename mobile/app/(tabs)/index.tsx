import { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, Image, FlatList, Modal, Pressable, Alert, Linking, TextInput, Animated, Platform, RefreshControl, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

// Subtle spring animation wrapper on press
function AnimatedCategoryCard({ children, onPress, style }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const handlePressIn = () => { scale.value = withSpring(0.92, { damping: 10 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 10 }); };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Reanimated.View style={[animatedStyle, { alignItems: 'center', width: '100%' }]}>
        {children}
      </Reanimated.View>
    </TouchableOpacity>
  );
}

// Subtle glow pulse animation wrapper
function AnimatedLiveRatesCard({ children, style }) {
  const opacity = useSharedValue(0.92);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500 }),
        withTiming(0.92, { duration: 2500 })
      ),
      -1,
      true
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={[style, animatedStyle]}>
      {children}
    </Reanimated.View>
  );
}

const HERO_SLIDES = [
  {
    id: '1',
    image: require('../../assets/images/banner1.png'),
    title: 'Timeless Elegance',
    subtitle: 'Crafted for You',
  },
  {
    id: '2',
    image: require('../../assets/images/banner2.png'),
    title: 'Brilliance That Defines You',
    subtitle: 'Shine with Our Finest Diamond Jewellery',
  },
  {
    id: '3',
    image: require('../../assets/images/banner3.png'),
    title: 'Grace in Every Sparkle',
    subtitle: 'Elegant Pendants for Every Occasion',
  },
  {
    id: '4',
    image: require('../../assets/images/banner4.png'),
    title: 'Tradition Meets Modern Beauty',
    subtitle: 'Exquisite Gold Bangles for Every Moment',
  },
  {
    id: '5',
    image: require('../../assets/images/banner5.png'),
    title: 'Designed to Dazzle',
    subtitle: 'Premium Quality Jewellery for a Lifetime',
  },
];

const CATEGORIES = [
  { id: '1', name: 'Gold', icon: 'diamond', iconType: 'FontAwesome', searchValue: 'gold' },
  { id: '2', name: 'Silver', icon: 'star', iconType: 'FontAwesome', searchValue: 'silver' },
  { id: '3', name: 'Best Sellers', icon: 'star-circle', iconType: 'MaterialCommunityIcons', searchValue: 'best-seller' },
  { id: '4', name: 'Offers', icon: 'percent', iconType: 'MaterialCommunityIcons', searchValue: 'offers' },
  { id: '5', name: 'Gift Items', icon: 'gift', iconType: 'FontAwesome', searchValue: 'gift' },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [rates, setRates] = useState({ gold22K: 66000, gold24K: 72000, gold18K: 54000, silver: 85000, lastUpdated: new Date() });
  const [orders, setOrders] = useState([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Drawer & Modals State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null); 
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showReturnPolicy, setShowReturnPolicy] = useState(false);

  const { user, logout, cartCount, refreshCartCount } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [heroSlides, setHeroSlides] = useState<any[]>(HERO_SLIDES);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [allGalleryItems, setAllGalleryItems] = useState<any[]>([]);

  const fetchGalleryItems = async () => {
    try {
      const res = await axios.get(`${API_URL}/gallery`);
      if (res.data) setAllGalleryItems(res.data);
    } catch (err) {
      console.log('Error fetching gallery for home search:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRates(),
      fetchOffers(),
      fetchGalleryItems(),
      user && user.token ? fetchOrders() : Promise.resolve(),
      user && user.token ? refreshCartCount() : Promise.resolve()
    ]);
    setRefreshing(false);
  };

  const fetchOffers = async () => {
    try {
      const response = await axios.get(`${API_URL}/offers`);
      if (response.data && response.data.length > 0) {
        const mapped = response.data.map((offer: any) => ({
          id: offer._id,
          image: offer.imageUrl,
          title: offer.title,
          subtitle: offer.subtitle || '',
          link: offer.link || '',
        }));
        setHeroSlides(mapped);
      } else {
        setHeroSlides(HERO_SLIDES);
      }
    } catch (error) {
      console.log('Error fetching offers:', error);
      setHeroSlides(HERO_SLIDES);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRates();
      fetchOffers();
      fetchGalleryItems();
      if (user && user.token) {
        fetchOrders();
        refreshCartCount();
      } else {
        setOrders([]);
      }
    }, [user])
  );

  const registerForNotifications = async () => {
    try {
      if (Platform.OS === 'web') return;
      if (!Device.isDevice) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      if (token) {
        await axios.post(`${API_URL}/notifications/register`, {
          token,
          deviceType: Platform.OS,
          userId: user ? (user.id || user._id) : null
        });
      }
    } catch (e) {
      console.log('Error registering push token:', e);
    }
  };

  useEffect(() => {
    registerForNotifications();
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

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    if (hrs < 22) return 'Good Evening';
    return 'Good Night';
  };

  const initiateWhatsApp = () => {
    const message = "Hello Brahmani Jewellers! I would like to consult about a custom design.";
    const url = `https://wa.me/917621967577?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your phone.");
    });
  };

  const handleBannerPress = (item: any) => {
    if (item.link) {
      if (item.link.startsWith('http://') || item.link.startsWith('https://')) {
        Linking.openURL(item.link).catch(() => {});
      } else {
        router.push({ pathname: '/collections', params: { search: item.link.toLowerCase() } });
      }
    }
  };

  const renderBanner = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => handleBannerPress(item)} 
      style={styles.bannerSlide}
    >
      <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.bannerImage} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D4AF37']} tintColor="#D4AF37" />
          }
        >
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={styles.menuBtn}>
                <FontAwesome name="navicon" size={26} color="#D4AF37" />
              </TouchableOpacity>
              
              <View style={styles.greetingContainer}>
                {user ? (
                  <>
                    <Text style={styles.greetingText}>{getGreeting()},</Text>
                    <Text style={styles.userNameText}>{user.name}</Text>
                  </>
                ) : (
                  <Text style={styles.welcomeText}>Welcome to Brahmani Jewellers</Text>
                )}
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={initiateWhatsApp} style={styles.whatsappIconBtn}>
                <FontAwesome name="whatsapp" size={28} color="#25D366" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNotifications(true)} style={styles.headerIconBtn}>
                <Ionicons name="notifications-outline" size={28} color="#D4AF37" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/cart')} style={styles.cartIconBtn}>
                <Ionicons name="cart-outline" size={28} color="#D4AF37" />
                {cartCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color="#D4AF37" style={styles.searchIcon} />
          <TextInput
            placeholder="Search gold rings, silver chains..."
            placeholderTextColor="rgba(61, 43, 31, 0.4)"
            style={styles.searchInput}
            value={homeSearchQuery}
            onChangeText={setHomeSearchQuery}
          />
          {homeSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setHomeSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={20} color="#6B1124" />
            </TouchableOpacity>
          )}
        </View>

        {/* Live In-Place Search Results View */}
        {homeSearchQuery.trim().length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.sectionTitle}>
                Search Results ({allGalleryItems.filter(item => 
                  (item.name && item.name.toLowerCase().includes(homeSearchQuery.toLowerCase())) ||
                  (item.category && item.category.toLowerCase().includes(homeSearchQuery.toLowerCase())) ||
                  (item.subCategory && item.subCategory.toLowerCase().includes(homeSearchQuery.toLowerCase())) ||
                  (item.description && item.description.toLowerCase().includes(homeSearchQuery.toLowerCase()))
                ).length})
              </Text>
              <TouchableOpacity onPress={() => setHomeSearchQuery('')}>
                <Text style={{ color: '#6B1124', fontWeight: 'bold', fontSize: 13 }}>Clear (X)</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const matched = allGalleryItems.filter(item => 
                (item.name && item.name.toLowerCase().includes(homeSearchQuery.toLowerCase())) ||
                (item.category && item.category.toLowerCase().includes(homeSearchQuery.toLowerCase())) ||
                (item.subCategory && item.subCategory.toLowerCase().includes(homeSearchQuery.toLowerCase())) ||
                (item.description && item.description.toLowerCase().includes(homeSearchQuery.toLowerCase()))
              );

              if (matched.length === 0) {
                return (
                  <View style={{ padding: 30, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(61,43,31,0.6)', fontSize: 14 }}>No jewellery items found matching "{homeSearchQuery}".</Text>
                  </View>
                );
              }

              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {matched.map(item => (
                    <TouchableOpacity
                      key={item._id}
                      style={{ width: '48%', backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' }}
                      onPress={() => router.push({ pathname: '/product-details', params: { product: JSON.stringify(item) } })}
                    >
                      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 130, borderRadius: 8 }} resizeMode="cover" />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#6B1124', marginTop: 6 }} numberOfLines={1}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(61,43,31,0.6)', marginTop: 2 }}>{item.purity || '22K'} • {item.weight ? `${item.weight}g` : item.subCategory}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })()}
          </View>
        ) : (
          <>
            {/* Carousel / Banner Slider */}
            <FlatList
              data={heroSlides}
              renderItem={renderBanner}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              snapToInterval={SCREEN_WIDTH - 32}
              decelerationRate="fast"
              snapToAlignment="center"
              showsHorizontalScrollIndicator={false}
              style={styles.carousel}
            />

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoriesRow}>
            {CATEGORIES.map((cat) => (
              <AnimatedCategoryCard 
                key={cat.id} 
                style={styles.categoryCard} 
                onPress={() => router.push({ pathname: '/collections', params: { search: cat.searchValue } })}
              >
                <View style={styles.categoryIconBg}>
                  {cat.iconType === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons name={cat.icon as any} size={22} color="#D4AF37" />
                  ) : (
                    <FontAwesome name={cat.icon} size={22} color="#D4AF37" />
                  )}
                </View>
                <Text style={styles.categoryName} numberOfLines={1} adjustsFontSizeToFit>{cat.name}</Text>
              </AnimatedCategoryCard>
            ))}
          </View>
        </View>

        {/* Premium Quick Services */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Premium Services</Text>
          <View style={styles.quickActionsRow}>
            <AnimatedCategoryCard
              style={styles.quickActionCard}
              onPress={() => router.push('/invest')}
            >
              <View style={styles.quickActionIconBg}>
                <Ionicons name="trending-up" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.quickActionName}>Invest</Text>
              <Text style={styles.quickActionDesc}>Gold & Silver</Text>
            </AnimatedCategoryCard>

            <AnimatedCategoryCard
              style={styles.quickActionCard}
              onPress={() => router.push('/coins')}
            >
              <View style={styles.quickActionIconBg}>
                <MaterialCommunityIcons name="database" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.quickActionName}>Coins</Text>
              <Text style={styles.quickActionDesc}>Store & GST</Text>
            </AnimatedCategoryCard>

            <AnimatedCategoryCard
              style={styles.quickActionCard}
              onPress={() => router.push('/orders')}
            >
              <View style={styles.quickActionIconBg}>
                <Ionicons name="receipt-outline" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.quickActionName}>Orders</Text>
              <Text style={styles.quickActionDesc}>Track & Code</Text>
            </AnimatedCategoryCard>
          </View>
        </View>

        {/* Live Market Rates Card */}
        <AnimatedLiveRatesCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="trending-up" size={20} color="#D4AF37" />
            <Text style={styles.cardTitle}>Live Market Rates</Text>
          </View>
          
          {loadingRates ? (
            <ActivityIndicator size="small" color="#D4AF37" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.ratesGrid}>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>GOLD (24K) / 10gm</Text>
                <Text style={styles.rateValue}>₹{(rates?.gold24K || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>GOLD (22K) / 10gm</Text>
                <Text style={styles.rateValue}>₹{(rates?.gold22K || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>GOLD (18K) / 10gm</Text>
                <Text style={styles.rateValue}>₹{(rates?.gold18K || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.rateBox}>
                <Text style={styles.rateLabel}>SILVER (999) / 1kg</Text>
                <Text style={styles.rateValue}>₹{(rates?.silver90 || rates?.silver || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          )}
          <Text style={styles.rateFooter}>* Prices are subject to market fluctuations.</Text>
        </AnimatedLiveRatesCard>

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
        </>
        )}
      </ScrollView>

      {/* Slide-out Sidebar Drawer Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDrawerOpen}
        onRequestClose={() => setIsDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Drawer Content */}
          <View style={styles.drawerContent}>
            <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
              <View style={[styles.drawerHeader, { paddingTop: Math.max(insets.top, 16) }]}>
                {/* Absolute close button */}
                <TouchableOpacity 
                  onPress={() => setIsDrawerOpen(false)} 
                  style={styles.closeBtnAbsolute}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="#D4AF37" />
                </TouchableOpacity>

                {/* Centered Brand Column */}
                <View style={styles.drawerCenteredBrand}>
                  <Image 
                    source={require('../../assets/images/logo.png')} 
                    style={styles.drawerCenteredLogo} 
                  />
                  <Text style={styles.drawerBrandNameCentered}>BRAHMANI</Text>
                  <Text style={styles.drawerBrandSubCentered}>JEWELLERS</Text>
                  <View style={styles.sinceDividerRow}>
                    <View style={styles.sinceLine} />
                    <Text style={styles.sinceText}>SINCE 1991</Text>
                    <View style={styles.sinceLine} />
                  </View>
                </View>
              </View>

              <ScrollView 
                style={styles.drawerScroll} 
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 50 }}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Home */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                  }}
                >
                  <Ionicons name="home-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Home</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 2. Categories */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push('/collections');
                  }}
                >
                  <Ionicons name="grid-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Categories</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 3. Gold Rate */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push('/invest');
                  }}
                >
                  <Ionicons name="trending-up-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Gold Rate</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 4. New Arrivals */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push({ pathname: '/collections', params: { search: 'featured' } });
                  }}
                >
                  <Ionicons name="diamond-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>New Arrivals</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 5. Offers */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push({ pathname: '/collections', params: { search: 'offers' } });
                  }}
                >
                  <Ionicons name="pricetag-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Offers</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 6. Best Sellers */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push({ pathname: '/collections', params: { search: 'best-seller' } });
                  }}
                >
                  <Ionicons name="star-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Best Sellers</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 7. My Orders */}
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
                  <Ionicons name="receipt-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>My Orders</Text>
                  <Ionicons name={activeSection === 'orders' ? "chevron-up" : "chevron-down"} size={16} color="#D4AF37" />
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

                {/* 8. About Us */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    router.push('/profile');
                  }}
                >
                  <Ionicons name="logo-instagram" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>About Us</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 9. Contact Us */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    initiateWhatsApp();
                  }}
                >
                  <Ionicons name="call-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Contact Us</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 10. Terms & Conditions */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    setShowTerms(true);
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Terms & Conditions</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 11. Privacy Policy */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    setShowPrivacy(true);
                  }}
                >
                  <Ionicons name="shield-checkmark-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Privacy Policy</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 12. Return Policy */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setIsDrawerOpen(false);
                    setShowReturnPolicy(true);
                  }}
                >
                  <Ionicons name="arrow-undo-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Return Policy</Text>
                  <Ionicons name="chevron-forward" size={16} color="#D4AF37" />
                </TouchableOpacity>

                {/* 13. Settings (Expands to Profile, Notification, Bank Details, Logout/Login) */}
                <TouchableOpacity 
                  style={styles.sidebarLink} 
                  onPress={() => {
                    setActiveSection(activeSection === 'settings' ? null : 'settings');
                  }}
                >
                  <Ionicons name="settings-outline" size={20} color="#D4AF37" style={styles.sidebarIcon} />
                  <Text style={styles.sidebarLinkText}>Settings</Text>
                  <Ionicons name={activeSection === 'settings' ? "chevron-up" : "chevron-down"} size={16} color="#D4AF37" />
                </TouchableOpacity>

                {activeSection === 'settings' && (
                  <View style={styles.expandedSection}>
                    {/* Profile Link */}
                    <TouchableOpacity 
                      style={styles.subLinkItem}
                      onPress={() => {
                        if (!user) {
                          Alert.alert("Login Required", "Please login to view your profile details.");
                          setIsDrawerOpen(false);
                          router.push('/login');
                        } else {
                          setActiveSection('profile_detail');
                        }
                      }}
                    >
                      <Ionicons name="person-circle-outline" size={18} color="#D4AF37" />
                      <Text style={styles.subLinkLabel}>My Profile</Text>
                    </TouchableOpacity>

                    {activeSection === 'profile_detail' && user && (
                      <View style={styles.profileEmbed}>
                        <Text style={styles.profileDetailLabel}>Name: {user.name}</Text>
                        <Text style={styles.profileDetailLabel}>Email: {user.email}</Text>
                        {user.mobile && <Text style={styles.profileDetailLabel}>Mobile: {user.mobile}</Text>}
                      </View>
                    )}

                    {/* Notifications Link */}
                    <TouchableOpacity 
                      style={styles.subLinkItem}
                      onPress={() => {
                        setIsDrawerOpen(false);
                        setShowNotifications(true);
                      }}
                    >
                      <Ionicons name="notifications-outline" size={18} color="#D4AF37" />
                      <Text style={styles.subLinkLabel}>Notifications</Text>
                    </TouchableOpacity>

                    {/* Bank Details Link */}
                    <TouchableOpacity 
                      style={styles.subLinkItem}
                      onPress={() => {
                        setIsDrawerOpen(false);
                        setShowBankDetails(true);
                      }}
                    >
                      <MaterialCommunityIcons name="bank-outline" size={18} color="#D4AF37" />
                      <Text style={styles.subLinkLabel}>Bank Details</Text>
                    </TouchableOpacity>

                    {/* Login/Logout Button */}
                    {user ? (
                      <TouchableOpacity 
                        style={styles.subLinkItem}
                        onPress={() => {
                          logout();
                          setIsDrawerOpen(false);
                          Alert.alert("Logged Out", "You have been logged out successfully.");
                        }}
                      >
                        <Ionicons name="log-out-outline" size={18} color="#FF6B6B" />
                        <Text style={[styles.subLinkLabel, { color: '#FF6B6B' }]}>Logout</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={styles.subLinkItem}
                        onPress={() => {
                          setIsDrawerOpen(false);
                          router.push('/login');
                        }}
                      >
                        <Ionicons name="log-in-outline" size={18} color="#2ecc71" />
                        <Text style={[styles.subLinkLabel, { color: '#2ecc71' }]}>Login</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Follow Us Section */}
                <View style={styles.followUsContainer}>
                  <Text style={styles.followUsText}>Follow Us</Text>
                  <View style={styles.socialRow}>
                    <TouchableOpacity style={styles.socialCircle} onPress={() => Linking.openURL('https://instagram.com/brahmanijewellers_')}>
                      <Ionicons name="logo-instagram" size={20} color="#D4AF37" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircle} onPress={() => Linking.openURL('https://facebook.com')}>
                      <Ionicons name="logo-facebook" size={20} color="#D4AF37" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.socialCircle} onPress={() => Linking.openURL('https://wa.me/917621967577')}>
                      <Ionicons name="logo-whatsapp" size={20} color="#D4AF37" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
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
              <Text style={styles.bankValue}>{rates?.bankName || 'HDFC Bank'}</Text>
              <Text style={styles.bankLabel}>Account Name:</Text>
              <Text style={styles.bankValue}>{rates?.bankAccountName || 'Brahmani Jewellers'}</Text>
              <Text style={styles.bankLabel}>Account Number:</Text>
              <Text style={styles.bankValue}>{rates?.bankAccountNumber || '50200081273891'}</Text>
              <Text style={styles.bankLabel}>IFSC Code:</Text>
              <Text style={styles.bankValue}>{rates?.bankIfsc || 'HDFC0001203'}</Text>
              <Text style={styles.bankLabel}>Branch:</Text>
              <Text style={styles.bankValue}>{rates?.bankBranch || 'Amraiwadi, Ahmedabad'}</Text>
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
            <ScrollView style={{ maxHeight: 320, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                <Text style={{ fontWeight: 'bold' }}>1. Acceptance of Terms</Text>
                {"\n"}
                By accessing and using this app, you agree to be bound by these Terms & Conditions. Please read them carefully before making any purchases.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Pricing & Live Gold/Silver Rates</Text>
                {"\n"}
                Gold and silver rates fluctuate daily according to the bullion market. The pricing for products on our site/app is dynamically calculated based on current live rates. The price presented at checkout when you place your order is final and binding. Even if gold/silver market rates change afterwards, the price of your placed order remains unchanged.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. Product Details & Weight Variance</Text>
                {"\n"}
                All our jewellery pieces are handcrafted. Because they are handmade, the final weight of the delivered jewellery may vary by approximately +/- 5% compared to the estimated weight listed online. The final bill will be adjusted and calculated according to the actual weight of the shipped product.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>4. Order Validation & Cancellation</Text>
                {"\n"}
                Brahmani Jewellers reserves the right to cancel any orders under exceptional circumstances (e.g. wrong price displays, lack of raw materials, or verification issues). If we cancel an order, we will issue a full refund to the customer.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>5. Contact Information</Text>
                {"\n"}
                Email: info.brahmanijewellers@gmail.com
                {"\n"}
                Phone: +91 7621967577
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
            <ScrollView style={{ maxHeight: 320, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                <Text style={{ fontWeight: 'bold' }}>1. Introduction</Text>
                {"\n"}
                Welcome to Brahmani Jewellers. We value your trust and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Information We Collect</Text>
                {"\n"}
                A. Personal Info: Name, shipping address, billing address, email, and phone number when you create an account or order.
                {"\n"}
                B. Payments: We do NOT store your credit card, debit card, or UPI credentials on our servers. All transaction details are processed securely by Razorpay.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. How We Use Your Data</Text>
                {"\n"}
                - To process, ship, and deliver your luxury jewellery orders.
                {"\n"}
                - To send order confirmations, tracking information, and customer support updates.
                {"\n"}
                - To share daily live rate updates.
                {"\n"}
                - To prevent fraud and maintain security.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>4. Data Sharing & Third Parties</Text>
                {"\n"}
                We never sell or rent your personal data. We only share details with courier services to ship packages and payment gateways to process payments.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>5. Contact Us</Text>
                {"\n"}
                Email: info.brahmanijewellers@gmail.com
                {"\n"}
                Phone: +91 7621967577
                {"\n"}
                Address: Near Amraiwadi Metro, Ahmedabad, Gujarat, India
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacy(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* RETURN POLICY MODAL */}
      <Modal visible={showReturnPolicy} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Return Policy</Text>
            <ScrollView style={{ maxHeight: 320, marginVertical: 10 }}>
              <Text style={styles.legalBodyText}>
                <Text style={{ fontWeight: 'bold', color: '#B22222' }}>1. No Return & No Exchange Policy</Text>
                {"\n"}
                Since all our luxury jewellery articles are custom handcrafted and made to order, we do not accept any returns, exchanges, or cancellations once a purchase is successfully made. All sales are strictly final.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Store Policy Details</Text>
                {"\n"}
                - Once an item is bought, it cannot be returned or refunded.
                {"\n"}
                - We request customers to verify sizing and specifications before checking out.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. More Information</Text>
                {"\n"}
                For buyback terms, gold exchanges, or physical verification:
                {"\n\n"}
                <Text style={{ fontWeight: 'bold', color: '#D4AF37' }}>
                  Please visit our physical store location or contact support.
                </Text>
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowReturnPolicy(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      </Animated.View>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Clean pearl white background
  },
  scrollContainer: {
    padding: 16,
    paddingTop: 36,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuBtn: {
    padding: 8,
    marginRight: 10,
  },
  greetingContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: '#D4AF37', // Royal Gold
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B1124', // Regal Maroon
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B1124', // Regal Maroon
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B1124',
    marginTop: 1,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  whatsappIconBtn: {
    padding: 8,
  },
  headerIconBtn: {
    padding: 8,
  },
  cartIconBtn: {
    padding: 8,
    position: 'relative',
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
    color: '#6B1124',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#D4AF37',
    letterSpacing: 4,
    marginTop: 1,
    fontWeight: 'bold',
  },
  headerTagline: {
    fontSize: 9,
    color: 'rgba(107, 17, 36, 0.5)',
    letterSpacing: 3,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 46,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(107, 17, 36, 0.2)', // Maroon tint border
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#6B1124',
    fontWeight: '500',
  },
  carousel: {
    width: SCREEN_WIDTH - 32,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerSlide: {
    width: SCREEN_WIDTH - 32,
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
    backgroundColor: 'rgba(74, 14, 23, 0.82)', // Deep Maroon overlay
    padding: 14,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#D4AF37',
    fontSize: 11,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B1124', // Regal Maroon
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryCard: {
    alignItems: 'center',
    width: '18%',
  },
  categoryIconBg: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.4)', // Royal Gold accent border
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B1124',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(107, 17, 36, 0.15)', // Soft Maroon border
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
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
    color: '#6B1124',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  ratesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  rateBox: {
    width: '48%',
    backgroundColor: '#FFFDFB',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    borderLeftWidth: 3.5,
    borderLeftColor: '#6B1124', // Regal Maroon left border
  },
  rateLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6B1124',
  },
  rateFooter: {
    fontSize: 9,
    color: 'rgba(107, 17, 36, 0.5)',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  consultBanner: {
    backgroundColor: '#6B1124', // Regal Maroon
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  consultTextContainer: {
    flex: 1,
  },
  consultTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  consultDesc: {
    color: '#D4AF37',
    fontSize: 11,
    marginTop: 2,
  },

  // Drawer modal styles
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    width: 0,
    height: 0,
  },
  drawerContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnAbsolute: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    right: 20,
    zIndex: 10,
    padding: 6,
  },
  drawerCenteredBrand: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  drawerCenteredLogo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  drawerBrandNameCentered: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 2,
    textAlign: 'center',
  },
  drawerBrandSubCentered: {
    fontSize: 12,
    color: '#D4AF37',
    letterSpacing: 4,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  sinceDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  sinceLine: {
    width: 40,
    height: 1,
    backgroundColor: '#D4AF37',
    opacity: 0.5,
  },
  sinceText: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600',
    letterSpacing: 1.5,
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
    borderBottomColor: '#F2F2F7',
  },
  sidebarLinkText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#1C1C1E',
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  profileDetailLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(28, 28, 30, 0.5)',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  profileDetailValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 6,
  },
  noOrdersTextMobile: {
    fontSize: 12,
    color: 'rgba(28, 28, 30, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  orderHistoryItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 8,
  },
  orderHistoryId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  orderHistoryStatus: {
    fontSize: 11,
    color: '#D4AF37',
    fontWeight: 'bold',
    marginTop: 2,
  },
  orderHistoryTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'right',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
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
    color: '#D4AF37',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  sidebarIcon: {
    marginRight: 4,
  },
  subLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  subLinkLabel: {
    fontSize: 13,
    color: '#D4AF37',
    fontWeight: '600',
  },
  profileEmbed: {
    paddingVertical: 8,
    paddingLeft: 12,
  },
  followUsContainer: {
    marginTop: 24,
    alignItems: 'center',
    paddingBottom: 24,
  },
  followUsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  // Modal styling
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBody: {
    backgroundColor: '#FFFFFF',
    width: '90%',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 10,
    marginBottom: 14,
    textAlign: 'center',
  },
  bankDetailContainer: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bankLabel: {
    fontSize: 11,
    color: 'rgba(28, 28, 30, 0.5)',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  bankValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalCloseBtn: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
  },
  notiBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  notiText: {
    fontSize: 13,
    color: '#1C1C1E',
    flex: 1,
    lineHeight: 18,
  },
  legalBodyText: {
    fontSize: 13,
    color: '#1C1C1E',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionIconBg: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    marginBottom: 6,
  },
  quickActionName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 9,
    color: 'rgba(28, 28, 30, 0.5)',
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '500',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
