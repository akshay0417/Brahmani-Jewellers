import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useAuth } from '../../context/AuthContext';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import Reanimated, { FadeInDown } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function InvestScreen() {
  const { user } = useAuth() as any;
  const [rates, setRates] = useState<any>({ gold22K: 66000, gold24K: 72000, gold18K: 54000, investEnabled: false });
  const [balance, setBalance] = useState<any>({ goldGrams: 0, transactions: [] });
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);

  // Razorpay WebView states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentHtml, setPaymentHtml] = useState('');
  const [pendingInvestmentInfo, setPendingInvestmentInfo] = useState<any>(null);

  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setShowPaymentModal(false);
      
      if (data.status === 'success') {
        setLoading(true);
        const { amountNum, rate } = pendingInvestmentInfo;
        
        const verifyRes = await axios.post(`${API_URL}/investments/verify-payment`, {
          amount: amountNum,
          ratePerGram: rate,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_signature: data.razorpay_signature
        }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        Alert.alert("Success 🎉", "Payment verified and gold credited to vault!");
        setBalance(verifyRes.data.balance);
        setBuyAmount('');
      } else if (data.status === 'cancelled') {
        Alert.alert("Payment Cancelled", "The payment process was cancelled.");
      } else {
        Alert.alert("Payment Failed", data.error?.description || data.message || "Payment transaction failed.");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Verification Error", "Failed to verify investment payment.");
    } finally {
      setLoading(false);
    }
  };
  
  // KYC State
  const [kycStatus, setKycStatus] = useState('not_submitted');
  const [kycRejectionReason, setKycRejectionReason] = useState('');
  const [kycForm, setKycForm] = useState({ kycName: '', panCard: '', aadhaarCard: '' });
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [showKycTrigger, setShowKycTrigger] = useState(false);

  // Forms state
  const [activeSegment, setActiveSegment] = useState('calc'); // 'calc' | 'buy' | 'redeem' | 'history'
  const [buyAmount, setBuyAmount] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('UPI'); // 'UPI' | 'Bank'
  const [payReference, setPayReference] = useState('');
  
  // Redeem state
  const [redeemGrams, setRedeemGrams] = useState('');
  const [deliveryMode, setDeliveryMode] = useState('Pickup'); // 'Pickup' | 'Delivery'
  const [address, setAddress] = useState({ name: '', mobile: '', address: '', city: '', state: '', pincode: '' });

  // Sell state
  const [sellGrams, setSellGrams] = useState('');
  const [sellPaymentMethod, setSellPaymentMethod] = useState('UPI'); // 'UPI' | 'Bank'
  const [sellBankDetails, setSellBankDetails] = useState({
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  });

  // Calculator State
  const [calcKarat, setCalcKarat] = useState('24K');
  const [calcWeight, setCalcWeight] = useState('');
  const [calcPrice, setCalcPrice] = useState('');
  const [calcMaking, setCalcMaking] = useState('');
  const [calcOther, setCalcOther] = useState('');
  const [lastEdited, setLastEdited] = useState('weight'); // 'weight' | 'price'

  const getRate = (karat?: any) => {
    if (!rates) return 0;
    if (karat === '22K') return rates.gold22K / 10;
    if (karat === '18K') return rates.gold18K / 10;
    return rates.gold24K / 10; // Default 24K
  };

  const doMath = (field: any, val: any, makingVal?: any, otherVal?: any, karatVal?: any) => {
    const activeKarat = karatVal !== undefined ? karatVal : calcKarat;
    const rate = getRate(activeKarat);

    if (field === 'weight') {
      const w = parseFloat(val) || 0;
      if (w === 0) {
        setCalcPrice('');
        return;
      }
      const metalValue = w * rate;
      setCalcPrice(metalValue.toFixed(2));
    } else if (field === 'price') {
      const p = parseFloat(val) || 0;
      if (p === 0) {
        setCalcWeight('');
        return;
      }
      const w = rate > 0 ? p / rate : 0;
      setCalcWeight(w > 0 ? w.toFixed(3) : '0.000');
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [user])
  );

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
        setRates({ gold22K: 6250, gold24K: 6820, gold18K: 5120 });
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
      console.error('KYC Submission Error:', err);
      const backendMessage = err.response?.data?.message;
      const responseStatus = err.response?.status;
      const errorMsg = backendMessage 
        ? `${backendMessage} (Code: ${responseStatus})` 
        : `${err.message || 'Unknown network error'}`;
      Alert.alert("Submission Failed", errorMsg);
    } finally {
      setSubmittingKyc(false);
    }
  };

  const renderKycInterface = () => {
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
          <TouchableOpacity 
            style={[styles.buyBtn, { backgroundColor: '#8E8E93', width: '100%', marginBottom: 0 }]} 
            onPress={() => setShowKycTrigger(false)}
          >
            <Text style={styles.buyBtnText}>GO BACK</Text>
          </TouchableOpacity>
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

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity 
              style={[styles.buyBtn, { flex: 1, backgroundColor: '#8E8E93', marginBottom: 0 }]} 
              onPress={() => setShowKycTrigger(false)}
            >
              <Text style={styles.buyBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.buyBtn, { flex: 1, backgroundColor: '#D4AF37', marginBottom: 0 }]} 
              onPress={handleKycSubmit}
              disabled={submittingKyc}
            >
              {submittingKyc ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>SUBMIT KYC</Text>
              )}
            </TouchableOpacity>
          </View>
        </Reanimated.View>
      );
    }

    return null;
  };

  const handleBuy = async () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to invest in digital gold");
      return;
    }

    const amountNum = parseFloat(buyAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid investment amount");
      return;
    }

    if (kycStatus !== 'approved') {
      setShowKycTrigger(true);
      return;
    }

    try {
      setLoading(true);
      const activeRates = rates || { gold22K: 6250, gold24K: 6820, gold18K: 5120 };
      const rate = activeRates.gold24K / 10;

      // 1. Create Razorpay order on backend (adding 2% gateway charge)
      const rzpOrderRes = await axios.post(`${API_URL}/investments/razorpay-order`, {
        amount: Math.round(amountNum * 1.02)
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const rzpOrderId = rzpOrderRes.data.id;

      if (rzpOrderRes.data.isMock) {
        // Mock / Simulation Mode Alert
        setLoading(false);
        Alert.alert(
          "[Razorpay Simulation]",
          `Simulate successful Razorpay payment of ₹${amountNum.toLocaleString('en-IN')} for ${getCalculatedGrams()}g gold?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Simulate Payment",
              onPress: async () => {
                try {
                  setLoading(true);
                  const mockPaymentId = 'pay_mock_inv_' + Math.random().toString(36).substring(2, 15);
                  const mockSignature = 'sig_mock_inv_' + Math.random().toString(36).substring(2, 15);

                  const verifyRes = await axios.post(`${API_URL}/investments/verify-payment`, {
                    amount: amountNum,
                    ratePerGram: rate,
                    razorpay_payment_id: mockPaymentId,
                    razorpay_order_id: rzpOrderId,
                    razorpay_signature: mockSignature
                  }, {
                    headers: { Authorization: `Bearer ${user.token}` }
                  });

                  Alert.alert("Success 🎉", "Payment verified and gold credited to vault!");
                  setBalance(verifyRes.data.balance);
                  setBuyAmount('');
                } catch (verifyErr: any) {
                  Alert.alert("Error", verifyErr.response?.data?.message || "Payment verification failed");
                } finally {
                  setLoading(false);
                }
              }
            }
          ]
        );
      } else {
        // Live Razorpay mode: Open Razorpay WebView modal
        setLoading(false);
        const rzpKey = rzpOrderRes.data.key || 'rzp_test_mockKeyId123';
        const rzpAmount = rzpOrderRes.data.amount;
        const rzpCurrency = rzpOrderRes.data.currency || 'INR';

        setPendingInvestmentInfo({ amountNum, rate });
        const html = generateRazorpayHtml(
          rzpKey,
          rzpAmount,
          rzpCurrency,
          rzpOrderId,
          user.name || '',
          user.mobile || '',
          user.email || ''
        );
        setPaymentHtml(html);
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not complete transaction");
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

    const currentBal = balance.goldGrams || 0;
    if (currentBal < gramsNum) {
      Alert.alert("Insufficient Vault Balance", "You do not have enough grams in your vault to redeem this coin");
      return;
    }

    if (kycStatus !== 'approved') {
      setShowKycTrigger(true);
      return;
    }

    if (deliveryMode === 'Delivery' && (!address.name || !address.mobile || !address.address || !address.pincode)) {
      Alert.alert("Address Required", "Please fill in all shipping details for Home Delivery");
      return;
    }

    try {
      setLoading(true);
      const activeRates = rates || { gold22K: 6250, gold24K: 6820, gold18K: 5120 };
      const rate = activeRates.gold24K / 10;

      const response = await axios.post(`${API_URL}/investments/redeem`, {
        metal: 'GOLD',
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

  const handleSell = async () => {
    if (!user) return;
    const gramsNum = parseFloat(sellGrams);
    if (isNaN(gramsNum) || gramsNum <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in grams to sell");
      return;
    }

    const currentBal = balance.goldGrams || 0;
    if (currentBal < gramsNum) {
      Alert.alert("Insufficient Balance", "You cannot sell more gold than what is in your vault");
      return;
    }

    if (kycStatus !== 'approved') {
      setShowKycTrigger(true);
      return;
    }

    if (sellPaymentMethod === 'UPI' && !sellBankDetails.upiId.trim()) {
      Alert.alert("Missing Details", "Please enter your UPI ID");
      return;
    }

    if (sellPaymentMethod === 'Bank' && (!sellBankDetails.bankName.trim() || !sellBankDetails.accountHolder.trim() || !sellBankDetails.accountNumber.trim() || !sellBankDetails.ifscCode.trim())) {
      Alert.alert("Missing Details", "Please enter all bank account details");
      return;
    }

    try {
      setLoading(true);
      const activeRates = rates || { gold22K: 6250, gold24K: 6820, gold18K: 5120 };
      const rate = activeRates.gold24K / 10;

      const response = await axios.post(`${API_URL}/investments/sell`, {
        metal: 'GOLD',
        grams: gramsNum,
        ratePerGram: rate,
        paymentMethod: sellPaymentMethod,
        bankDetails: sellBankDetails
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      Alert.alert("Request Submitted! 🏦", "Your sell request has been submitted. The amount will be transferred to your account after admin verification.");
      setBalance(response.data.balance);
      setSellGrams('');
      setSellBankDetails({ bankName: '', accountHolder: '', accountNumber: '', ifscCode: '', upiId: '' });
      setActiveSegment('history');
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Could not process sell request");
    } finally {
      setLoading(false);
    }
  };

  const getCalculatedGrams = () => {
    const amount = parseFloat(buyAmount);
    if (isNaN(amount) || amount <= 0 || !rates) return '0.0000';
    const rate = rates.gold24K / 10;
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
              onPress={() => {
                setActiveSegment('buy');
                setShowKycTrigger(false);
              }}
            >
              <Text style={[styles.segmentBtnText, activeSegment === 'buy' && styles.activeSegmentBtnText]}>Buy Gold</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, activeSegment === 'redeem' && styles.activeSegmentBtn]}
              onPress={() => {
                setActiveSegment('redeem');
                setShowKycTrigger(false);
              }}
            >
              <Text style={[styles.segmentBtnText, activeSegment === 'redeem' && styles.activeSegmentBtnText]}>Redeem</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, activeSegment === 'sell' && styles.activeSegmentBtn]}
              onPress={() => {
                setActiveSegment('sell');
                setShowKycTrigger(false);
              }}
            >
              <Text style={[styles.segmentBtnText, activeSegment === 'sell' && styles.activeSegmentBtnText]}>Sell Gold</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, activeSegment === 'calc' && styles.activeSegmentBtn]}
              onPress={() => {
                setActiveSegment('calc');
                setShowKycTrigger(false);
              }}
            >
              <Text style={[styles.segmentBtnText, activeSegment === 'calc' && styles.activeSegmentBtnText]}>Calculator</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.segmentBtn, activeSegment === 'history' && styles.activeSegmentBtn]}
              onPress={() => {
                setActiveSegment('history');
                setShowKycTrigger(false);
              }}
            >
              <Text style={[styles.segmentBtnText, activeSegment === 'history' && styles.activeSegmentBtnText]}>Logs</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.container} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#D4AF37"]} />
          }
        >
          
          {activeSegment === 'calc' ? (
            <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
              <Text style={styles.sectionTitle}>Gold Value Calculator</Text>
              <Text style={styles.sectionDesc}>Calculate total gold prices using live system rates. Supports weight ⇄ price calculation.</Text>

              {/* Karat Selection Row */}
              <View style={[styles.metalSelectionRow, { marginBottom: 14 }]}>
                <TouchableOpacity 
                  style={[styles.metalBtn, { paddingVertical: 10 }, calcKarat === '24K' && styles.activeMetalBtnGold]}
                  onPress={() => {
                    setCalcKarat('24K');
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, '24K');
                  }}
                >
                  <Text style={[styles.metalBtnText, calcKarat === '24K' && styles.activeMetalBtnText]}>24K Gold</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.metalBtn, { paddingVertical: 10 }, calcKarat === '22K' && styles.activeMetalBtnGold]}
                  onPress={() => {
                    setCalcKarat('22K');
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, '22K');
                  }}
                >
                  <Text style={[styles.metalBtnText, calcKarat === '22K' && styles.activeMetalBtnText]}>22K Gold</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.metalBtn, { paddingVertical: 10 }, calcKarat === '18K' && styles.activeMetalBtnGold]}
                  onPress={() => {
                    setCalcKarat('18K');
                    doMath(lastEdited, lastEdited === 'weight' ? calcWeight : calcPrice, calcMaking, calcOther, '18K');
                  }}
                >
                  <Text style={[styles.metalBtnText, calcKarat === '18K' && styles.activeMetalBtnText]}>18K Gold</Text>
                </TouchableOpacity>
              </View>

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
                  <Text style={styles.inputLabel}>Gold Price (₹)</Text>
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
              {(() => {
                const metalVal = (parseFloat(calcWeight) || 0) * getRate(calcKarat);
                const makingChg = metalVal * ((parseFloat(calcMaking) || 0) / 100);
                const otherChg = parseFloat(calcOther) || 0;
                const subTotal = metalVal + makingChg + otherChg;
                const gstChg = subTotal * 0.03;
                const grandTotal = subTotal + gstChg;

                return (
                  <View style={styles.breakdownBox}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>System Rate/gram</Text>
                      <Text style={styles.breakdownVal}>₹{Math.round(getRate(calcKarat))}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>Metal Value (Rate × Weight)</Text>
                      <Text style={styles.breakdownVal}>
                        ₹{Math.round(metalVal).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>Making Charges ({calcMaking || 0}%)</Text>
                      <Text style={styles.breakdownVal}>
                        ₹{Math.round(makingChg).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>Other Charges</Text>
                      <Text style={styles.breakdownVal}>₹{otherChg.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownText}>Fixed GST (3%)</Text>
                      <Text style={styles.breakdownVal}>
                        ₹{Math.round(gstChg).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.breakdownRow}>
                      <Text style={styles.estimatedGramsLabel}>Total Value (Payable)</Text>
                      <Text style={styles.estimatedGramsVal}>₹{Math.round(grandTotal).toLocaleString('en-IN')}</Text>
                    </View>
                  </View>
                );
              })()}
            </Reanimated.View>
          ) : rates && !rates.investEnabled ? (
            <Reanimated.View entering={FadeInDown.duration(300)} style={styles.kycPlaceholderCard}>
              <MaterialCommunityIcons name="gold" size={56} color="#D4AF37" style={{ marginBottom: 12 }} />
              <Text style={styles.kycPlaceholderTitle}>Investment Scheme Coming Soon</Text>
              <Text style={styles.kycPlaceholderDesc}>
                We are launching our Digital Gold Investment scheme very soon! You will be able to buy, sell, and redeem BIS-hallmarked 24K gold directly from your mobile app.
              </Text>
            </Reanimated.View>
          ) : (
            <>
              {/* Gold Vault Balance Header Card */}
              <View style={styles.vaultContainer}>
                <View style={styles.vaultCard}>
                  <View style={styles.vaultCardHeader}>
                    <MaterialCommunityIcons name="gold" size={26} color="#D4AF37" />
                    <Text style={styles.vaultCardTitle}>Gold Vault Balance</Text>
                  </View>
                  <Text style={styles.vaultGrams}>{(balance.goldGrams || 0).toFixed(4)} g</Text>
                  <Text style={styles.vaultValue}>Worth: ₹{Math.round((balance.goldGrams || 0) * goldRateGram).toLocaleString('en-IN')}</Text>
                  <Text style={styles.vaultRate}>Live Gold Rate: ₹{Math.round(goldRateGram)}/g</Text>
                </View>
              </View>

              {!user ? (
                <View style={styles.kycPlaceholderCard}>
                  <Ionicons name="lock-closed" size={48} color="#D4AF37" style={{ marginBottom: 12 }} />
                  <Text style={styles.kycPlaceholderTitle}>Secure Account Required</Text>
                  <Text style={styles.kycPlaceholderDesc}>
                    To view balances, invest in digital gold, or request physical delivery, please sign in or register a free secure account.
                  </Text>
                </View>
              ) : showKycTrigger && kycStatus !== 'approved' ? (
                renderKycInterface()
              ) : (
                <>
                  {activeSegment === 'buy' && (
                    <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                      <Text style={styles.sectionTitle}>Invest in Gold</Text>
                      <Text style={styles.sectionDesc}>Enter the amount in INR to buy 24K pure digital gold. The equivalent gold weight will be added to your vault via secure online payment.</Text>

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
                            <Text style={styles.breakdownVal}>24K (99.9%) Gold</Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>Live rate per gram</Text>
                            <Text style={styles.breakdownVal}>₹{Math.round(goldRateGram)}</Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>Subtotal (incl. 3% GST)</Text>
                            <Text style={styles.breakdownVal}>₹{parseFloat(buyAmount).toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}>Gateway Charges (2%)</Text>
                            <Text style={styles.breakdownVal}>₹{Math.round(parseFloat(buyAmount) * 0.02).toLocaleString('en-IN')}</Text>
                          </View>
                          <View style={styles.divider} />
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownText}><Text style={{ fontWeight: 'bold', color: '#1C1C1E' }}>Total Payable Amount</Text></Text>
                            <Text style={styles.breakdownVal}><Text style={{ fontWeight: 'bold', color: '#D4AF37' }}>₹{Math.round(parseFloat(buyAmount) * 1.02).toLocaleString('en-IN')}</Text></Text>
                          </View>
                          <View style={styles.divider} />
                          <View style={styles.breakdownRow}>
                            <Text style={styles.estimatedGramsLabel}>Estimated Gold Weight Added</Text>
                            <Text style={styles.estimatedGramsVal}>{getCalculatedGrams()} grams</Text>
                          </View>
                        </View>
                      )}

                      <TouchableOpacity style={styles.buyBtn} onPress={handleBuy}>
                        <Text style={styles.buyBtnText}>PAY WITH RAZORPAY</Text>
                      </TouchableOpacity>
                    </Reanimated.View>
                  )}

                  {activeSegment === 'sell' && (
                    <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                      <Text style={styles.sectionTitle}>Sell Digital Gold</Text>
                      <Text style={styles.sectionDesc}>Sell gold from your vault at the live rate. Funds will be transferred to your bank account after verification.</Text>

                      {/* Info Card: Tax disclaimer */}
                      <View style={[styles.resellCard, { marginBottom: 16 }]}>
                        <Text style={{ fontSize: 11, color: '#FF3B30', fontWeight: 'bold', marginBottom: 4 }}>Tax and Rate Note:</Text>
                        <Text style={{ fontSize: 11, color: '#666666', lineHeight: 15 }}>
                          The 3% GST paid during purchase is a government tax and is non-refundable. Payout value is calculated as <Text style={{ fontWeight: 'bold' }}>Weight × Live Gold Rate</Text> (excluding GST).
                        </Text>
                      </View>

                      {/* Weight Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Weight to Sell (Grams)</Text>
                        <TextInput
                          placeholder="e.g. 0.5, 1, 2"
                          placeholderTextColor="rgba(28,28,30,0.3)"
                          keyboardType="numeric"
                          style={styles.textInput}
                          value={sellGrams}
                          onChangeText={setSellGrams}
                        />
                      </View>

                      {/* Live calculation breakdown */}
                      {(() => {
                        const gramsNum = parseFloat(sellGrams) || 0;
                        const goldRate = rates ? (rates.gold24K / 10) : 0;
                        const payoutVal = gramsNum * goldRate;

                        return (
                          <View style={[styles.breakdownBox, { marginBottom: 14 }]}>
                            <View style={styles.breakdownRow}>
                              <Text style={styles.breakdownText}>Live Gold Rate/g</Text>
                              <Text style={styles.breakdownVal}>₹{Math.round(goldRate)}</Text>
                            </View>
                            <View style={styles.breakdownRow}>
                              <Text style={styles.breakdownText}>Metal Value (Rate × Weight)</Text>
                              <Text style={styles.breakdownVal}>₹{Math.round(payoutVal).toLocaleString('en-IN')}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.breakdownRow}>
                              <Text style={styles.estimatedGramsLabel}>Total Payout (No GST)</Text>
                              <Text style={styles.estimatedGramsVal}>₹{Math.round(payoutVal).toLocaleString('en-IN')}</Text>
                            </View>
                          </View>
                        );
                      })()}

                      {/* Payout Mode Selector */}
                      <Text style={styles.inputLabel}>Payout Bank Method</Text>
                      <View style={styles.metalSelectionRow}>
                        <TouchableOpacity 
                          style={[styles.metalBtn, sellPaymentMethod === 'UPI' && styles.activeMetalBtnDark]}
                          onPress={() => setSellPaymentMethod('UPI')}
                        >
                          <Text style={[styles.metalBtnText, sellPaymentMethod === 'UPI' && styles.activeMetalBtnText]}>UPI Payout</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.metalBtn, sellPaymentMethod === 'Bank' && styles.activeMetalBtnDark]}
                          onPress={() => setSellPaymentMethod('Bank')}
                        >
                          <Text style={[styles.metalBtnText, sellPaymentMethod === 'Bank' && styles.activeMetalBtnText]}>Bank Transfer</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Conditional forms based on payout method */}
                      {sellPaymentMethod === 'UPI' ? (
                        <View style={styles.deliveryForm}>
                          <Text style={styles.formTitle}>UPI Details</Text>
                          <TextInput
                            placeholder="Enter UPI ID (e.g., name@okaxis)"
                            placeholderTextColor="rgba(28,28,30,0.3)"
                            autoCapitalize="none"
                            style={styles.formInput}
                            value={sellBankDetails.upiId}
                            onChangeText={(val) => setSellBankDetails({ ...sellBankDetails, upiId: val })}
                          />
                        </View>
                      ) : (
                        <View style={styles.deliveryForm}>
                          <Text style={styles.formTitle}>Bank Account Details</Text>
                          <TextInput
                            placeholder="Account Holder's Name"
                            placeholderTextColor="rgba(28,28,30,0.3)"
                            style={styles.formInput}
                            value={sellBankDetails.accountHolder}
                            onChangeText={(val) => setSellBankDetails({ ...sellBankDetails, accountHolder: val })}
                          />
                          <TextInput
                            placeholder="Bank Name"
                            placeholderTextColor="rgba(28,28,30,0.3)"
                            style={styles.formInput}
                            value={sellBankDetails.bankName}
                            onChangeText={(val) => setSellBankDetails({ ...sellBankDetails, bankName: val })}
                          />
                          <TextInput
                            placeholder="Account Number"
                            placeholderTextColor="rgba(28,28,30,0.3)"
                            keyboardType="numeric"
                            style={styles.formInput}
                            value={sellBankDetails.accountNumber}
                            onChangeText={(val) => setSellBankDetails({ ...sellBankDetails, accountNumber: val })}
                          />
                          <TextInput
                            placeholder="IFSC Code"
                            placeholderTextColor="rgba(28,28,30,0.3)"
                            autoCapitalize="characters"
                            style={styles.formInput}
                            value={sellBankDetails.ifscCode}
                            onChangeText={(val) => setSellBankDetails({ ...sellBankDetails, ifscCode: val })}
                          />
                        </View>
                      )}

                      <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#FF3B30', marginTop: 10 }]} onPress={handleSell}>
                        <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>CONFIRM SELL & PAYOUT</Text>
                      </TouchableOpacity>
                    </Reanimated.View>
                  )}

                  {activeSegment === 'redeem' && (
                    <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                      <Text style={styles.sectionTitle}>Redeem Physical Gold Coins</Text>
                      <Text style={styles.sectionDesc}>Redeem your accumulated vault balance directly as physical BIS Hallmarked gold coins. We deduct the equivalent grams from your vault.</Text>

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

                      {/* Redemption Mode - In-Store Pickup Only */}
                      <Text style={[styles.inputLabel, { marginTop: 12 }]}>Redemption Mode</Text>
                      <View style={styles.pickupStoreBox}>
                        <Ionicons name="location" size={20} color="#D4AF37" style={{ marginBottom: 4 }} />
                        <Text style={styles.pickupStoreTitle}>In-Store Pickup (Amraiwadi Showroom)</Text>
                        <Text style={styles.pickupStoreDesc}>
                          Choksi Bazar, Azad Chowk, Amraiwadi, Ahmedabad.
                          {"\n"}
                          Hours: 10:00 AM - 8:30 PM (Closed on Sundays)
                        </Text>
                      </View>

                      <TouchableOpacity style={[styles.buyBtn, { backgroundColor: '#D4AF37' }]} onPress={handleRedeem}>
                        <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>CONFIRM REDEMPTION</Text>
                      </TouchableOpacity>
                    </Reanimated.View>
                  )}

                  {activeSegment === 'history' && (
                    <Reanimated.View entering={FadeInDown.duration(300)} style={styles.section}>
                      <Text style={styles.sectionTitle}>Vault Transaction Logs</Text>
                      {(!balance.transactions || balance.transactions.length === 0) ? (
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
                            <TouchableOpacity 
                              style={styles.receiptLink}
                              onPress={() => setSelectedTx(tx)}
                            >
                              <Ionicons name="document-text" size={14} color="#D4AF37" />
                              <Text style={styles.receiptLinkText}>View Receipt</Text>
                            </TouchableOpacity>
                          </View>
                        ))
                      )}
                    </Reanimated.View>
                  )}
                </>
              )}
            </>
          )}

        </ScrollView>

      {/* Razorpay WebView Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        onRequestClose={() => {
          setShowPaymentModal(false);
          Alert.alert("Payment Cancelled", "Payment process was cancelled.");
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1C1C1E' }}>Secure Payment Gateway</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowPaymentModal(false);
                Alert.alert("Payment Cancelled", "Payment process was cancelled.");
              }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: paymentHtml }}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            androidHardwareAccelerationDisabled={false}
            scalesPageToFit={true}
            style={{ flex: 1 }}
          />
        </SafeAreaView>
      </Modal>


      {/* Receipt Modal */}
      <Modal
        visible={!!selectedTx}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalContainer}>
            <View style={styles.receiptHeader}>
              <MaterialCommunityIcons name="gold" size={28} color="#D4AF37" />
              <Text style={styles.receiptHeaderTitle}>Brahmani Jewellers</Text>
              <Text style={styles.receiptHeaderSubtitle}>Digital Vault Settlement Receipt</Text>
            </View>

            {selectedTx && (() => {
              const baseAmt = selectedTx.amount / 1.03;
              const taxAmt = selectedTx.amount - baseAmt;
              return (
                <ScrollView contentContainerStyle={styles.receiptContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>Transaction Date</Text>
                    <Text style={styles.receiptValue}>{new Date(selectedTx.createdAt || Date.now()).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>Transaction Type</Text>
                    <Text style={[styles.receiptValue, { fontWeight: 'bold', color: selectedTx.type === 'BUY' ? '#2ecc71' : selectedTx.type === 'SELL' ? '#e74c3c' : '#3498db' }]}>
                      {selectedTx.type} {selectedTx.metal}
                    </Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>Reference ID</Text>
                    <Text style={[styles.receiptValue, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12 }]}>{selectedTx.paymentReference || 'N/A'}</Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>Gold Weight</Text>
                    <Text style={[styles.receiptValue, { fontWeight: 'bold' }]}>{selectedTx.grams?.toFixed(4)} g</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>Gold Rate / Gram</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(selectedTx.ratePerGram || 0).toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>Base Amount</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(baseAmt).toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.receiptDetailRow}>
                    <Text style={styles.receiptLabel}>GST (3%)</Text>
                    <Text style={styles.receiptValue}>₹{Math.round(taxAmt).toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.receiptDivider} />

                  <View style={styles.receiptDetailRow}>
                    <Text style={[styles.receiptLabel, { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E' }]}>Total Paid</Text>
                    <Text style={[styles.receiptValue, { fontSize: 16, fontWeight: 'bold', color: '#D4AF37' }]}>₹{Math.round(selectedTx.amount).toLocaleString('en-IN')}</Text>
                  </View>
                </ScrollView>
              );
            })()}

            <TouchableOpacity 
              style={styles.closeReceiptBtn} 
              onPress={() => setSelectedTx(null)}
            >
              <Text style={styles.closeReceiptBtnText}>CLOSE RECEIPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FFFFFF', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { fontSize: 11, color: '#8E8E93', marginTop: 4, marginBottom: 14, fontWeight: '500' },
  
  segmentContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2, width: '100%' },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  activeSegmentBtn: { backgroundColor: '#1C1C1E' },
  segmentBtnText: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93' },
  activeSegmentBtnText: { color: '#FFFFFF' },

  container: { padding: 16, paddingBottom: 100 },
  vaultContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  vaultCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center'
  },
  vaultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  vaultCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#8E8E93', textTransform: 'uppercase' },
  vaultGrams: { fontSize: 26, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  vaultValue: { fontSize: 14, fontWeight: '600', color: '#D4AF37', marginBottom: 4 },
  vaultRate: { fontSize: 11, color: '#8E8E93', fontStyle: 'italic' },

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
  activeMetalBtnDark: { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  metalBtnText: { fontSize: 12, fontWeight: 'bold', color: '#8E8E93' },
  activeMetalBtnText: { color: '#FFFFFF' },

  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#1C1C1E', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  textInput: { height: 44, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 12, fontSize: 15, color: '#1C1C1E', backgroundColor: '#FFFFFF' },
  
  breakdownBox: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E5EA' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownText: { fontSize: 12, color: 'rgba(28,28,30,0.5)' },
  breakdownVal: { fontSize: 12, fontWeight: 'bold', color: '#1C1C1E' },
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 8 },
  estimatedGramsLabel: { fontSize: 13, fontWeight: 'bold', color: '#D4AF37' },
  estimatedGramsVal: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' },

  buyBtn: { backgroundColor: '#1C1C1E', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  buyBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },

  resellCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' },
  resellCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resellCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  resellCardDesc: { fontSize: 12, color: 'rgba(28,28,30,0.6)', lineHeight: 18 },
  resellUserId: { fontSize: 11, fontWeight: 'bold', color: '#D4AF37', marginTop: 10, textAlign: 'center' },

  pickupStoreBox: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 14, alignItems: 'center' },
  pickupStoreTitle: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  pickupStoreDesc: { fontSize: 12, color: 'rgba(28,28,30,0.6)', lineHeight: 18, textAlign: 'center' },

  deliveryForm: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 14 },
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  receiptModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#D4AF37',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 16
  },
  receiptHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 6,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif'
  },
  receiptHeaderSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  receiptContent: {
    paddingVertical: 10
  },
  receiptDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
    alignItems: 'center'
  },
  receiptLabel: {
    fontSize: 13,
    color: 'rgba(28,28,30,0.5)'
  },
  receiptValue: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '500'
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12
  },
  closeReceiptBtn: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  closeReceiptBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 0.5
  },
  receiptLink: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    marginTop: 8, 
    alignSelf: 'flex-start' 
  },
  receiptLinkText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#D4AF37' 
  },
});

const generateRazorpayHtml = (key: string, amount: number, currency: string, orderId: string, name: string, contact: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://checkout.razorpay.com" crossorigin>
      <link rel="dns-prefetch" href="https://checkout.razorpay.com">
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #D4AF37;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .message {
          margin-top: 20px;
          font-size: 15px;
          font-weight: 500;
          color: #1C1C1E;
        }
      </style>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <div class="loader-container">
        <div class="loader"></div>
        <div class="message" id="msg">Initializing secure payment...</div>
      </div>

      <script>
        const options = {
          key: "${key}",
          amount: ${amount},
          currency: "${currency}",
          name: "Brahmani Jewellers",
          description: "Luxury Gold Investment",
          order_id: "${orderId}",
          handler: function (response) {
            document.getElementById('msg').innerText = "Payment successful! Verifying transaction...";
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'success',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }));
          },
          prefill: {
            name: "${name}",
            contact: "${contact}",
            email: "${email}"
          },
          theme: {
            color: "#1C1C1E"
          },
          modal: {
            ondismiss: function () {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'cancelled'
              }));
            }
          }
        };

        window.onload = function() {
          try {
            const rzp = new Razorpay(options);
            rzp.on('payment.failed', function (response){
              window.ReactNativeWebView.postMessage(JSON.stringify({
                status: 'failed',
                error: response.error
              }));
            });
            rzp.open();
          } catch (err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              status: 'error',
              message: err.message
            }));
          }
        };
      </script>
    </body>
    </html>
  `;
};
