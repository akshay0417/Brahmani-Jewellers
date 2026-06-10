import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function InvestScreen() {
  const { user } = useAuth() as any;
  const [rates, setRates] = useState<any>(null);
  const [balance, setBalance] = useState<any>({ goldGrams: 0, silverGrams: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  
  // KYC State
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [kycRejectionReason, setKycRejectionReason] = useState('');
  const [kycForm, setKycForm] = useState({ kycName: '', panCard: '', aadhaarCard: '' });
  const [submittingKyc, setSubmittingKyc] = useState(false);

  // Forms state
  const [activeSegment, setActiveSegment] = useState('buy'); // 'buy' | 'redeem' | 'calc' | 'history'
  const [selectedMetal, setSelectedMetal] = useState('GOLD'); // 'GOLD' | 'SILVER'
  const [buyAmount, setBuyAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('UPI'); // 'UPI' | 'Bank'
  const [payReference, setPayReference] = useState('');
  
  // Redeem state
  const [redeemGrams, setRedeemGrams] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('Pickup'); // 'Pickup' | 'Delivery'
  const [address, setAddress] = useState({ name: '', mobile: '', address: '', city: '', state: '', pincode: '' });

  // Calculator State
  const [calcMetal, setCalcMetal] = useState('GOLD');
  const [calcKarat, setCalcKarat] = useState('24K');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcPrice, setCalcPrice] = useState('');
  const [calcMaking, setCalcMaking] = useState('');
  const [calcOther, setCalcOther] = useState('');
  const [lastEdited, setLastEdited] = useState('weight'); // 'weight' | 'price'

  const getRate = (metal: any, karat?: any) => {
    if (!rates) return 0;
    if (metal === 'GOLD') {
      if (karat === '22K') return rates.gold22K / 10;
      if (karat === '18K') return rates.gold18K / 10;
      return rates.gold24K / 10; // Default 24K
    } else {
      return (rates.silver90 || rates.silver || 0) / 1000;
    }
  };

  const doMath = (field: any, val: any, makingVal?: any, otherVal?: any, metalVal?: any, karatVal?: any) => {
    const activeMetal = metalVal !== undefined ? metalVal : calcMetal;
    const activeKarat = karatVal !== undefined ? karatVal : calcKarat;
    const rate = getRate(activeMetal, activeKarat);
    const m = parseFloat(makingVal !== undefined ? makingVal : calcMaking) || 0;
    const o = parseFloat(otherVal !== undefined ? otherVal : calcOther) || 0;

    if (field === 'weight') {
      const w = parseFloat(val) || 0;
      if (w === 0) {
        setCalcPrice('');
        return;
      }
      const base = (w * rate) + (w * m) + o;
      const gst = base * 0.03;
      const total = base + gst;
      setCalcPrice(total.toFixed(2));
    } else if (field === 'price') {
      const p = parseFloat(val) || 0;
      if (p === 0) {
        setCalcWeight('');
        return;
      }
      const base = p / 1.03;
      const w = (base - o) / (rate + m);
      setCalcWeight(w > 0 ? w.toFixed(4) : '0.0000');
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [ratesRes, balanceRes] = await Promise.all([
        axios.get(`${API_URL}/rates`).catch(() => null),
        user ? axios.get(`${API_URL}/investments/balance`, {
          headers: { Authorization: `Bearer ${user.token}` }
        }).catch(() => null) : null
      ]);

      if (ratesRes && ratesRes.data) {
        setRates(ratesRes.data);
      } else {
        setRates({ gold22K: 6250, gold24K: 6820, gold18K: 5120, silver: 74 });
      }

      if (balanceRes && balanceRes.data) {
        setBalance(balanceRes.data);
        if (balanceRes.data.kycStatus) {
          setKycStatus(balanceRes.data.kycStatus);
        }
        if (balanceRes.data.kycRejectionReason) {
          setKycRejectionReason(balanceRes.data.kycRejectionReason);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const maskString = (str: any, visibleStart: any, visibleEnd: any) => {
    if (!str) return 'N/A';
    const cleanStr = str.replace(/\s/g, '');
    if (cleanStr.length <= visibleStart + visibleEnd) return cleanStr;
    const middleLength = cleanStr.length - visibleStart - visibleEnd;
    return cleanStr.substring(0, visibleStart) + 'X'.repeat(middleLength) + cleanStr.substring(cleanStr.length - visibleEnd);
  };

  const handleKycSubmit = async () => {
    if (!kycForm.kycName.trim() || !kycForm.panCard.trim() || !kycForm.aadhaarCard.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields (Full Name, PAN, Aadhaar)");
      return;
    }
    
    // Quick format checks
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    if (!panRegex.test(kycForm.panCard.trim())) {
      Alert.alert("Invalid PAN", "Please enter a valid 10-digit PAN Card number (e.g. ABCDE1234F)");
      return;
    }

    const aadhaarRegex = /^\d{12}$/;
    if (!aadhaarRegex.test(kycForm.aadhaarCard.trim().replace(/\s/g, ''))) {
      Alert.alert("Invalid Aadhaar", "Please enter a valid 12-digit Aadhaar Card number");
      return;
    }

    try {
      setSubmittingKyc(true);
      const res = await axios.put(`${API_URL}/auth/kyc`, {
        kycName: kycForm.kycName.trim(),
        panCard: kycForm.panCard.trim().toUpperCase(),
        aadhaarCard: kycForm.aadhaarCard.trim().replace(/\s/g, '')
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      Alert.alert("KYC Submitted 🎉", "Your KYC details have been successfully submitted for verification.");
      setKycStatus('pending');
    } catch (err: any) {
      Alert.alert("Submission Failed", err.response?.data?.message || "Could not submit KYC details. Please try again.");
    } finally {
      setSubmittingKyc(false);
    }
  };

  const renderKycOrContent = (content: any) => {
    if (!user) {
      return (
        <View style={styles.kycPlaceholderCard}>
          <Ionicons name="lock-closed" size={48} color="#D4AF37" style={{ marginBottom: 12 }} />
          <Text style={styles.kycPlaceholderTitle}>Secure Account Required</Text>
          <Text style={styles.kycPlaceholderDesc}>
            To view balances, invest in digital gold & silver, or request physical delivery, please sign in or register a free secure account.
          </Text>
        </View>
      );
    }

    if (kycStatus === 'pending') {
      return (
        <Reanimated.View entering={FadeInDown.duration(300)} style={styles.kycStatusCard}>
          <View style={styles.kycStatusIconBg}>
            <MaterialCommunityIcons name="shield-sync" size={44} color="#D4AF37" />
          </View>
          <Text style={styles.kycStatusTitle}>KYC Verification Pending</Text>
          <Text style={styles.kycStatusDesc}>
            We have received your details and document numbers. Our support desk is verifying the authenticity. This usually takes up to 24 hours.
          </Text>
          <View style={styles.kycDetailsBox}>
            <Text style={styles.kycDetailsHeader}>Submitted Details</Text>
            <Text style={styles.kycDetailText}><Text style={{ fontWeight: 'bold' }}>Name:</Text> {balance.kycName || kycForm.kycName || user.name}</Text>
            <Text style={styles.kycDetailText}><Text style={{ fontWeight: 'bold' }}>PAN Number:</Text> {maskString(balance.panCard || kycForm.panCard, 4, 3)}</Text>
            <Text style={styles.kycDetailText}><Text style={{ fontWeight: 'bold' }}>Aadhaar Number:</Text> {maskString(balance.aadhaarCard || kycForm.aadhaarCard, 4, 4)}</Text>
          </View>
          <Text style={styles.kycStatusNotice}>You can continue using the Gold Calculator in the meantime.</Text>
        </Reanimated.View>
      );
    }

    if (kycStatus === 'not_submitted' || kycStatus === 'rejected') {
      return (
        <Reanimated.View entering={FadeInDown.duration(300)} style={styles.kycFormContainer}>
          {kycStatus === 'rejected' && (
            <View style={styles.rejectedBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="warning" size={20} color="#FF3B30" />
                <Text style={styles.rejectedTitle}>KYC Verification Rejected</Text>
              </View>
              <Text style={styles.rejectedDesc}>Reason: {kycRejectionReason || 'Invalid document details.'}</Text>
            </View>
          )}

          <Text style={styles.kycFormTitle}>Identity Verification Required</Text>
          <Text style={styles.kycFormDesc}>
            To comply with Anti-Money Laundering (AML) and government jewelry regulations, we require PAN and Aadhaar number verification before purchasing or redeeming digital metals.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name (As on Documents)</Text>
            <TextInput
              placeholder="e.g. Rajesh Kumar Patel"
              placeholderTextColor="rgba(28,28,30,0.3)"
              style={styles.textInput}
              value={kycForm.kycName}
              onChangeText={(val) => setKycForm({ ...kycForm, kycName: val })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PAN Card Number</Text>
            <TextInput
              placeholder="10-digit PAN (e.g. ABCDE1234F)"
              placeholderTextColor="rgba(28,28,30,0.3)"
              autoCapitalize="characters"
              maxLength={10}
              style={styles.textInput}
              value={kycForm.panCard}
              onChangeText={(val) => setKycForm({ ...kycForm, panCard: val })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Aadhaar Card Number</Text>
            <TextInput
              placeholder="12-digit UID Aadhaar number"
              placeholderTextColor="rgba(28,28,30,0.3)"
              keyboardType="numeric"
              maxLength={12}
              style={styles.textInput}
              value={kycForm.aadhaarCard}
              onChangeText={(val) => setKycForm({ ...kycForm, aadhaarCard: val })}
            />
          </View>

          <TouchableOpacity 
            style={[styles.buyBtn, { backgroundColor: '#D4AF37', marginTop: 12 }]} 
            onPress={handleKycSubmit}
            disabled={submittingKyc}
          >
            {submittingKyc ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>SUBMIT KYC DOCUMENTS</Text>
            )}
          </TouchableOpacity>
        </Reanimated.View>
      );
    }

    return content;
  };

  const handleBuy = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to invest in digital gold & silver");
      return;
    }

    const amountNum = parseFloat(buyAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid investment amount");
      return;
    }

    if (!showPayment) {
      setShowPayment(true);
      return;
    }

    if (!payReference.trim()) {
      Alert.alert("Reference Required", "Please enter the UPI Transaction ID or Bank UTR Number to confirm your payment.");
      return;
    }

    try {
      setLoading(true);
      const activeRates = rates || { gold22K: 62500, gold24K: 68200, gold18K: 51200, silver90: 74000 };
      const rate = selectedMetal === 'GOLD' ? (activeRates.gold24K / 10) : ((activeRates.silver90 || activeRates.silver || 74000) / 1000);

      const response = await axios.post(`${API_URL}/investments/buy`, {
        metal: selectedMetal,
        amount: amountNum,
        ratePerGram: rate,
        paymentMethod: buyPaymentMethod,
        paymentReference: payReference
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      Alert.alert("Success 🎉", "Investment successful! Details have been sent to your registered email and the transaction is pending verification.");
      setBalance(response.data.balance);
      setBuyAmount('');
      setPayReference('');
      setShowPayment(false);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not complete transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!user) return;
    const gramsNum = parseFloat(redeemGrams);
    if (isNaN(gramsNum) || gramsNum <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in grams to redeem");
      return;
    }

    const currentBal = selectedMetal === 'GOLD' ? balance.goldGrams : balance.silverGrams;
    if (currentBal < gramsNum) {
      Alert.alert("Insufficient Vault Balance", "You do not have enough grams in your vault to redeem this coin");
      return;
    }

    if (deliveryMode === 'Delivery' && (!address.name || !address.mobile || !address.address || !address.pincode)) {
      Alert.alert("Address Required", "Please fill in all shipping details for Home Delivery");
      return;
    }

    try {
      setLoading(true);
      const activeRates = rates || { gold22K: 62500, gold24K: 68200, gold18K: 51200, silver90: 74000 };
      const rate = selectedMetal === 'GOLD' ? (activeRates.gold24K / 10) : ((activeRates.silver90 || activeRates.silver || 74000) / 1000);

      const response = await axios.post(`${API_URL}/investments/redeem`, {
        metal: selectedMetal,
        grams: gramsNum,
        ratePerGram: rate,
        deliveryMode,
        shippingAddress: deliveryMode === 'Delivery' ? address : undefined
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      Alert.alert("Redeemed! 📦", "Your physical coin request has been created. Track progress in the 'Orders' tab.");
      setBalance(response.data.balance);
      setRedeemGrams('');
      setActiveSegment('history');
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not process redemption request");
    } finally {
      setLoading(false);
    }
  };

  const getCalculatedGrams = () => {
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0 || !rates) return '0.0000';
    const rate = selectedMetal === 'GOLD' ? (rates.gold24K / 10) : ((rates.silver90 || rates.silver || 74000) / 1000);
    const baseValue = amount / 1.03; // Deduct 3% GST
    return (baseValue / rate).toFixed(4);
  };

  const getCalculatedGST = () => {
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0) return '0.00';
    const baseValue = amount / 1.03;
    return (amount - baseValue).toFixed(2);
  };

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const goldRateGram = rates ? (rates.gold24K / 10) : 0;
  const silverRateGram = rates ? ((rates.silver90 || rates.silver || 74000) / 1000) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Digital Gold Vault</Text>
        <Text style={styles.subtitle}>Purity Assured & Fully Insured (3% GST Included)</Text>

        {/* Tab switcher */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'buy' && styles.activeSegmentBtn]}
            onPress={() => setActiveSegment('buy')}
          >
            <Text style={[styles.segmentBtnText, activeSegment === 'buy' && styles.activeSegmentBtnText]}>Buy Vault</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'redeem' && styles.activeSegmentBtn]}
            onPress={() => setActiveSegment('redeem')}
          >
            <Text style={[styles.segmentBtnText, activeSegment === 'redeem' && styles.activeSegmentBtnText]}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'calc' && styles.activeSegmentBtn]}
            onPress={() => setActiveSegment('calc')}
          >
            <Text style={[styles.segmentBtnText, activeSegment === 'calc' && styles.activeSegmentBtnText]}>Calculator</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeSegment === 'history' && styles.activeSegmentBtn]}
            onPress={() => setActiveSegment('history')}
          >
            <Text style={[styles.segmentBtnText, activeSegment === 'history' && styles.activeSegmentBtnText]}>Logs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {activeSegment === 'calc' ? (
          <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
            <Text style={styles.sectionTitle}>Gold & Silver Value Calculator</Text>
            <Text style={styles.sectionDesc}>Calculate total prices using live system rates. Support bidirectional calculation (Weight ⇄ Price).</Text>

            {/* Selector */}
            <View style={styles.metalSelectionRow}>
              <TouchableOpacity 
                style={[styles.metalBtn, calcMetal === 'GOLD' && styles.activeMetalBtnGold]}
                onPress={() => {
                  setCalcMetal('GOLD');
                  doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, 'GOLD', calcKarat);
                }}
              >
                <Text style={[styles.metalBtnText, calcMetal === 'GOLD' && styles.activeMetalBtnText]}>Gold Calculator</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.metalBtn, calcMetal === 'SILVER' && styles.activeMetalBtnSilver]}
                onPress={() => {
                  setCalcMetal('SILVER');
                  doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, 'SILVER');
                }}
              >
                <Text style={[styles.metalBtnText, calcMetal === 'SILVER' && styles.activeMetalBtnText]}>Silver Calculator</Text>
              </TouchableOpacity>
            </View>

            {calcMetal === 'GOLD' && (
              <View style={[styles.metalSelectionRow, { marginTop: -4, marginBottom: 14 }]}>
                <TouchableOpacity 
                  style={[styles.metalBtn, { paddingVertical: 6 }, calcKarat === '24K' && styles.activeMetalBtnGold]}
                  onPress={() => {
                    setCalcKarat('24K');
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, 'GOLD', '24K');
                  }}
                >
                  <Text style={[styles.metalBtnText, calcKarat === '24K' && styles.activeMetalBtnText]}>24K</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.metalBtn, { paddingVertical: 6 }, calcKarat === '22K' && styles.activeMetalBtnGold]}
                  onPress={() => {
                    setCalcKarat('22K');
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, 'GOLD', '22K');
                  }}
                >
                  <Text style={[styles.metalBtnText, calcKarat === '22K' && styles.activeMetalBtnText]}>22K</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.metalBtn, { paddingVertical: 6 }, calcKarat === '18K' && styles.activeMetalBtnGold]}
                  onPress={() => {
                    setCalcKarat('18K');
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, 'GOLD', '18K');
                  }}
                >
                  <Text style={[styles.metalBtnText, calcKarat === '18K' && styles.activeMetalBtnText]}>18K</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Inputs: Bidirectional Weight / Price */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Weight (Grams)</Text>
                <TextInput
                  placeholder="0.000"
                  placeholderTextColor="rgba(28,28,30,0.3)"
                  keyboardType="numeric"
                  style={styles.textInput}
                  value={calcWeight}
                  onChangeText={(val) => {
                    setCalcWeight(val);
                    setLastEdited('weight');
                    doMath('weight', val, calcMaking, calcOther);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Total Price (₹)</Text>
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="rgba(28,28,30,0.3)"
                  keyboardType="numeric"
                  style={styles.textInput}
                  value={calcPrice}
                  onChangeText={(val) => {
                    setCalcPrice(val);
                    setLastEdited('price');
                    doMath('price', val, calcMaking, calcOther);
                  }}
                />
              </View>
            </View>

            {/* Additional Charges */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Making Charges (%)</Text>
                <TextInput
                  placeholder="e.g. 8, 10, 12"
                  placeholderTextColor="rgba(28,28,30,0.3)"
                  keyboardType="numeric"
                  style={styles.textInput}
                  value={calcMaking}
                  onChangeText={(val) => {
                    setCalcMaking(val);
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, val, calcOther);
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Other Charges (₹)</Text>
                <TextInput
                  placeholder="e.g. 100, 150"
                  placeholderTextColor="rgba(28,28,30,0.3)"
                  keyboardType="numeric"
                  style={styles.textInput}
                  value={calcOther}
                  onChangeText={(val) => {
                    setCalcOther(val);
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, val);
                  }}
                />
              </View>
            </View>

            {/* Calculations Breakdown Card */}
            <View style={styles.breakdownBox}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>System Rate/gram</Text>
                <Text style={styles.breakdownVal}>₹{Math.round(getRate(calcMetal, calcKarat))}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Making Charges ({calcMaking || 0}%)</Text>
                <Text style={styles.breakdownVal}>
                  ₹{Math.round((parseFloat(calcWeight) || 0) * getRate(calcMetal, calcKarat) * ((parseFloat(calcMaking) || 0) / 100))}
                </Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Other Charges</Text>
                <Text style={styles.breakdownVal}>₹{parseFloat(calcOther) || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownText}>Fixed GST (3%)</Text>
                <Text style={styles.breakdownVal}>
                  ₹{Math.round((parseFloat(calcPrice) || 0) - ((parseFloat(calcPrice) || 0) / 1.03))}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.estimatedGramsLabel}>Final Estimated Value</Text>
                <Text style={styles.estimatedGramsVal}>₹{Math.round(parseFloat(calcPrice) || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </Reanimated.View>
        ) : (
          renderKycOrContent(
            <>
              {/* Metal Vault Balance Header Cards */}
              <View style={styles.vaultContainer}>
                <View style={styles.vaultCard}>
                  <View style={styles.vaultCardHeader}>
                    <MaterialCommunityIcons name="gold" size={24} color="#D4AF37" />
                    <Text style={styles.vaultCardTitle}>Gold Vault</Text>
                  </View>
                  <Text style={styles.vaultGrams}>{balance.goldGrams.toFixed(4)} g</Text>
                  <Text style={styles.vaultValue}>Worth: ₹{Math.round(balance.goldGrams * goldRateGram).toLocaleString('en-IN')}</Text>
                  <Text style={styles.vaultRate}>Live: ₹{Math.round(goldRateGram)}/g</Text>
                </View>

                <View style={[styles.vaultCard, styles.silverVaultCard]}>
                  <View style={styles.vaultCardHeader}>
                    <Ionicons name="ellipse" size={24} color="#C0C0C0" />
                    <Text style={styles.vaultCardTitle}>Silver Vault</Text>
                  </View>
                  <Text style={styles.vaultGrams}>{balance.silverGrams.toFixed(4)} g</Text>
                  <Text style={styles.vaultValue}>Worth: ₹{Math.round(balance.silverGrams * silverRateGram).toLocaleString('en-IN')}</Text>
                  <Text style={styles.vaultRate}>Live: ₹{Math.round(silverRateGram)}/g</Text>
                </View>
              </View>

              {activeSegment === 'buy' && (
                <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                  {!showPayment ? (
                    <>
                      <Text style={styles.sectionTitle}>Invest in Gold/Silver</Text>
                      
                      {/* Metal Selection Toggle */}
                      <View style={styles.metalSelectionRow}>
                        <TouchableOpacity 
                          style={[styles.metalBtn, selectedMetal === 'GOLD' && styles.activeMetalBtnGold]}
                          onPress={() => setSelectedMetal('GOLD')}
                        >
                          <Text style={[styles.metalBtnText, selectedMetal === 'GOLD' && styles.activeMetalBtnText]}>Buy 24K Gold</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.metalBtn, selectedMetal === 'SILVER' && styles.activeMetalBtnSilver]}
                          onPress={() => setSelectedMetal('SILVER')}
                        >
                          <Text style={[styles.metalBtnText, selectedMetal === 'SILVER' && styles.activeMetalBtnText]}>Buy Fine Silver</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Input fields */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Enter Investment Amount (INR)</Text>
                        <TextInput
                          placeholder="e.g. 500, 1000, 5000"
                          placeholderTextColor="rgba(28,28,30,0.3)"
                          keyboardType="numeric"
                          style={styles.textInput}
                          value={buyAmount}
                          onChangeText={setBuyAmount}
                        />
                      </View>

                      {/* Calculations Breakdown */}
                      {buyAmount !== '' && (
                        <View style={styles.breakdownBox}>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>Metal Purity</Text>
                            <Text style={styles.breakdownVal}>{selectedMetal === 'GOLD' ? '24K (99.9%)' : '99.9% Silver'}</Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>Live rate per gram</Text>
                            <Text style={styles.breakdownVal}>₹{Math.round(selectedMetal === 'GOLD' ? goldRateGram : silverRateGram)}</Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>GST (3% included)</Text>
                            <Text style={styles.breakdownVal}>₹{getCalculatedGST()}</Text>
                          </View>
                          <View style={styles.divider} />
                          <View style={styles.breakdownRow}>
                            <Text style={styles.estimatedGramsLabel}>Estimated Weight Added</Text>
                            <Text style={styles.estimatedGramsVal}>{getCalculatedGrams()} grams</Text>
                          </View>
                        </View>
                      )}

                      <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
                        <Text style={styles.buyBtnText}>CONFIRM INVESTMENT</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.sectionTitle}>Complete Payment (₹{buyAmount})</Text>
                      <Text style={styles.sectionDesc}>To complete your investment, please pay via UPI QR or Bank Transfer, then copy and paste the reference/UTR transaction ID below.</Text>
                      
                      {/* Payment Option Selector */}
                      <View style={styles.metalSelectionRow}>
                        <TouchableOpacity 
                          style={[styles.metalBtn, buyPaymentMethod === 'UPI' && styles.activeMetalBtnGold]}
                          onPress={() => setBuyPaymentMethod('UPI')}
                        >
                          <Text style={[styles.metalBtnText, buyPaymentMethod === 'UPI' && styles.activeMetalBtnText]}>UPI ID / QR Code</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.metalBtn, buyPaymentMethod === 'Bank' && styles.activeMetalBtnSilver]}
                          onPress={() => setBuyPaymentMethod('Bank')}
                        >
                          <Text style={[styles.metalBtnText, buyPaymentMethod === 'Bank' && styles.activeMetalBtnText]}>Bank Details</Text>
                        </TouchableOpacity>
                      </View>

                      {buyPaymentMethod === 'UPI' ? (
                        <View style={styles.pickupStoreBox}>
                          <Ionicons name="qr-code" size={32} color="#D4AF37" style={{ marginBottom: 8 }} />
                          <Text style={styles.pickupStoreTitle}>Scan & Pay via any UPI App</Text>
                          <Text style={[styles.pickupStoreDesc, { fontWeight: 'bold', fontSize: 13, color: '#D4AF37' }]}>
                            UPI ID: info.brahmanijewellers@okaxis
                          </Text>
                          <Text style={[styles.pickupStoreDesc, { marginTop: 4 }]}>
                            Payable Amount: ₹{buyAmount} (3% GST Included)
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.deliveryForm}>
                          <Text style={styles.formTitle}>Bank Transfer Information</Text>
                          <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>Bank Name:</Text> Saraspur Nagarik Bank</Text>
                          <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>A/C Name:</Text> Brahmani Jewellers</Text>
                          <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>A/C Number:</Text> 009111101000179</Text>
                          <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>IFSC:</Text> SNNK0000009</Text>
                          <Text style={styles.bankText}><Text style={{ fontWeight: 'bold' }}>Branch:</Text> Amraiwadi, Ahmedabad</Text>
                        </View>
                      )}

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Enter Transaction ID / Reference No.</Text>
                        <TextInput
                          placeholder="12-digit UPI reference or bank UTR number"
                          placeholderTextColor="rgba(28,28,30,0.3)"
                          keyboardType="default"
                          autoCapitalize="characters"
                          style={styles.textInput}
                          value={payReference}
                          onChangeText={setPayReference}
                        />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={[styles.buyBtn, { flex: 1, backgroundColor: '#8E8E93' }]} onPress={() => setShowPayment(false)}>
                          <Text style={styles.buyBtnText}>CANCEL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.buyBtn, { flex: 1, backgroundColor: '#1C1C1E' }]} onPress={handleBuy}>
                          <Text style={styles.buyBtnText}>SUBMIT PAYMENT</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Resell Info Card */}
                  <View style={styles.resellCard}>
                    <View style={styles.resellCardHeader}>
                      <Ionicons name="information-circle" size={20} color="#D4AF37" style={{ marginRight: 6 }} />
                      <Text style={styles.resellCardTitle}>Want to Resell Gold/Silver?</Text>
                    </View>
                    <Text style={styles.resellCardDesc}>
                      To comply with state regulations and prevent online identity theft, reselling is **In-Store Only**.
                      {"\n\n"}
                      Please visit our physical showroom at **Amraiwadi, Ahmedabad** with your app verification credentials for instant offline valuation and cash settlements.
                    </Text>
                    {user && (
                      <Text style={styles.resellUserId}>Your Verification User ID: {user.id || user._id}</Text>
                    )}
                  </View>
                </Reanimated.View>
              )}

              {activeSegment === 'redeem' && (
                <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                  <Text style={styles.sectionTitle}>Redeem Physical Gold/Silver Coins</Text>
                  <Text style={styles.sectionDesc}>Redeem your accumulated vault balance directly as physical BIS Hallmarked coins. We deduct the grams from your vault.</Text>

                  {/* Selector */}
                  <View style={styles.metalSelectionRow}>
                    <TouchableOpacity 
                      style={[styles.metalBtn, selectedMetal === 'GOLD' && styles.activeMetalBtnGold]}
                      onPress={() => setSelectedMetal('GOLD')}
                    >
                      <Text style={[styles.metalBtnText, selectedMetal === 'GOLD' && styles.activeMetalBtnText]}>Redeem Gold</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.metalBtn, selectedMetal === 'SILVER' && styles.activeMetalBtnSilver]}
                      onPress={() => setSelectedMetal('SILVER')}
                    >
                      <Text style={[styles.metalBtnText, selectedMetal === 'SILVER' && styles.activeMetalBtnText]}>Redeem Silver</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Weight to Redeem (in grams)</Text>
                    <TextInput
                      placeholder="e.g. 1, 2, 5, 10"
                      placeholderTextColor="rgba(28,28,30,0.3)"
                      keyboardType="numeric"
                      style={styles.textInput}
                      value={redeemGrams}
                      onChangeText={setRedeemGrams}
                    />
                  </View>

                  {/* Delivery/Pickup Select */}
                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Redemption Mode</Text>
                  <View style={styles.metalSelectionRow}>
                    <TouchableOpacity 
                      style={[styles.metalBtn, deliveryMode === 'Pickup' && styles.activeMetalBtnDark]}
                      onPress={() => setDeliveryMode('Pickup')}
                    >
                      <Text style={[styles.metalBtnText, deliveryMode === 'Pickup' && styles.activeMetalBtnText]}>In-Store Pickup (₹0)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.metalBtn, deliveryMode === 'Delivery' && styles.activeMetalBtnDark]}
                      onPress={() => setDeliveryMode('Delivery')}
                    >
                      <Text style={[styles.metalBtnText, deliveryMode === 'Delivery' && styles.activeMetalBtnText]}>Home Delivery</Text>
                    </TouchableOpacity>
                  </View>

                  {deliveryMode === 'Pickup' ? (
                    <View style={styles.pickupStoreBox}>
                      <Ionicons name="location" size={20} color="#D4AF37" style={{ marginBottom: 4 }} />
                      <Text style={styles.pickupStoreTitle}>Brahmani Showroom Address</Text>
                      <Text style={styles.pickupStoreDesc}>
                        Shop 4, Brahmani Complex, Near Hatkeshwar Circle, Amraiwadi, Ahmedabad, 380026.
                        {"\n"}
                        Hours: 10:00 AM - 8:30 PM (Closed on Sundays)
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.deliveryForm}>
                      <Text style={styles.formTitle}>Shipping Details</Text>
                      <TextInput
                        placeholder="Receiver's Full Name"
                        placeholderTextColor="rgba(28,28,30,0.3)"
                        style={styles.formInput}
                        value={address.name}
                        onChangeText={(val) => setAddress({ ...address, name: val })}
                      />
                      <TextInput
                        placeholder="Mobile Number"
                        placeholderTextColor="rgba(28,28,30,0.3)"
                        keyboardType="phone-pad"
                        style={styles.formInput}
                        value={address.mobile}
                        onChangeText={(val) => setAddress({ ...address, mobile: val })}
                      />
                      <TextInput
                        placeholder="Address Line (Flat/House/Street)"
                        placeholderTextColor="rgba(28,28,30,0.3)"
                        style={styles.formInput}
                        value={address.address}
                        onChangeText={(val) => setAddress({ ...address, address: val })}
                      />
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput
                          placeholder="City"
                          placeholderTextColor="rgba(28,28,30,0.3)"
                          style={[styles.formInput, { flex: 1 }]}
                          value={address.city}
                          onChangeText={(val) => setAddress({ ...address, city: val })}
                        />
                        <TextInput
                          placeholder="Pincode"
                          placeholderTextColor="rgba(28,28,30,0.3)"
                          keyboardType="numeric"
                          style={[styles.formInput, { flex: 1 }]}
                          value={address.pincode}
                          onChangeText={(val) => setAddress({ ...address, pincode: val })}
                        />
                      </View>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#D4AF37' }]} onPress={handleRedeem}>
                    <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>CONFIRM REDEMPTION</Text>
                  </TouchableOpacity>
                </Reanimated.View>
              )}

              {activeSegment === 'history' && (
                <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                  <Text style={styles.sectionTitle}>Vault Transaction Logs</Text>
                  {balance.transactions.length === 0 ? (
                    <Text style={styles.noHistoryText}>No transactions recorded yet.</Text>
                  ) : (
                    balance.transactions.map((tx: any, idx: any) => (
                      <View key={idx} style={styles.historyCard}>
                        <View style={styles.historyCardTop}>
                          <Text style={[
                            styles.historyType,
                            tx.type === 'BUY' ? styles.txBuy : tx.type === 'SELL' ? styles.txSell : styles.txRedeem
                          ]}>
                            {tx.type} {tx.metal}
                          </Text>
                          <Text style={styles.historyDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.historyDetails}>
                          <Text style={styles.historyLabel}>Weight: <Text style={styles.historyValue}>{tx.grams.toFixed(4)} g</Text></Text>
                          <Text style={styles.historyLabel}>Rate/g: <Text style={styles.historyValue}>₹{Math.round(tx.ratePerGram)}</Text></Text>
                          <Text style={styles.historyLabel}>Amount: <Text style={styles.historyValue}>₹{tx.amount.toLocaleString()}</Text></Text>
                        </View>
                      </View>
                    ))
                  )}
                </Reanimated.View>
              )}
            </>
          )
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FAF9F6', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 11, color: '#8E8E93', marginTop: 4, marginBottom: 14, fontWeight: '500' },
  
  segmentContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2, width: '100%' },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  activeSegmentBtn: { backgroundColor: '#1C1C1E' },
  segmentBtnText: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93' },
  activeSegmentBtnText: { color: '#FFFFFF' },

  container: { padding: 16 },
  vaultContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  vaultCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  silverVaultCard: {
    borderColor: '#E5E5EA',
  },
  vaultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  vaultCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93', textTransform: 'uppercase' },
  vaultGrams: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 2 },
  vaultValue: { fontSize: 12, fontWeight: '600', color: '#D4AF37', marginBottom: 2 },
  vaultRate: { fontSize: 10, color: '#8E8E93', fontStyle: 'italic' },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sectionDesc: { fontSize: 12, color: '#8E8E93', lineHeight: 16, marginBottom: 12 },

  metalSelectionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  metalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#F2F2F7', borderWidth: 1, borderColor: '#E5E5EA' },
  activeMetalBtnGold: { backgroundColor: '#1C1C1E', borderColor: '#D4AF37' },
  activeMetalBtnSilver: { backgroundColor: '#1C1C1E', borderColor: '#C0C0C0' },
  activeMetalBtnDark: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  metalBtnText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93' },
  activeMetalBtnText: { color: '#FFFFFF' },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#1C1C1E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, color: '#1C1C1E', backgroundColor: '#FAF9F6' },
  
  breakdownBox: { backgroundColor: '#FAF9F6', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownText: { fontSize: 12, color: 'rgba(28,28,30,0.5)' },
  breakdownVal: { fontSize: 12, fontWeight: 'bold', color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 8 },
  estimatedGramsLabel: { fontSize: 13, fontWeight: 'bold', color: '#D4AF37' },
  estimatedGramsVal: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },

  buyBtn: { backgroundColor: '#1C1C1E', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  resellCard: { backgroundColor: '#FAF9F6', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
  resellCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resellCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  resellCardDesc: { fontSize: 12, color: 'rgba(28,28,30,0.6)', lineHeight: 18 },
  resellUserId: { fontSize: 11, fontWeight: 'bold', color: '#D4AF37', marginTop: 10, textAlign: 'center' },

  pickupStoreBox: { backgroundColor: '#FAF9F6', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 14, alignItems: 'center' },
  pickupStoreTitle: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  pickupStoreDesc: { fontSize: 12, color: 'rgba(28,28,30,0.6)', lineHeight: 18, textAlign: 'center' },

  deliveryForm: { backgroundColor: '#FAF9F6', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 14 },
  formTitle: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 10 },
  formInput: { height: 40, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 6, paddingHorizontal: 10, fontSize: 13, color: '#1C1C1E', backgroundColor: '#FFFFFF', marginBottom: 8 },
  bankText: { fontSize: 13, color: '#1C1C1E', marginBottom: 6, lineHeight: 18 },

  noHistoryText: { fontSize: 13, color: '#8E8E93', textAlign: 'center', paddingVertical: 40, fontStyle: 'italic' },
  historyCard: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7', paddingVertical: 10 },
  historyCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  historyType: { fontSize: 13, fontWeight: 'bold' },
  txBuy: { color: '#2ecc71' },
  txSell: { color: '#e74c3c' },
  txRedeem: { color: '#3498db' },
  historyDate: { fontSize: 11, color: '#8E8E93' },
  historyDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  historyLabel: { fontSize: 11, color: '#8E8E93' },
  historyValue: { color: '#1C1C1E', fontWeight: '600' },
  
  // KYC Styles
  kycPlaceholderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    marginVertical: 10,
  },
  kycPlaceholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  kycPlaceholderDesc: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
    textAlign: 'center',
  },
  kycStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    marginVertical: 10,
  },
  kycStatusIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FAF9F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
  },
  kycStatusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  kycStatusDesc: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  kycDetailsBox: {
    width: '100%',
    backgroundColor: '#FAF9F6',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 16,
  },
  kycDetailsHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  kycDetailText: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  kycStatusNotice: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  kycFormContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F2F2F7',
    marginBottom: 20,
  },
  kycFormTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  kycFormDesc: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 16,
  },
  rejectedBanner: {
    backgroundColor: '#FFECEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFC7C4',
    marginBottom: 16,
  },
  rejectedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  rejectedDesc: {
    fontSize: 12,
    color: '#8A1F19',
    lineHeight: 16,
  },
});
