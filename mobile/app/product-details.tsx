import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking, Dimensions, Share } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { cacheDirectory, downloadAsync, readAsStringAsync, deleteAsync } from 'expo-file-system';
// RNShare is imported dynamically below to prevent Expo Go crashes

const { width } = Dimensions.get('window');
const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function ProductDetailsScreen() {
  const { user, refreshCartCount } = useAuth() as any;
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rates, setRates] = useState<any>({ gold22K: 66000, gold24K: 72000, gold18K: 54000, silver: 85000 });
  const [loadingRates, setLoadingRates] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

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
  const tagNumber = (params.tagNumber as string) || '';
  const size = (params.size as string) || '';
  const netWeight = (params.netWeight as string) || '';
  
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

  const isValidObjectId = (str: string) => typeof str === 'string' && /^[0-9a-fA-F]{24}$/.test(str);

  const addToCart = async () => {
    if (targetPage === 'collection') {
      Alert.alert("Not for Sale", "This item is part of our Catalogue/Collection and is not available for online purchase. Please inquire via WhatsApp.");
      return;
    }
    if (!user || !user.token) {
      Alert.alert("Login Required", "Please login to add items to cart");
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_URL}/cart/add`, { productId: String(id || ''), quantity: 1 }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success 🛒", "Item added to cart successfully!");
      refreshCartCount();
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please login again.");
        router.push('/login');
      } else if (error.response?.status === 502 || error.response?.status === 503) {
        Alert.alert("Server Waking Up", "Server is starting up. Please tap Add to Cart again in a few seconds.");
      } else {
        const errMsg = error.response?.data?.message || "Could not add item to cart. Please try again.";
        Alert.alert("Notice", errMsg);
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

    if (!id || !isValidObjectId(id)) {
      Alert.alert("Preview Item", "This item is a catalogue preview sample and cannot be purchased online. Please select an item from live catalog.");
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
        const errMsg = error.response?.data?.message || error.message || "Could not buy item";
        Alert.alert("Error", errMsg);
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

      let shared = false;
      try {
        const RNShare = require('react-native-share').default;
        
        // Download the remote image to a temporary file locally
        const filename = imageUrl.split('/').pop() || 'share-image.jpg';
        const localUri = `${cacheDirectory}${Date.now()}-${filename}`;
        
        const downloadResult = await downloadAsync(imageUrl, localUri);
        
        if (downloadResult.status === 200) {
          // Read file as base64 string
          const base64Data = await readAsStringAsync(downloadResult.uri, {
            encoding: 'base64'
          });
          
          await RNShare.open({
            title: name || 'Brahmani Jewellers Item',
            message: shareMessage,
            url: `data:image/jpeg;base64,${base64Data}`,
            type: 'image/jpeg',
          });
          
          // Clean up cached file
          await deleteAsync(downloadResult.uri, { idempotent: true });
          shared = true;
        }
      } catch (nativeShareError) {
        console.log("react-native-share not available, trying expo-sharing fallback:", nativeShareError);
        
        try {
          const Sharing = require('expo-sharing');
          const isSharingAvailable = await Sharing.isAvailableAsync();
          if (isSharingAvailable) {
            // Download the remote image to a temporary file locally
            const filename = imageUrl.split('/').pop() || 'share-image.jpg';
            const localUri = `${cacheDirectory}${Date.now()}-${filename}`;
            const downloadResult = await downloadAsync(imageUrl, localUri);
            
            if (downloadResult.status === 200) {
              // Copy details to Clipboard automatically
              const { Clipboard } = require('react-native');
              Clipboard.setString(shareMessage);
              
              // Alert user
              Alert.alert(
                "Product Info Copied 📋",
                "Product description has been copied to your clipboard. You can paste it when sharing!",
                [
                  {
                    text: "Continue",
                    onPress: async () => {
                      try {
                        await Sharing.shareAsync(downloadResult.uri, {
                          mimeType: 'image/jpeg',
                          dialogTitle: name || 'Brahmani Jewellers',
                          UTI: 'public.jpeg'
                        });
                      } catch (shareErr) {
                        console.log("Sharing.shareAsync failed:", shareErr);
                      } finally {
                        // Clean up cached file
                        await deleteAsync(downloadResult.uri, { idempotent: true });
                      }
                    }
                  }
                ]
              );
              shared = true;
            }
          }
        } catch (expoShareError) {
          console.log("expo-sharing failed as well:", expoShareError);
        }
      }

      if (!shared) {
        // Fallback to built-in Share for Expo Go (text only)
        await Share.share({
          message: `${shareMessage}\n${imageUrl}`,
        });
      }
    } catch (error: any) {
      if (error && error.message && error.message.includes('User cancelled')) {
        return;
      }
      Alert.alert('Error', error.message || 'Failed to share product');
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

        {/* Circular Action Buttons */}
        <View style={styles.circularActionBar}>
          <TouchableOpacity style={styles.circularBtn} onPress={() => Linking.openURL('tel:+917621967577')}>
            <View style={styles.circularIconBg}>
              <FontAwesome name="phone" size={18} color="#D4AF37" />
            </View>
            <Text style={styles.circularLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.circularBtn} onPress={() => setIsFavorite(!isFavorite)}>
            <View style={styles.circularIconBg}>
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={18} 
                color={isFavorite ? "#FF3B30" : "#D4AF37"} 
              />
            </View>
            <Text style={styles.circularLabel}>Favorite</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.circularBtn} onPress={initiateWhatsAppInquiry}>
            <View style={styles.circularIconBg}>
              <FontAwesome name="whatsapp" size={18} color="#25D366" />
            </View>
            <Text style={styles.circularLabel}>Whatsapp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.circularBtn} onPress={shareProduct}>
            <View style={styles.circularIconBg}>
              <Ionicons name="share-social-outline" size={18} color="#D4AF37" />
            </View>
            <Text style={styles.circularLabel}>Share</Text>
          </TouchableOpacity>
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

          {/* Specifications Table */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeader}>Specifications</Text>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Product No.</Text>
              <Text style={styles.tableValue}>{tagNumber || 'N/A'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Design No.</Text>
              <Text style={styles.tableValue}>{subCategory || 'N/A'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Size</Text>
              <Text style={styles.tableValue}>{size || 'N/A'}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Purity</Text>
              <Text style={styles.tableValue}>{purity || 'N/A'}</Text>
            </View>

            {weight ? (
              <View style={styles.tableRow}>
                <Text style={styles.tableLabel}>Gr. Weight</Text>
                <Text style={styles.tableValue}>{parseFloat(weight).toFixed(3)} grams</Text>
              </View>
            ) : null}

            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>Net Weight</Text>
              <Text style={styles.tableValue}>{parseFloat(String(netWeight || weight || 0)).toFixed(3)} grams</Text>
            </View>
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
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {loading ? (
          <ActivityIndicator size="small" color="#D4AF37" style={{ paddingVertical: 14 }} />
        ) : (
          <View style={styles.shopActionRow}>
            {targetPage === 'collection' ? (
              <TouchableOpacity 
                style={[styles.getQuoteButton, { marginRight: 0, backgroundColor: '#FFFFFF' }]} 
                onPress={initiateWhatsAppInquiry}
              >
                <FontAwesome name="whatsapp" size={20} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.getQuoteButtonText}>INQUIRE ON WHATSAPP</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={styles.getQuoteButton} onPress={initiateWhatsAppInquiry}>
                  <FontAwesome name="whatsapp" size={20} color="#D4AF37" style={{ marginRight: 6 }} />
                  <Text style={styles.getQuoteButtonText}>GET QUOTE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.cartButton} onPress={addToCart}>
                  <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.cartButtonText}>ADD TO CART</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 17, 36, 0.15)',
    marginBottom: 20,
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#6B1124',
  },
  gstText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  rateUpdateText: {
    fontSize: 10,
    color: 'rgba(107, 17, 36, 0.5)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 17, 36, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
    color: '#6B1124',
  },
  trustSubtitle: {
    fontSize: 11,
    color: '#666666',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(107, 17, 36, 0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#6B1124',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tableLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B1124',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#6B1124',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  cartButtonText: {
    color: '#6B1124',
    fontWeight: 'bold',
    fontSize: 15,
  },
  buyButton: {
    flex: 1.1,
    backgroundColor: '#6B1124',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  buyButtonText: {
    color: '#FFFFFF',
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

  circularActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
  },
  circularBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(107, 17, 36, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  circularLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B1124',
  },
  getQuoteButton: {
    flex: 1.1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6B1124',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  getQuoteButtonText: {
    color: '#6B1124',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
