import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, Platform, Linking, Modal, Share, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

const getSubCatIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('ring')) return 'ring';
  if (n.includes('chain')) return 'link-variant';
  if (n.includes('necklace') || n.includes('set')) return 'necklace';
  if (n.includes('earring') || n.includes('jhumka')) return 'flower';
  if (n.includes('bracelet') || n.includes('bangle') || n.includes('kada')) return 'bracelet';
  if (n.includes('pendant') || n.includes('mangalsutra')) return 'shield-star';
  if (n.includes('payal') || n.includes('anklet')) return 'foot-print';
  return 'dots-hexagon';
};

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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('shop'); // 'shop' | 'collection'
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');

  const [shopLevel, setShopLevel] = useState<'metal' | 'subcategory' | 'products'>('metal');
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver' | null>(null);
  const [selectedShopSubCat, setSelectedShopSubCat] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (params && params.search) {
      const searchVal = (params.search as string).toLowerCase();
      if (searchVal === 'gold' || searchVal === 'silver') {
        setSelectedMetal(searchVal as 'gold' | 'silver');
        setShopLevel('subcategory');
        setSelectedShopSubCat(null);
        setSearchQuery('');
      } else {
        setSearchQuery(params.search as string);
      }
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const isValidObjectId = (str: string) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);

  const addToCart = async (productId: any) => {
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to add items to cart");
      router.push('/login');
      return;
    }

    // Optimistically notify user and refresh cart count
    Alert.alert("Success 🛒", "Item added to cart successfully!");

    try {
      await axios.post(`${API_URL}/cart/add`, { productId: String(productId || ''), quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      refreshCartCount();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.");
        router.push('/login');
      } else {
        // Silently retry background cart sync
        refreshCartCount();
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
        tagNumber: item.tagNumber || '',
        size: item.size || '',
        netWeight: item.netWeight ? String(item.netWeight) : '',
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

  const subcategoriesForMetal = React.useMemo(() => {
    const metalItems = items.filter(item => {
      const isShopItem = item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage;
      return isShopItem && item.category === selectedMetal;
    });
    const subCats = new Set(metalItems.map(i => i.subCategory).filter(Boolean));
    return Array.from(subCats) as string[];
  }, [items, selectedMetal]);

  const shopFilteredItems = React.useMemo(() => {
    return items.filter(item => {
      const isShopItem = item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage;
      if (!isShopItem) return false;
      if (selectedMetal && item.category !== selectedMetal) return false;
      if (selectedShopSubCat && item.subCategory !== selectedShopSubCat) return false;
      return true;
    });
  }, [items, selectedMetal, selectedShopSubCat]);

  const filteredItems = items.filter(item => {
    // 1. Tab segmentation filtering
    const isShopItem = item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage;
    const isCollectionItem = item.targetPage === 'collection' || item.targetPage === 'both';
    
    if (activeTab === 'shop' && !isShopItem) return false;
    if (activeTab === 'collection' && !isCollectionItem) return false;

    // 2. SubCategory filtering (matches field or name/description keywords)
    if (activeTab === 'collection' && selectedSubCategory !== 'All') {
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
        {activeTab === 'collection' && uniqueSubCategories.length > 1 && (
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

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D4AF37']} tintColor="#D4AF37" />
        }
      >
        {searchQuery.length > 0 ? (
          filteredItems.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
              <Text style={styles.noResultsText}>No designs match your search query</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredItems.map((item, index) => {
                const computedPrice = calculatePrice(item);
                return (
                  <Reanimated.View 
                    entering={FadeInDown.duration(350).delay(Math.min(index * 35, 250))}
                    key={item._id} 
                    style={styles.listItemCard}
                  >
                    <TouchableOpacity 
                      style={styles.listItemContent}
                      onPress={() => navigateToDetails(item)} 
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.listImage} />
                      
                      <View style={styles.listDetailsContainer}>
                        {/* Top Row: Category and Status Badge */}
                        <View style={styles.listHeaderRow}>
                          <Text style={styles.listCategoryText}>
                            {(item.subCategory || item.category || 'Jewellery').toUpperCase()}
                          </Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>Ready Stock</Text>
                          </View>
                        </View>

                        {/* Tag Number & Purity */}
                        <Text style={styles.listTagText}>
                          {item.tagNumber || 'N/A'} - {item.purity || '916'}
                        </Text>

                        {/* Design / SubCategory */}
                        <Text style={styles.listInfoText}>
                          Design : {item.name || item.subCategory || 'N/A'}
                        </Text>

                        {/* Size */}
                        <Text style={styles.listInfoText}>
                          Size : {item.size || 'N/A'}
                        </Text>

                        {/* Weight Badges (Gr Wt & Nt Wt) */}
                        <View style={styles.weightBadgesRow}>
                          <View style={styles.weightBadge}>
                            <Text style={styles.weightBadgeText}>Gr Wt : {parseFloat(item.weight || 0).toFixed(3)}</Text>
                          </View>
                          <View style={styles.weightBadge}>
                            <Text style={styles.weightBadgeText}>Nt Wt : {parseFloat(item.netWeight || item.weight || 0).toFixed(3)}</Text>
                          </View>
                        </View>

                        {/* Action buttons or price */}
                        <View style={styles.listActionRow}>
                          <Text style={styles.listPriceText}>
                            {computedPrice > 0 ? `₹${computedPrice.toLocaleString('en-IN')}` : 'Price on Request'}
                          </Text>
                          
                          {activeTab === 'shop' ? (
                            <TouchableOpacity style={styles.listAddButton} onPress={() => addToCart(item._id)}>
                              <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                              <Text style={styles.listAddButtonText}>Add</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity style={styles.listWhatsAppButton} onPress={() => initiateWhatsAppInquiry(item)}>
                              <FontAwesome name="whatsapp" size={14} color="#FFFFFF" />
                              <Text style={styles.listAddButtonText}>Inquire</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Reanimated.View>
                );
              })}
            </View>
          )
        ) : activeTab === 'collection' ? (
          filteredItems.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
              <Text style={styles.noResultsText}>No designs match your search query</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filteredItems.map((item, index) => {
                const computedPrice = calculatePrice(item);
                return (
                  <Reanimated.View 
                    entering={FadeInDown.duration(350).delay(Math.min(index * 35, 250))}
                    key={item._id} 
                    style={styles.listItemCard}
                  >
                    <TouchableOpacity 
                      style={styles.listItemContent}
                      onPress={() => navigateToDetails(item)} 
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: item.imageUrl }} style={styles.listImage} />
                      
                      <View style={styles.listDetailsContainer}>
                        {/* Top Row: Category and Status Badge */}
                        <View style={styles.listHeaderRow}>
                          <Text style={styles.listCategoryText}>
                            {(item.subCategory || item.category || 'Jewellery').toUpperCase()}
                          </Text>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>Ready Stock</Text>
                          </View>
                        </View>

                        {/* Tag Number & Purity */}
                        <Text style={styles.listTagText}>
                          {item.tagNumber || 'N/A'} - {item.purity || '916'}
                        </Text>

                        {/* Design / SubCategory */}
                        <Text style={styles.listInfoText}>
                          Design : {item.name || item.subCategory || 'N/A'}
                        </Text>

                        {/* Size */}
                        <Text style={styles.listInfoText}>
                          Size : {item.size || 'N/A'}
                        </Text>

                        {/* Weight Badges (Gr Wt & Nt Wt) */}
                        <View style={styles.weightBadgesRow}>
                          <View style={styles.weightBadge}>
                            <Text style={styles.weightBadgeText}>Gr Wt : {parseFloat(item.weight || 0).toFixed(3)}</Text>
                          </View>
                          <View style={styles.weightBadge}>
                            <Text style={styles.weightBadgeText}>Nt Wt : {parseFloat(item.netWeight || item.weight || 0).toFixed(3)}</Text>
                          </View>
                        </View>

                        {/* Action buttons or price */}
                        <View style={styles.listActionRow}>
                          <Text style={styles.listPriceText}>
                            {computedPrice > 0 ? `₹${computedPrice.toLocaleString('en-IN')}` : 'Price on Request'}
                          </Text>
                          
                          <TouchableOpacity style={styles.listWhatsAppButton} onPress={() => initiateWhatsAppInquiry(item)}>
                            <FontAwesome name="whatsapp" size={14} color="#FFFFFF" />
                            <Text style={styles.listAddButtonText}>Inquire</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Reanimated.View>
                );
              })}
            </View>
          )
        ) : (
          /* Active Tab is 'shop', and no active search query */
          shopLevel === 'metal' ? (
            <View style={styles.metalSelectionContainer}>
              <TouchableOpacity 
                style={styles.metalCardGold}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedMetal('gold');
                  setShopLevel('subcategory');
                }}
              >
                <View style={styles.metalCardOverlay}>
                  <Ionicons name="diamond-outline" size={32} color="#D4AF37" style={styles.metalCardIcon} />
                  <Text style={styles.metalCardTitleGold}>GOLD JEWELLERY</Text>
                  <Text style={styles.metalCardSubtitleGold}>Explore Premium 22K Hallmarked Gold Ornaments</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.metalCardSilver}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedMetal('silver');
                  setShopLevel('subcategory');
                }}
              >
                <View style={styles.metalCardOverlay}>
                  <Ionicons name="sparkles-outline" size={32} color="#8E8E93" style={styles.metalCardIcon} />
                  <Text style={styles.metalCardTitleSilver}>SILVER JEWELLERY</Text>
                  <Text style={styles.metalCardSubtitleSilver}>Explore Certified 92.5 Sterling Silver Articles</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : shopLevel === 'subcategory' ? (
            <View style={styles.subCatViewContainer}>
              <View style={styles.shopNavigationHeader}>
                <TouchableOpacity 
                  style={styles.shopBackButton}
                  onPress={() => {
                    setShopLevel('metal');
                    setSelectedMetal(null);
                  }}
                >
                  <Ionicons name="arrow-back-outline" size={15} color="#1C1C1E" />
                  <Text style={styles.shopBackText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.shopNavigationTitle}>
                  {selectedMetal === 'gold' ? 'Gold Categories' : 'Silver Categories'}
                </Text>
              </View>

              {subcategoriesForMetal.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="cube-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
                  <Text style={styles.noResultsText}>No designs available in this section</Text>
                </View>
              ) : (
                <View style={styles.subCatGrid}>
                  {subcategoriesForMetal.map((subCat) => {
                    const matchedItems = items.filter(item => 
                      item.category === selectedMetal && 
                      item.subCategory === subCat &&
                      (item.targetPage === 'shop' || item.targetPage === 'both' || !item.targetPage)
                    );
                    const count = matchedItems.length;
                    const firstItem = matchedItems.find(item => item.imageUrl);
                    const subCatPhoto = firstItem ? firstItem.imageUrl : null;

                    return (
                      <TouchableOpacity
                        key={subCat}
                        style={styles.subCatGridCard}
                        onPress={() => {
                          setSelectedShopSubCat(subCat);
                          setShopLevel('products');
                        }}
                      >
                        <View style={styles.subCatGridIconBg}>
                          {subCatPhoto ? (
                            <Image 
                              source={{ uri: subCatPhoto }} 
                              style={styles.subCatGridImage} 
                            />
                          ) : (
                            <MaterialCommunityIcons 
                              name={getSubCatIcon(subCat) as any} 
                              size={22} 
                              color="#D4AF37" 
                            />
                          )}
                        </View>
                        <Text style={styles.subCatGridLabel}>{subCat}</Text>
                        <Text style={styles.subCatGridCount}>{count} {count === 1 ? 'Design' : 'Designs'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.productsViewContainer}>
              <View style={styles.shopNavigationHeader}>
                <TouchableOpacity 
                  style={styles.shopBackButton}
                  onPress={() => {
                    setShopLevel('subcategory');
                    setSelectedShopSubCat(null);
                  }}
                >
                  <Ionicons name="arrow-back-outline" size={15} color="#1C1C1E" />
                  <Text style={styles.shopBackText}>Categories</Text>
                </TouchableOpacity>
                <Text style={styles.shopNavigationTitle}>
                  {selectedShopSubCat} ({shopFilteredItems.length})
                </Text>
              </View>

              {shopFilteredItems.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Ionicons name="search-outline" size={48} color="rgba(28, 28, 30, 0.2)" />
                  <Text style={styles.noResultsText}>No designs in this category</Text>
                </View>
              ) : (
                <View style={styles.listContainer}>
                  {shopFilteredItems.map((item, index) => {
                    const computedPrice = calculatePrice(item);
                    return (
                      <Reanimated.View 
                        entering={FadeInDown.duration(350).delay(Math.min(index * 35, 250))}
                        key={item._id} 
                        style={styles.listItemCard}
                      >
                        <TouchableOpacity 
                          style={styles.listItemContent}
                          onPress={() => navigateToDetails(item)} 
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri: item.imageUrl }} style={styles.listImage} />
                          
                          <View style={styles.listDetailsContainer}>
                            {/* Top Row: Category and Status Badge */}
                            <View style={styles.listHeaderRow}>
                              <Text style={styles.listCategoryText}>
                                {(item.subCategory || item.category || 'Jewellery').toUpperCase()}
                              </Text>
                              <View style={styles.statusBadge}>
                                <Text style={styles.statusBadgeText}>Ready Stock</Text>
                              </View>
                            </View>

                            {/* Tag Number & Purity */}
                            <Text style={styles.listTagText}>
                              {item.tagNumber || 'N/A'} - {item.purity || '916'}
                            </Text>

                            {/* Design / SubCategory */}
                            <Text style={styles.listInfoText}>
                              Design : {item.name || item.subCategory || 'N/A'}
                            </Text>

                            {/* Size */}
                            <Text style={styles.listInfoText}>
                              Size : {item.size || 'N/A'}
                            </Text>

                            {/* Weight Badges (Gr Wt & Nt Wt) */}
                            <View style={styles.weightBadgesRow}>
                              <View style={styles.weightBadge}>
                                <Text style={styles.weightBadgeText}>Gr Wt : {parseFloat(item.weight || 0).toFixed(3)}</Text>
                              </View>
                              <View style={styles.weightBadge}>
                                <Text style={styles.weightBadgeText}>Nt Wt : {parseFloat(item.netWeight || item.weight || 0).toFixed(3)}</Text>
                              </View>
                            </View>

                            {/* Action buttons or price */}
                            <View style={styles.listActionRow}>
                              <Text style={styles.listPriceText}>
                                {computedPrice > 0 ? `₹${computedPrice.toLocaleString('en-IN')}` : 'Price on Request'}
                              </Text>
                              
                              <TouchableOpacity style={styles.listAddButton} onPress={() => addToCart(item._id)}>
                                <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.listAddButtonText}>Add</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </TouchableOpacity>
                      </Reanimated.View>
                    );
                  })}
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FFFFFF', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#6B1124', letterSpacing: 1, marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(107, 17, 36, 0.2)',
    marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#6B1124', fontSize: 14 },
  
  // Tab Segments
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(107, 17, 36, 0.06)',
    borderRadius: 8,
    padding: 3,
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
    backgroundColor: '#6B1124',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B1124',
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
    borderColor: 'rgba(212, 175, 55, 0.3)',
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  image: { width: '100%', height: 140, resizeMode: 'cover' },
  weightTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(107, 17, 36, 0.85)',
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
  itemName: { fontSize: 14, fontWeight: '700', color: '#6B1124', marginBottom: 2, textTransform: 'capitalize', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  itemDetails: { fontSize: 11, color: '#666666', marginBottom: 6, textTransform: 'capitalize' },
  priceWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemPrice: { fontSize: 14, fontWeight: 'bold', color: '#6B1124' },
  button: { 
    backgroundColor: '#6B1124', 
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
  },

  listContainer: { width: '100%' },
  listItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemContent: {
    flexDirection: 'row',
    padding: 10,
  },
  listImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  listDetailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  listCategoryText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listTagText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 2,
  },
  listInfoText: {
    fontSize: 11,
    color: '#48484A',
    marginBottom: 1,
  },
  weightBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  weightBadge: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  weightBadgeText: {
    fontSize: 10,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  listActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  listPriceText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  listAddButton: {
    backgroundColor: '#D4AF37',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  listWhatsAppButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6,
  },
  listAddButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },

  metalSelectionContainer: {
    gap: 16,
    paddingVertical: 8,
  },
  metalCardGold: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    overflow: 'hidden',
  },
  metalCardSilver: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#AEAEB2',
    overflow: 'hidden',
  },
  metalCardOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  metalCardIcon: {
    marginBottom: 8,
  },
  metalCardTitleGold: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D4AF37',
    letterSpacing: 1.5,
  },
  metalCardSubtitleGold: {
    fontSize: 12,
    color: '#1C1C1E',
    marginTop: 4,
    opacity: 0.8,
  },
  metalCardTitleSilver: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8E8E93',
    letterSpacing: 1.5,
  },
  metalCardSubtitleSilver: {
    fontSize: 12,
    color: '#1C1C1E',
    marginTop: 4,
    opacity: 0.8,
  },
  subCatViewContainer: {
    flex: 1,
  },
  shopNavigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 16,
  },
  shopBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  shopBackText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  shopNavigationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  subCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  subCatGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subCatGridIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    overflow: 'hidden',
  },
  subCatGridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  subCatGridLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  subCatGridCount: {
    fontSize: 11,
    color: '#8E8E93',
  },
  productsViewContainer: {
    flex: 1,
  }
});
