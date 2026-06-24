import { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Image, Modal, Alert, Linking, TextInput, Animated, Platform } from 'react-native';
import { FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import axios from 'axios';

const API_URL = 'https://brahmani-jewellers-api.onrender.com/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'profile', 'orders', 'about', 'admin'

  // Modals state
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Bank Details States (Visible to all users)
  const [bankName, setBankName] = useState('HDFC Bank');
  const [bankAccountName, setBankAccountName] = useState('Brahmani Jewellers');
  const [bankAccountNumber, setBankAccountNumber] = useState('50200081273891');
  const [bankIfsc, setBankIfsc] = useState('HDFC0001203');
  const [bankBranch, setBankBranch] = useState('Amraiwadi, Ahmedabad');

  // Admin Panel states
  const [adminOrders, setAdminOrders] = useState([]);
  const [loadingAdminOrders, setLoadingAdminOrders] = useState(false);
  const [gold24kInput, setGold24kInput] = useState('');
  const [gold22kInput, setGold22kInput] = useState('');
  const [gold18kInput, setGold18kInput] = useState('');
  const [silverInput, setSilverInput] = useState('');
  const [updatingRates, setUpdatingRates] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);

  // Push Notification States
  const [notiTitle, setNotiTitle] = useState('');
  const [notiBody, setNotiBody] = useState('');
  const [sendingNoti, setSendingNoti] = useState(false);

  // Admin Bank inputs
  const [bankNameInput, setBankNameInput] = useState('');
  const [bankAccountNameInput, setBankAccountNameInput] = useState('');
  const [bankAccountNumberInput, setBankAccountNumberInput] = useState('');
  const [bankIfscInput, setBankIfscInput] = useState('');
  const [bankBranchInput, setBankBranchInput] = useState('');

  const handleLogoutPress = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  const fetchRatesAndBankDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/rates`);
      if (response.data) {
        setBankName(response.data.bankName || 'HDFC Bank');
        setBankAccountName(response.data.bankAccountName || 'Brahmani Jewellers');
        setBankAccountNumber(response.data.bankAccountNumber || '50200081273891');
        setBankIfsc(response.data.bankIfsc || 'HDFC0001203');
        setBankBranch(response.data.bankBranch || 'Amraiwadi, Ahmedabad');

        // Admin inputs pre-fill
        setGold24kInput(String(response.data.gold24K || ''));
        setGold22kInput(String(response.data.gold22K || ''));
        setGold18kInput(String(response.data.gold18K || ''));
        setSilverInput(String(response.data.silver90 || response.data.silver || ''));

        setBankNameInput(response.data.bankName || 'HDFC Bank');
        setBankAccountNameInput(response.data.bankAccountName || 'Brahmani Jewellers');
        setBankAccountNumberInput(response.data.bankAccountNumber || '50200081273891');
        setBankIfscInput(response.data.bankIfsc || 'HDFC0001203');
        setBankBranchInput(response.data.bankBranch || 'Amraiwadi, Ahmedabad');
      }
    } catch (error) {
      console.error('Error fetching rates & bank details:', error);
    }
  };

  const fetchAdminOrders = async () => {
    setLoadingAdminOrders(true);
    try {
      const response = await axios.get(`${API_URL}/admin/orders`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setAdminOrders(response.data || []);

      // Fetch analytics count
      const analyticsRes = await axios.get(`${API_URL}/analytics`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (analyticsRes.data) {
        setVisitorCount(analyticsRes.data.views || 0);
      }
    } catch (error) {
      console.error('Error fetching admin orders/analytics:', error);
    } finally {
      setLoadingAdminOrders(false);
    }
  };


  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    fetchRatesAndBankDetails();
  }, []);

  useEffect(() => {
    if (user && user.token) {
      fetchOrders();
      if (user.role === 'admin') {
        fetchAdminOrders();
      }
    } else {
      setOrders([]);
      setAdminOrders([]);
    }
  }, [user]);

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

  const handleUpdateRates = async () => {
    if (!gold24kInput || !gold22kInput || !gold18kInput || !silverInput) {
      Alert.alert("Error", "Please fill in all rate fields.");
      return;
    }
    setUpdatingRates(true);
    try {
      const response = await axios.post(`${API_URL}/rates`, {
        isManual: true,
        manualGold24K: Number(gold24kInput),
        manualGold22K: Number(gold22kInput),
        manualGold18K: Number(gold18kInput),
        manualSilver90: Number(silverInput),
        bankName: bankNameInput,
        bankAccountName: bankAccountNameInput,
        bankAccountNumber: bankAccountNumberInput,
        bankIfsc: bankIfscInput,
        bankBranch: bankBranchInput
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (response.data) {
        setBankName(response.data.bankName);
        setBankAccountName(response.data.bankAccountName);
        setBankAccountNumber(response.data.bankAccountNumber);
        setBankIfsc(response.data.bankIfsc);
        setBankBranch(response.data.bankBranch);
      }
      Alert.alert("Success", "Live market rates and bank details updated successfully!");
    } catch (error) {
      console.error('Error updating rates:', error);
      Alert.alert("Error", "Failed to update rates/bank details.");
    } finally {
      setUpdatingRates(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notiTitle.trim() || !notiBody.trim()) {
      Alert.alert("Error", "Please fill in both title and message body.");
      return;
    }
    setSendingNoti(true);
    try {
      await axios.post(`${API_URL}/notifications/send`, {
        title: notiTitle.trim(),
        body: notiBody.trim()
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success 🎉", "Push notification broadcasted successfully to all devices!");
      setNotiTitle('');
      setNotiBody('');
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      Alert.alert("Error", error.response?.data?.message || "Failed to send notification.");
    } finally {
      setSendingNoti(false);
    }
  };

  const handleChangeOrderStatus = async (orderId) => {
    Alert.alert(
      "Update Status",
      "Choose new status for this order:",
      [
        { text: "Pending", onPress: () => updateStatus(orderId, "Pending") },
        { text: "Processing", onPress: () => updateStatus(orderId, "Processing") },
        { text: "Shipped", onPress: () => updateStatus(orderId, "Shipped") },
        { text: "Delivered", onPress: () => updateStatus(orderId, "Delivered") },
        { text: "Cancelled", style: "destructive", onPress: () => updateStatus(orderId, "Cancelled") },
        { text: "Close", style: "cancel" }
      ]
    );
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/admin/orders/${orderId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      Alert.alert("Success", `Order status updated to ${newStatus}`);
      fetchAdminOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const initiateWhatsApp = () => {
    const message = "Hello Brahmani Jewellers! I would like to consult about a custom design.";
    const url = `https://wa.me/917621967577?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "WhatsApp is not installed on your phone.");
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>
        <View style={styles.guestContainer}>
          <FontAwesome name="lock" size={80} color="#EBA938" style={{ marginBottom: 20 }} />
          <Text style={styles.guestTitle}>Guest Account</Text>
          <Text style={styles.guestDesc}>Login to save designs, track orders, view bank transfer details, and receive personalized notifications.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>LOGIN TO ACCOUNT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarBg}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>

          {/* ADMIN CONTROL PANEL (Collapsible, only for role === 'admin') */}
          {user.role === 'admin' && (
            <>
              <TouchableOpacity 
                style={[styles.menuRow, { backgroundColor: 'rgba(235, 169, 56, 0.1)', paddingHorizontal: 12, borderRadius: 8, marginVertical: 4 }]} 
                onPress={() => setActiveSection(activeSection === 'admin' ? null : 'admin')}
              >
                <MaterialCommunityIcons name="security" size={24} color="#EBA938" />
                <Text style={[styles.menuRowText, { fontWeight: 'bold' }]}>Admin Control Panel</Text>
                <Ionicons name={activeSection === 'admin' ? "chevron-up" : "chevron-down"} size={18} color="#3D2B1F" />
              </TouchableOpacity>

              {activeSection === 'admin' && (
                <View style={[styles.expandedContent, { borderColor: '#EBA938', borderWidth: 1 }]}>
                  {/* WEBSITE TRAFFIC STATS */}
                  <Text style={styles.adminSectionTitle}>Website Traffic</Text>
                  <View style={{ backgroundColor: 'rgba(235, 169, 56, 0.1)', padding: 16, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: 'rgba(61,43,31,0.6)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Total Unique Visitors</Text>
                    <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#EBA938', marginTop: 4, fontFamily: Platform.OS === 'android' ? 'serif' : 'Georgia' }}>{visitorCount}</Text>
                    <Text style={{ fontSize: 9, color: 'rgba(61,43,31,0.4)', marginTop: 4 }}>Live session-based counter</Text>
                  </View>

                  {/* 1. UPDATE RATES */}
                  <Text style={styles.adminSectionTitle}>Live Market Rates (INR)</Text>
                  
                  <View style={styles.adminInputRow}>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Gold 24K</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={gold24kInput}
                        onChangeText={setGold24kInput}
                        keyboardType="numeric"
                        placeholder="Gold 24K"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Gold 22K</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={gold22kInput}
                        onChangeText={setGold22kInput}
                        keyboardType="numeric"
                        placeholder="Gold 22K"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                  </View>

                  <View style={styles.adminInputRow}>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Gold 18K</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={gold18kInput}
                        onChangeText={setGold18kInput}
                        keyboardType="numeric"
                        placeholder="Gold 18K"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Silver (1kg)</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={silverInput}
                        onChangeText={setSilverInput}
                        keyboardType="numeric"
                        placeholder="Silver"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                  </View>

                  {/* BANK DETAILS SECTION */}
                  <Text style={[styles.adminSectionTitle, { marginTop: 16 }]}>Official Bank Details</Text>

                  <View style={styles.adminInputRow}>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Bank Name</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={bankNameInput}
                        onChangeText={setBankNameInput}
                        placeholder="Bank Name"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Account Name</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={bankAccountNameInput}
                        onChangeText={setBankAccountNameInput}
                        placeholder="Account Name"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                  </View>

                  <View style={styles.adminInputRow}>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>Account Number</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={bankAccountNumberInput}
                        onChangeText={setBankAccountNumberInput}
                        placeholder="Account Number"
                        keyboardType="numeric"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                    <View style={styles.adminInputCol}>
                      <Text style={styles.adminInputLabel}>IFSC Code</Text>
                      <TextInput 
                        style={styles.adminTextInput}
                        value={bankIfscInput}
                        onChangeText={setBankIfscInput}
                        placeholder="IFSC Code"
                        placeholderTextColor="rgba(61,43,31,0.3)"
                      />
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.adminInputLabel}>Branch Name</Text>
                    <TextInput 
                      style={styles.adminTextInput}
                      value={bankBranchInput}
                      onChangeText={setBankBranchInput}
                      placeholder="Branch Name"
                      placeholderTextColor="rgba(61,43,31,0.3)"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.adminBtn, updatingRates && { opacity: 0.7 }]}
                    onPress={handleUpdateRates}
                    disabled={updatingRates}
                  >
                    <Text style={styles.adminBtnText}>{updatingRates ? 'UPDATING...' : 'UPDATE RATES & BANK DETAILS'}</Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.adminDivider} />

                  {/* SEND PUSH NOTIFICATION */}
                  <Text style={styles.adminSectionTitle}>Send Push Notification Broadcast</Text>
                  
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.adminInputLabel}>Notification Title</Text>
                    <TextInput 
                      style={styles.adminTextInput}
                      value={notiTitle}
                      onChangeText={setNotiTitle}
                      placeholder="Enter title (e.g. Special Offer! 🌟)"
                      placeholderTextColor="rgba(61,43,31,0.3)"
                    />
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.adminInputLabel}>Notification Message / Body</Text>
                    <TextInput 
                      style={[styles.adminTextInput, { height: 80, textAlignVertical: 'top' }]}
                      value={notiBody}
                      onChangeText={setNotiBody}
                      multiline={true}
                      numberOfLines={3}
                      placeholder="Enter notification message details..."
                      placeholderTextColor="rgba(61,43,31,0.3)"
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.adminBtn, { backgroundColor: '#EBA938' }, sendingNoti && { opacity: 0.7 }]}
                    onPress={handleSendNotification}
                    disabled={sendingNoti}
                  >
                    <Text style={styles.adminBtnText}>{sendingNoti ? 'SENDING...' : 'BROADCAST NOTIFICATION'}</Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.adminDivider} />

                  {/* 2. CUSTOMER ORDERS */}
                  <Text style={styles.adminSectionTitle}>Customer Orders ({adminOrders.length})</Text>
                  
                  {loadingAdminOrders ? (
                    <ActivityIndicator size="small" color="#EBA938" style={{ marginVertical: 10 }} />
                  ) : adminOrders.length === 0 ? (
                    <Text style={styles.noOrdersText}>No customer orders yet.</Text>
                  ) : (
                    adminOrders.map((order) => (
                      <View key={order._id} style={styles.adminOrderItem}>
                        <View style={styles.adminOrderHeader}>
                          <Text style={styles.adminOrderId}>ID: {order._id.substring(16).toUpperCase()}</Text>
                          <Text style={styles.adminOrderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</Text>
                        </View>
                        
                        <Text style={styles.adminOrderUser}>Customer: {order.user?.name || 'Unknown'}</Text>
                        <Text style={styles.adminOrderPhone}>Phone: {order.user?.mobile || 'N/A'}</Text>
                        
                        <View style={styles.adminOrderFooter}>
                          <TouchableOpacity 
                            style={styles.adminStatusBadge}
                            onPress={() => handleChangeOrderStatus(order._id)}
                          >
                            <Text style={styles.adminStatusText}>{order.status} ⚙️</Text>
                          </TouchableOpacity>
                          <Text style={styles.adminOrderTotal}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </>
          )}

          {/* PROFILE DETAILS (Collapsible) */}
          <TouchableOpacity 
            style={styles.menuRow} 
            onPress={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
          >
          <Ionicons name="person-circle-outline" size={24} color="#EBA938" />
          <Text style={styles.menuRowText}>My Profile Details</Text>
          <Ionicons name={activeSection === 'profile' ? "chevron-up" : "chevron-down"} size={18} color="#3D2B1F" />
        </TouchableOpacity>

        {activeSection === 'profile' && (
          <View style={styles.expandedContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
            <Text style={styles.infoLabel}>Email Address</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
            {user.mobile && (
              <>
                <Text style={styles.infoLabel}>Mobile Number</Text>
                <Text style={styles.infoValue}>{user.mobile}</Text>
              </>
            )}
            <Text style={styles.infoLabel}>Account Role</Text>
            <Text style={styles.infoValue}>{user.role || 'customer'}</Text>
          </View>
        )}

        {/* ORDER HISTORY (Collapsible) */}
        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => setActiveSection(activeSection === 'orders' ? null : 'orders')}
        >
          <Ionicons name="receipt-outline" size={24} color="#EBA938" />
          <Text style={styles.menuRowText}>Order History</Text>
          <Ionicons name={activeSection === 'orders' ? "chevron-up" : "chevron-down"} size={18} color="#3D2B1F" />
        </TouchableOpacity>

        {activeSection === 'orders' && (
          <View style={styles.expandedContent}>
            {loadingOrders ? (
              <ActivityIndicator size="small" color="#EBA938" />
            ) : orders.length === 0 ? (
              <Text style={styles.noOrdersText}>You haven't placed any orders yet.</Text>
            ) : (
              orders.map((order) => (
                <View key={order._id} style={styles.orderItem}>
                  <View style={styles.orderItemTop}>
                    <Text style={styles.orderId}>ID: {order._id.substring(16).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <View style={styles.orderItemBottom}>
                    <Text style={[styles.orderStatus, { color: order.status === 'Delivered' ? '#2ecc71' : '#EBA938' }]}>{order.status}</Text>
                    <Text style={styles.orderTotal}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ABOUT US (Collapsible) */}
        <TouchableOpacity 
          style={styles.menuRow} 
          onPress={() => setActiveSection(activeSection === 'about' ? null : 'about')}
        >
          <Ionicons name="information-circle-outline" size={24} color="#EBA938" />
          <Text style={styles.menuRowText}>About Brahmani Jewellers</Text>
          <Ionicons name={activeSection === 'about' ? "chevron-up" : "chevron-down"} size={18} color="#3D2B1F" />
        </TouchableOpacity>

        {activeSection === 'about' && (
          <View style={styles.expandedContent}>
            <Text style={styles.aboutTitle}>Legacy of Purity & Trust</Text>
            <Text style={styles.aboutText}>
              Celebrating over 35 years of excellence, trust, and timeless craftsmanship. Founded in 1992, Brahmani Jewellers specializes in 100% pure BIS Hallmarked gold and silver masterpieces.
            </Text>
            <Text style={styles.aboutContactTitle}>Showroom Contact Details:</Text>
            <Text style={styles.aboutContactText}>📞 +91 99258 11771</Text>
            <Text style={styles.aboutContactText}>📧 info.brahmanijewellers@gmail.com</Text>
            <Text style={styles.aboutContactText}>📍 Choksi Bazar, Azad Chowk, Amraiwadi, Ahmedabad</Text>
          </View>
        )}

        {/* BANK DETAILS */}
        <TouchableOpacity style={styles.menuRow} onPress={() => setShowBankDetails(true)}>
          <MaterialCommunityIcons name="bank-outline" size={24} color="#EBA938" />
          <Text style={styles.menuRowText}>Bank Details</Text>
          <Ionicons name="chevron-forward" size={18} color="#3D2B1F" />
        </TouchableOpacity>

        {/* NOTIFICATION */}
        <TouchableOpacity style={styles.menuRow} onPress={() => setShowNotifications(true)}>
          <Ionicons name="notifications-outline" size={24} color="#EBA938" />
          <Text style={styles.menuRowText}>Notification</Text>
          <Ionicons name="chevron-forward" size={18} color="#3D2B1F" />
        </TouchableOpacity>

        {/* CONTACT US */}
        <TouchableOpacity style={styles.menuRow} onPress={initiateWhatsApp}>
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
          <Text style={styles.menuRowText}>Contact Us (WhatsApp)</Text>
          <Ionicons name="chevron-forward" size={18} color="#3D2B1F" />
        </TouchableOpacity>

        {/* LOGOUT */}
        <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={handleLogoutPress}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={[styles.menuRowText, { color: '#FF6B6B' }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={18} color="#FF6B6B" />
        </TouchableOpacity>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* LEGAL LINKS */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => setShowTerms(true)}>
            <Text style={styles.legalLink}>Terms & Conditions</Text>
          </TouchableOpacity>
          <Text style={styles.legalSeparator}>|</Text>
          <TouchableOpacity onPress={() => setShowPrivacy(true)}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BANK DETAILS MODAL */}
      <Modal visible={showBankDetails} transparent={true} animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Official Bank Details</Text>
            <View style={styles.bankDetailContainer}>
              <Text style={styles.bankLabel}>Bank Name:</Text>
              <Text style={styles.bankValue}>{bankName}</Text>
              <Text style={styles.bankLabel}>Account Name:</Text>
              <Text style={styles.bankValue}>{bankAccountName}</Text>
              <Text style={styles.bankLabel}>Account Number:</Text>
              <Text style={styles.bankValue}>{bankAccountNumber}</Text>
              <Text style={styles.bankLabel}>IFSC Code:</Text>
              <Text style={styles.bankValue}>{bankIfsc}</Text>
              <Text style={styles.bankLabel}>Branch:</Text>
              <Text style={styles.bankValue}>{bankBranch}</Text>
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
                <Text style={{ fontWeight: 'bold' }}>1. Physical Jewellery</Text>
                {"\n"}
                All physical jewellery products purchased are subject to actual store policies and +/- 5% weight variance upon final billing.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Digital Gold Investment</Text>
                {"\n"}
                Digital gold purchased will be held securely in your gold vault. Prices include live market gold rates plus 3% GST. Confirmed digital transactions are final and cannot be cancelled or refunded online.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. Identity Verification (KYC)</Text>
                {"\n"}
                Submission of a valid PAN and Aadhaar number is mandatory for compliance with government jewelry and anti-money laundering (AML) regulations before making vault purchases or requesting coin redemptions.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>4. Physical Redemption & Delivery</Text>
                {"\n"}
                Redeeming vault balance as physical coins is subject to KYC approval. Delivery charges are calculated based on store distance, and identity verification is required at delivery.
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
                <Text style={{ fontWeight: 'bold' }}>1. Personal Information</Text>
                {"\n"}
                We collect minimal details (Name, Email, Mobile) required to process orders, verify accounts, and customize your app experience.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>2. Document & KYC Security</Text>
                {"\n"}
                Your document details (PAN Card and Aadhaar numbers) provided for KYC verification are encrypted, stored securely, and used solely for regulatory compliance. They will never be shared with third parties except as required by law.
                {"\n\n"}
                <Text style={{ fontWeight: 'bold' }}>3. Secure Payments</Text>
                {"\n"}
                We do not store credit card or net banking details on our servers. All transactions are processed through highly secure payment systems.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacy(false)}>
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { padding: 16, backgroundColor: '#FAF9F6', alignItems: 'center', paddingTop: 24, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  container: { padding: 20, paddingBottom: 100 },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#FFFFFF' },
  guestTitle: { fontSize: 22, fontWeight: 'bold', color: '#1C1C1E', marginVertical: 12, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  guestDesc: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  loginBtn: { backgroundColor: '#1C1C1E', paddingVertical: 16, width: '100%', borderRadius: 8, alignItems: 'center' },
  loginBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  
  userCard: { flexDirection: 'row', backgroundColor: '#FAF9F6', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#E5E5EA' },
  avatarBg: { backgroundColor: '#D4AF37', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
  userInfo: { marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1C1C1E', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  userEmail: { fontSize: 14, color: '#8E8E93' },
  
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  menuRowText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#1C1C1E', fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  expandedContent: { backgroundColor: '#FAF9F6', padding: 16, borderRadius: 12, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: '#E5E5EA' },
  
  infoLabel: { fontSize: 11, fontWeight: 'bold', color: '#8E8E93', textTransform: 'uppercase', marginTop: 8 },
  infoValue: { fontSize: 15, color: '#1C1C1E', fontWeight: '600', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  noOrdersText: { fontSize: 13, color: '#8E8E93', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  orderItem: { borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingVertical: 10 },
  orderItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  orderDate: { fontSize: 12, color: '#8E8E93' },
  orderItemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderStatus: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  
  aboutTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  aboutText: { fontSize: 14, color: '#8E8E93', lineHeight: 20, marginBottom: 12 },
  aboutContactTitle: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E', marginTop: 10, marginBottom: 6 },
  aboutContactText: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  
  divider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 20 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  legalLink: { fontSize: 12, color: '#8E8E93', fontWeight: 'bold', textDecorationLine: 'underline' },
  legalSeparator: { fontSize: 12, color: '#E5E5EA' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBody: { backgroundColor: '#FFFFFF', width: '90%', borderRadius: 16, padding: 20, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1C1C1E', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingBottom: 10, marginBottom: 14, textAlign: 'center' },
  bankDetailContainer: { backgroundColor: '#FAF9F6', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E5EA' },
  bankLabel: { fontSize: 11, color: '#8E8E93', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 6 },
  bankValue: { fontSize: 14, color: '#1C1C1E', fontWeight: 'bold', marginBottom: 4 },
  modalCloseBtn: { backgroundColor: '#1C1C1E', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  modalCloseBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
  notiBox: { flexDirection: 'row', gap: 10, backgroundColor: '#FAF9F6', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: '#E5E5EA' },
  notiText: { fontSize: 13, color: '#1C1C1E', flex: 1, lineHeight: 18 },
  legalBodyText: { fontSize: 13, color: '#1C1C1E', lineHeight: 20 },
  adminSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1C1C1E', marginTop: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  adminInputRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  adminInputCol: { flex: 1 },
  adminInputLabel: { fontSize: 11, color: '#8E8E93', fontWeight: 'bold', marginBottom: 4 },
  adminTextInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#1C1C1E', fontWeight: 'bold' },
  adminBtn: { backgroundColor: '#1C1C1E', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  adminBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 },
  adminDivider: { height: 1, backgroundColor: '#E5E5EA', marginVertical: 16 },
  adminOrderItem: { backgroundColor: '#FAF9F6', padding: 12, borderRadius: 10, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#D4AF37' },
  adminOrderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  adminOrderId: { fontSize: 13, fontWeight: 'bold', color: '#1C1C1E' },
  adminOrderDate: { fontSize: 11, color: '#8E8E93' },
  adminOrderUser: { fontSize: 13, color: '#1C1C1E', fontWeight: '500' },
  adminOrderPhone: { fontSize: 12, color: '#8E8E93', marginVertical: 2 },
  adminOrderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTopWidth: 1, borderTopColor: '#E5E5EA', paddingTop: 8 },
  adminStatusBadge: { backgroundColor: '#1C1C1E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  adminStatusText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  adminOrderTotal: { fontSize: 14, fontWeight: 'bold', color: '#1C1C1E' }
});
