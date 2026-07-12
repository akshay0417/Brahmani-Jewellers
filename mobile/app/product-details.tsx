import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking, Share, Dimensions } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function ProductDetailsScreen() {
  const { user, refreshCartCount } = useAuth() as any;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rates, setRates] = useState<any>({ gold22K: 66000, gold24K: 72000, gold18K: 54000, silver: 85000 });
  const [loadingRates, setLoadingRates] = useState(true);

  // Parse parameters passed from parent collections screen
  const id = params.id as string;
  const name = (params.name as string) || '';
  const category = (params.category as string) || '';
  const subCategory = (params.subCategory as string) || '';
  const weight = (params.weight as string) || '';
  const purity = (params.purity as string) || '';
  const imageUrl = (params.imageUrl as string) || '';
  const description = (params.description as string) || '';
  const price = (params.price as string) || '';
  const makingCharges = (params.makingCharges as string) || '';
  const otherCharges = (params.otherCharges as string) || '';
  const targetPage = (params.targetPage as string) || 'shop';
  
  let additionalImages: string[] = [];
  try {
    if (params.additionalImages) {
      additionalImages = JSON.parse(params.additionalImages as string);
    }
  } catch (e) {
    console.error('Failed to parse additional images', e);
  }

  const allImages = [imageUrl, ...additionalImages].filter(Boolean);

  useEffect(() => {
    const fetchLatestRates = async () => {
      try {
        const response = await axios.get(`${API_URL}/rates`);
        if (response.data) {
          setRates(response.data);
        }
      } catch (error) {
        console.log('Failed to fetch latest rates, using fallbacks', error);
      } finally {
        setLoadingRates(false);
      }
    };
    fetchLatestRates();
  }, []);

  const calculatePrice = () => {
    if (price) return Math.round(Number(price) * 1.03);
    if (!rates || !weight || !purity) return 0;

    let ratePerGram = 0;
    const p = purity.toUpperCase();
    if (p.includes('24')) ratePerGram = rates.gold24K / 10;
    else if (p.includes('22')) ratePerGram = rates.gold22K / 10;
    else if (p.includes('18')) ratePerGram = rates.gold18K / 10;
    else if (p.includes('92.5') || p.includes('925')) ratePerGram = ((rates.silver90 || rates.silver || 74) / 1000) * (92.5 / 90);
    else if (p.includes('90') || p.includes('SILVER')) ratePerGram = (rates.silver90 || rates.silver || 74) / 1000;

    if (!ratePerGram) return 0;

    const parsedWeight = parseFloat(weight);
    const basePrice = ratePerGram * parsedWeight;
    const makingPercent = makingCharges ? parseFloat(makingCharges) : 0;
    const makingAmount = basePrice * (makingPercent / 100);
    const other = otherCharges ? parseFloat(otherCharges) : 0;
    const subtotal = basePrice + makingAmount + other;
    const gst = subtotal * 0.03;
    return Math.round(subtotal + gst);
  };

  const computedPrice = calculatePrice();

  const addToCart = async () => {
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to add items to cart");
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/cart/add`, { productId: id, quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success", "Item added to cart successfully!");
      refreshCartCount();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.");
        router.push('/login');
      } else {
        Alert.alert("Error", "Could not add item to cart");
      }
    } finally {
      setLoading(false);
    }
  };

  const buyNow = async () => {
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to buy items");
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/cart/add`, { productId: id, quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      refreshCartCount();
      router.push('/cart');
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.");
        router.push('/login');
      } else {
        Alert.alert("Error", "Could not buy item");
      }
    } finally {
      setLoading(false);
    }
  };

  const initiateWhatsAppInquiry = () => {
    let message = `Hello Brahmani Jewellers! I am interested in this design from your Collection Lookbook:\n\n`;
    message += `*Name:* ${name || `${category} Ornament`}\n`;
    message += `*Category:* ${category}\n`;
    if (subCategory) message += `*Subcategory:* ${subCategory}\n`;
    if (weight) message += `*Weight:* ${weight}g\n`;
    if (computedPrice > 0) message += `*Estimated Price:* ₹${computedPrice.toLocaleString('en-IN')}\n`;
    message += `\nImage: ${imageUrl}`;

    const url = `https://wa.me/917621967577?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your phone.");
    });
  };

  const shareProduct = async () => {
    try {
      let shareMessage = `Check out this beautiful design from Brahmani Jewellers!\n\n`;
      shareMessage += `*${name || `${category} Ornament`}*\n`;
      if (description) shareMessage += `${description}\n\n`;
      if (weight) shareMessage += `Weight: ${weight}g\n`;
      if (purity) shareMessage += `Purity: ${purity}\n`;
      if (computedPrice > 0) {
        shareMessage += `Price: ₹${computedPrice.toLocaleString('en-IN')}\n`;
      }
      shareMessage += `\nView image: ${imageUrl}`;

      await Share.share({
        message: shareMessage,
        title: name || 'Brahmani Jewellers Item',
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {name || `${category} Detail`}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={shareProduct}>
          <Ionicons name="share-social-outline" size={22} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Swipeable Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          {allImages.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const xOffset = e.nativeEvent.contentOffset.x;
                  const index = Math.round(xOffset / width);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {allImages.map((img, idx) => (
                  <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
                ))}
              </ScrollView>

              {allImages.length > 1 && (
                <View style={styles.indicatorContainer}>
                  {allImages.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.indicatorDot,
                        currentImageIndex === idx && styles.indicatorDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={64} color="rgba(28, 28, 30, 0.2)" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}
        </View>

        {/* Content Body */}
        <View style={styles.contentBody}>
          {/* Title and Badges */}
          <Text style={styles.titleText}>{name || `${category} Ornament`}</Text>
          
          <View style={styles.badgesRow}>
            {purity ? (
              <View style={styles.badgeGold}>
                <MaterialCommunityIcons name="shield-check" size={14} color="#D4AF37" style={{ marginRight: 4 }} />
                <Text style={styles.badgeGoldText}>{purity}</Text>
              </View>
            ) : null}
            <View style={styles.badgeGray}>
              <Text style={styles.badgeGrayText}>{subCategory || category}</Text>
            </View>
          </View>

          {/* Pricing Summary */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Estimated Showroom Price</Text>
            {computedPrice > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={styles.priceValue}>₹{computedPrice.toLocaleString('en-IN')}</Text>
                <Text style={styles.gstText}> (Incl. 3% GST)</Text>
              </View>
            ) : (
              <Text style={styles.priceValue}>Price on Request</Text>
            )}
            {loadingRates ? (
              <Text style={styles.rateUpdateText}>Calculating price with default rates...</Text>
            ) : (
              <Text style={styles.rateUpdateText}>*Calculated using live showroom gold/silver market rates.</Text>
            )}
          </View>

          {/* Hallmark Trust Banner */}
          <View style={styles.trustBanner}>
            <MaterialCommunityIcons name="certificate" size={24} color="#D4AF37" />
            <View style={styles.trustTextContainer}>
              <Text style={styles.trustTitle}>100% Certified Purity</Text>
              <Text style={styles.trustSubtitle}>BIS Hallmarked Jewellery, buy with complete confidence.</Text>
            </View>
          </View>

          {/* Specifications Table */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Specifications</Text>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Metal Type</Text>
              <Text style={styles.tableValue}>{category.toUpperCase()}</Text>
            </View>

            {weight ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Gross Weight</Text>
                <Text style={styles.tableValue}>{weight} grams</Text>
              </View>
            ) : null}

            {purity ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Purity / Karat</Text>
                <Text style={styles.tableValue}>{purity}</Text>
              </View>
            ) : null}

            {makingCharges ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Making Charges</Text>
                <Text style={styles.tableValue}>{makingCharges}%</Text>
              </View>
            ) : null}

            {subCategory ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Subcategory</Text>
                <Text style={styles.tableValue}>{subCategory}</Text>
              </View>
            ) : null}
          </View>

          {/* Description Section */}
          {description ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Product Description</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.footer}>
        {loading ? (
          <ActivityIndicator size="small" color="#D4AF37" style={{ paddingVertical: 14 }} />
        ) : targetPage === 'shop' ? (
          <View style={styles.shopActionRow}>
            <TouchableOpacity style={styles.cartButton} onPress={addToCart}>
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.cartButtonText}>Add To Cart</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.buyButton} onPress={buyNow}>
              <Ionicons name="flash-outline" size={20} color="#1C1C1E" style={{ marginRight: 6 }} />
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.whatsappInquiryButton} onPress={initiateWhatsAppInquiry}>
            <FontAwesome name="whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.whatsappButtonText}>WhatsApp Inquiry</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        paddingTop: 10,
      },
      android: {
        paddingTop: 30,
      }
    })
  },
  backButton: {
    padding: 6,
  },
  shareButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    maxWidth: width * 0.6,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  imageGalleryContainer: {
    width: width,
    height: 320,
    backgroundColor: '#FAF9F6',
    position: 'relative',
  },
  galleryImage: {
    width: width,
    height: 320,
    resizeMode: 'cover',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(28, 28, 30, 0.4)',
  },
  contentBody: {
    padding: 20,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    textTransform: 'capitalize',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badgeGold: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGoldText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D4AF37',
    textTransform: 'uppercase',
  },
  badgeGray: {
    backgroundColor: '#FAF9F6',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeGrayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8E8E93',
    textTransform: 'capitalize',
  },
  priceContainer: {
    backgroundColor: '#FAF9F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  gstText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  rateUpdateText: {
    fontSize: 10,
    color: 'rgba(28, 28, 30, 0.4)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  trustTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  trustSubtitle: {
    fontSize: 11,
    color: 'rgba(28, 28, 30, 0.6)',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF9F6',
    paddingBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF9F6',
  },
  tableLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
    textTransform: 'capitalize',
  },
  descriptionText: {
    fontSize: 14,
    color: '#48484A',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  shopActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cartButton: {
    flex: 1.1,
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buyButton: {
    flex: 1.1,
    backgroundColor: '#D4AF37',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buyButtonText: {
    color: '#1C1C1E',
    fontWeight: 'bold',
    fontSize: 15,
  },
  whatsappInquiryButton: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
