import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, ScrollView, Alert, Clipboard, Platform } from 'react-native';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function OffersScreen() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    try {
      const response = await axios.get(`${API_URL}/coupons/active`);
      setCoupons(response.data || []);
    } catch (error) {
      console.error('Error fetching active coupons:', error);
      // Fallback coupons
      setCoupons([
        { _id: '1', code: 'WELCOME10', discountPercent: 10, expirationDate: '2026-12-31' },
        { _id: '2', code: 'FESTIVAL5', discountPercent: 5, expirationDate: '2026-10-30' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCoupon = (code: string) => {
    Clipboard.setString(code);
    setCopiedCode(code);
    Alert.alert("Coupon Copied! 🎫", `"${code}" has been copied to your clipboard. Apply it at checkout to get your discount!`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#6B1124" />
        </TouchableOpacity>
        <Text style={styles.title}>Exclusive Offers</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Unlock exclusive discounts and festival specials at Brahmani Jewellers.</Text>

        {/* Dynamic Coupons List */}
        <Text style={styles.sectionTitle}>Active Coupon Codes</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#D4AF37" style={{ marginVertical: 20 }} />
        ) : coupons.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No active coupons at the moment. Check back soon!</Text>
          </View>
        ) : (
          coupons.map((coupon) => (
            <View key={coupon._id} style={styles.couponCard}>
              <View style={styles.couponHeader}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{coupon.discountPercent}% OFF</Text>
                </View>
                <Text style={styles.expiryText}>Expires: {new Date(coupon.expirationDate).toLocaleDateString()}</Text>
              </View>

              <Text style={styles.couponDesc}>Get a flat {coupon.discountPercent}% off on the making charges or total value of your order.</Text>

              <View style={styles.copyRow}>
                <View style={styles.codeContainer}>
                  <Text style={styles.codeText}>{coupon.code}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.copyBtn, copiedCode === coupon.code && styles.copiedBtn]} 
                  onPress={() => handleCopyCoupon(coupon.code)}
                >
                  <Text style={styles.copyBtnText}>{copiedCode === coupon.code ? 'COPIED!' : 'COPY CODE'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Store Specials (Option 2) */}
        <Text style={styles.sectionTitle}>Showroom Special Offers</Text>
        
        <View style={styles.specialCard}>
          <View style={styles.specialIconBg}>
            <MaterialCommunityIcons name="necklace" size={24} color="#D4AF37" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.specialTitle}>Free Making Charges on Silver</Text>
            <Text style={styles.specialDesc}>Flat 100% off on making charges for all luxury silver ornaments & articles.</Text>
          </View>
        </View>

        <View style={styles.specialCard}>
          <View style={styles.specialIconBg}>
            <FontAwesome name="truck" size={24} color="#D4AF37" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.specialTitle}>Free Insured Home Delivery</Text>
            <Text style={styles.specialDesc}>Free fully-insured delivery on all orders above ₹10,000 within Ahmedabad limit.</Text>
          </View>
        </View>

        <View style={styles.specialCard}>
          <View style={styles.specialIconBg}>
            <Ionicons name="ribbon-outline" size={24} color="#D4AF37" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.specialTitle}>Zero GST on Gold Coins</Text>
            <Text style={styles.specialDesc}>Purchase certified gold coins at 0% GST during our monthly pushya nakshatra sale.</Text>
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingTop: 20,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B1124',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  container: {
    padding: 16,
    paddingBottom: 80,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(107, 17, 36, 0.6)',
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B1124',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginTop: 10,
  },
  emptyBox: {
    backgroundColor: '#FFFDFB',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
  },
  couponCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    borderLeftWidth: 5,
    borderLeftColor: '#D4AF37',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#6B1124',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discountBadge: {
    backgroundColor: '#6B1124',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  expiryText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  couponDesc: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 16,
    marginBottom: 14,
  },
  copyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  codeContainer: {
    flex: 1,
    backgroundColor: '#FDF8F0',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
  },
  codeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B1124',
    letterSpacing: 1,
  },
  copyBtn: {
    backgroundColor: '#6B1124',
    paddingHorizontal: 16,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 38,
  },
  copiedBtn: {
    backgroundColor: '#34C759',
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  specialCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    alignItems: 'center',
  },
  specialIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF6E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6B1124',
    marginBottom: 2,
  },
  specialDesc: {
    fontSize: 11,
    color: '#666666',
    lineHeight: 15,
  },
});
