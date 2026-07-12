import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Linking, Modal, Share } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

// Replace with your actual backend URL for mobile testing
const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function CollectionsScreen() {
  const { user, refreshCartCount } = useAuth() as any;
  const router = useRouter();
  const params = useLocalSearchParams();
  const [items, setItems] = useState<any[]>([
    { _id: 'i1', name: 'Royal Gold Necklace', category: 'gold', subCategory: 'Necklace', weight: '22.5', purity: '22K', imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80', description: 'Exquisite royal design handcrafted gold necklace.' },
    { _id: 'i2', name: 'Classic Gold Ring', category: 'gold', subCategory: 'Ring', weight: '5.2', purity: '22K', imageUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80', description: 'Timeless classic gold ring for daily wear.' },
    { _id: 'i3', name: 'Premium Silver Payal', category: 'silver', subCategory: 'Payal', weight: '45', purity: '90', imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80', description: 'Traditional silver anklet with delicate design.' }
  ]);
  const [rates, setRates] = useState<any>({ gold22K: 66000, gold24K: 72000, gold18K: 54000, silver: 85000 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'collection'
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (params && params.search) {
      setSearchQuery(params.search as string);
    }
  }, [params]);

  const fetchData = async () => {
    try {
      const [itemsRes, ratesRes] = await Promise.all([
        axios.get(`${API_URL}/gallery`),
        axios.get(`${API_URL}/rates`).catch(() => null)
      ]);
      setItems(itemsRes.data || []);
      if (ratesRes && ratesRes.data) {
        setRates(ratesRes.data);
      } else {
        // Fallback rates
        setRates({ gold22K: 6250, gold24K: 6820, gold18K: 5120, silver: 74 });
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch gallery items");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: any) => {
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to add items to cart");
      router.push('/login');
      return;
    }

    try {
      await axios.post(`${API_URL}/cart/add`, { productId, quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success", "Item added to cart");
      refreshCartCount();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.");
        router.push('/login');
      } else {
        Alert.alert("Error", "Could not add to cart");
      }
    }
  };

  const calculatePrice = (item: any) => {
    if (item.price) return Math.round(Number(item.price) * 1.03);
    if (!rates || !item.weight || !item.purity) return 0;

    let ratePerGram = 0;
    const p = (item.purity || '').toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('92.5') || p.includes('925')) ratePerGram = ((rates.silver90 || rates.silver || 74) / 1000) * (92.5 / 90);
    else if (p.includes('90') || p.includes('SILVER')) ratePerGram = (rates.silver90 || rates.silver || 74) / 1000;

    if (!ratePerGram) return 0;

    const weight = parseFloat(item.weight);
    const basePrice = ratePerGram * weight;
    const makingPercent = item.makingCharges || 0;
    const makingAmount = basePrice * (makingPercent / 100);
    const other = item.otherCharges || 0;
    const subtotal = basePrice + makingAmount + other;
    const gst = subtotal * 0.03;
    return Math.round(subtotal + gst);
  };

  const initiateWhatsAppInquiry = (item: any) => {
    const price = calculatePrice(item);
    let message = `Hello Brahmani Jewellers! I am interested in this design from your Collection Lookbook:\n\n`;
    message += `*Name:* ${item.name || `${item.category} Ornament`}\n`;
    message += `*Category:* ${item.category}\n`;
    if (item.subCategory) message += `*Subcategory:* ${item.subCategory}\n`;
    if (item.weight) message += `*Weight:* ${item.weight}g\n`;
    if (price > 0) message += `*Estimated Price:* ₹${price.toLocaleString('en-IN')}\n`;
    message += `\nImage: ${item.imageUrl}`;

    const url = `https://wa.me/917621967577?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your phone.");
    });
  };

  const navigateToDetails = (item: any) => {
    router.push({
      pathname: '/product-details',
      params: {
        id: item._id,
        name: item.name || '',
        category: item.category || '',
        subCategory: item.subCategory || '',
        weight: item.weight ? String(item.weight) : '',
        purity: item.purity || '',
        imageUrl: item.imageUrl || '',
        description: item.description || '',
        price: item.price ? String(item.price) : '',
        makingCharges: item.makingCharges ? String(item.makingCharges) : '',
        otherCharges: item.otherCharges ? String(item.otherCharges) : '',
        targetPage: item.targetPage || 'shop',
        additionalImages: item.additionalImages ? JSON.stringify(item.additionalImages) : '[]'
      }
    });
  };

  const uniqueSubCategories = React.useMemo(() => {
    const tabFiltered = items.filter(item => {
      const isShopItem = item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage;
      const isCollectionItem = item.targetPage === 'collection' || item.targetPage === 'both';
      if (activeTab === 'shop' && !isShopItem) return false;
      if (activeTab === 'collection' && !isCollectionItem) return false;
      return true;
    });

    const subCats = tabFiltered
      .map((item: any) => item.subCategory)
      .filter((val): val is string => typeof val === 'string' && val.trim() !== '');

    const defaultSubCategories = ['Ring', 'Pendant', 'Chain', 'Bracelet', 'Earrings', 'Necklace', 'Payal'];
    const combined = Array.from(new Set([...subCats.map(s => s.trim()), ...defaultSubCategories]));
    combined.sort((a, b) => a.localeCompare(b));
    return ['All', ...combined];
  }, [items, activeTab]);

  useEffect(() => {
    setSelectedSubCategory('All');
  }, [activeTab]);

  const filteredItems = items.filter(item => {
    // 1. Tab segmentation filtering
    const isShopItem = item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage;
    const isCollectionItem = item.targetPage === 'collection' || item.targetPage === 'both';
    
    if (activeTab === 'shop' && !isShopItem) return false;
    if (activeTab === 'collection' && !isCollectionItem) return false;

    // 2. SubCategory filtering (matches field or name/description keywords)
    if (selectedSubCategory !== 'All') {
      const subCatLower = selectedSubCategory.toLowerCase();
      
      // Singular forms for matching (e.g. 'earrings' matching 'earring')
      const singularSubCat = subCatLower.endsWith('s') ? subCatLower.slice(0, -1) : subCatLower;
      
      const hasSubCatMatch = item.subCategory && (
        item.subCategory.toLowerCase() === subCatLower ||
        item.subCategory.toLowerCase() === singularSubCat
      );
      
      const hasTextMatch = (
        (item.name && (item.name.toLowerCase().includes(subCatLower) || item.name.toLowerCase().includes(singularSubCat))) ||
        (item.description && (item.description.toLowerCase().includes(subCatLower) || item.description.toLowerCase().includes(singularSubCat))) ||
        (item.category && (item.category.toLowerCase().includes(subCatLower) || item.category.toLowerCase().includes(singularSubCat)))
      );

      if (!hasSubCatMatch && !hasTextMatch) {
        return false;
      }
    }

    // 3. Search query filtering
    const query = searchQuery.toLowerCase();
    return (
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(query)) ||
      (item.name && item.name.toLowerCase().includes(query)) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
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
      {/* Header Container */}
      <View style={styles.header}>
        <Text style={styles.title}>Brahmani Showroom</Text>
        
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={18} color="rgba(28, 28, 30, 0.4)" style={styles.searchIcon} />
          <TextInput
            placeholder="Search gold, silver, rings..."
            placeholderTextColor="rgba(28, 28, 30, 0.4)"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Tab Segment Controller */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'shop' && styles.activeTabButton]}
            onPress={() => setActiveTab('shop')}
          >
            <Ionicons name="cart" size={18} color={activeTab === 'shop' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'shop' && styles.activeTabButtonText]}>Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'collection' && styles.activeTabButton]}
            onPress={() => setActiveTab('collection')}
          >
            <Ionicons name="diamond" size={16} color={activeTab === 'collection' ? '#FFFFFF' : '#8E8E93'} />
            <Text style={[styles.tabButtonText, activeTab === 'collection' && styles.activeTabButtonText]}>Collection</Text>
          </TouchableOpacity>
        </View>

        {/* Subcategory Pills Container */}
        {uniqueSubCategories.length > 1 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.subCategoryContainer}
          >
            {uniqueSubCategories.map((subCat) => (
              <TouchableOpacity
                key={subCat}
                style={[
                  styles.subCategoryButton,
                  selectedSubCategory.toLowerCase() === subCat.toLowerCase() && styles.activeSubCategoryButton
                ]}
                onPress={() => setSelectedSubCategory(subCat)}
              >
                <Text 
                  style={[
                    styles.subCategoryButtonText,
                    selectedSubCategory.toLowerCase() === subCat.toLowerCase() && styles.activeSubCategoryButtonText
                  ]}
                >
                  {subCat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {filteredItems.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
            <Text style={styles.noResultsText}>No designs match your search query</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((item, index) => {
              const computedPrice = calculatePrice(item);
              return (
                <Reanimated.View 
                  entering={FadeInDown.duration(350).delay(Math.min(index * 35, 250))}
                  key={item._id} 
                  style={styles.card}
                >
                  <TouchableOpacity onPress={() => navigateToDetails(item)} activeOpacity={0.8}>
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                    
                    {/* Weight tag floating on image if exists */}
                    {item.weight && (
                      <View style={styles.weightTag}>
                        <Text style={styles.weightTagText}>{item.weight}g</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={styles.cardInfo}>
                    <TouchableOpacity onPress={() => navigateToDetails(item)} activeOpacity={0.8}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name || `${item.category} Ornament`}</Text>
                      
                      <Text style={styles.itemDetails} numberOfLines={1}>
                        {item.purity ? `${item.purity} ` : ''}
                        {item.subCategory ? `${item.subCategory}` : `${item.category}`}
                      </Text>

                      {/* Weight & Price displayed directly on card */}
                      <View style={styles.priceWeightRow}>
                        {computedPrice > 0 ? (
                          <Text style={styles.itemPrice}>₹{computedPrice.toLocaleString('en-IN')}</Text>
                        ) : (
                          <Text style={styles.itemPrice}>Price on Request</Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {activeTab === 'shop' ? (
                      <TouchableOpacity style={styles.button} onPress={() => addToCart(item._id)}>
                        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.buttonText}>Add to Cart</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.button, styles.whatsappButton]} onPress={() => initiateWhatsAppInquiry(item)}>
                        <FontAwesome name="whatsapp" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>WhatsApp Inquiry</Text>
                      </TouchableOpacity>
                    )}
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
  header: { padding: 16, backgroundColor: '#FAF9F6', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 1, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#1C1C1E', fontSize: 14 },
  
  // Tab Segments
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    padding: 2,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#8E8E93',
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
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  image: { width: '100%', height: 140, resizeMode: 'cover' },
  weightTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(28, 28, 30, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  weightTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardInfo: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginBottom: 2, textTransform: 'capitalize', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  itemDetails: { fontSize: 11, color: 'rgba(28, 28, 30, 0.5)', marginBottom: 6, textTransform: 'capitalize' },
  priceWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#D4AF37' },
  button: { 
    backgroundColor: '#1C1C1E', 
    paddingVertical: 8, 
    borderRadius: 6, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 11 },
  noResultsContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  noResultsText: { fontSize: 14, color: 'rgba(28, 28, 30, 0.5)', marginTop: 12, fontWeight: '600' },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#FAF9F6',
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftArrow: {
    left: 15,
  },
  rightArrow: {
    right: 15,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalDetails: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textTransform: 'capitalize',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  modalTagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modalPurity: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E8E93',
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'capitalize',
  },
  detailsTable: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  tableLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tableValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  tableValueGold: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  descriptionText: {
    fontSize: 14,
    color: '#48484A',
    lineHeight: 20,
  },
  modalActionRow: {
    marginTop: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    width: '100%',
  },
  subCategoryContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 8,
    flexDirection: 'row',
  },
  subCategoryButton: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSubCategoryButton: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  subCategoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  activeSubCategoryButtonText: {
    color: '#FFFFFF',
  },
  modalCartButton: {
    backgroundColor: '#1C1C1E',
  },
  modalBuyButton: {
    backgroundColor: '#D4AF37',
  },
  modalWhatsappButton: {
    backgroundColor: '#25D366',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  }
});
