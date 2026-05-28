import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView, Image, Modal, Alert, Linking } from 'react-native';
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
  const [activeSection, setActiveSection] = useState(null); // 'profile', 'orders', 'about'

  // Modals state
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      fetchOrders();
    } else {
      setOrders([]);
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

  const initiateWhatsApp = () => {
    const message = "Hello Brahmani Jewellers! I would like to consult about a custom design.";
    const url = `https://wa.me/919925811771?text=${encodeURIComponent(message)}`;
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
        <TouchableOpacity style={[styles.menuRow, { borderBottomWidth: 0 }]} onPress={logout}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  header: { padding: 20, backgroundColor: '#3D2B1F', alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EBA938', letterSpacing: 1 },
  container: { padding: 20, paddingBottom: 50 },
  guestContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30, backgroundColor: '#FFF6E6' },
  guestTitle: { fontSize: 22, fontWeight: 'bold', color: '#3D2B1F', marginVertical: 12 },
  guestDesc: { fontSize: 14, color: 'rgba(61, 43, 31, 0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  loginBtn: { backgroundColor: '#3D2B1F', paddingVertical: 16, width: '100%', borderRadius: 8, alignItems: 'center' },
  loginBtnText: { color: '#FFF6E6', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
  
  userCard: { flexDirection: 'row', backgroundColor: '#FCF0DA', borderRadius: 16, padding: 18, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  avatarBg: { backgroundColor: '#EBA938', width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF6E6', fontSize: 24, fontWeight: 'bold' },
  userInfo: { marginLeft: 16 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#3D2B1F' },
  userEmail: { fontSize: 14, color: 'rgba(61, 43, 31, 0.6)' },
  
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(61, 43, 31, 0.08)' },
  menuRowText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#3D2B1F', fontWeight: '600' },
  expandedContent: { backgroundColor: '#FCF0DA', padding: 16, borderRadius: 12, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.1)' },
  
  infoLabel: { fontSize: 11, fontWeight: 'bold', color: 'rgba(61, 43, 31, 0.5)', textTransform: 'uppercase', marginTop: 8 },
  infoValue: { fontSize: 15, color: '#3D2B1F', fontWeight: '600', marginBottom: 4 },
  
  noOrdersText: { fontSize: 13, color: 'rgba(61, 43, 31, 0.5)', fontStyle: 'italic', paddingVertical: 10, textAlign: 'center' },
  orderItem: { borderBottomWidth: 1, borderBottomColor: 'rgba(61, 43, 31, 0.05)', paddingVertical: 10 },
  orderItemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: 'bold', color: '#3D2B1F' },
  orderDate: { fontSize: 12, color: 'rgba(61, 43, 31, 0.4)' },
  orderItemBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderStatus: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  orderTotal: { fontSize: 13, fontWeight: 'bold', color: '#3D2B1F' },
  
  aboutTitle: { fontSize: 16, fontWeight: 'bold', color: '#3D2B1F', marginBottom: 8 },
  aboutText: { fontSize: 14, color: 'rgba(61, 43, 31, 0.8)', lineHeight: 20, marginBottom: 12 },
  aboutContactTitle: { fontSize: 13, fontWeight: 'bold', color: '#3D2B1F', marginTop: 10, marginBottom: 6 },
  aboutContactText: { fontSize: 13, color: 'rgba(61, 43, 31, 0.7)', marginBottom: 4 },
  
  divider: { height: 1, backgroundColor: 'rgba(61, 43, 31, 0.1)', marginVertical: 20 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  legalLink: { fontSize: 12, color: 'rgba(61, 43, 31, 0.5)', fontWeight: 'bold', textDecorationLine: 'underline' },
  legalSeparator: { fontSize: 12, color: 'rgba(61, 43, 31, 0.3)' },

  // Modal styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalBody: { backgroundColor: '#FFF6E6', width: '90%', borderRadius: 16, padding: 20, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#3D2B1F', borderBottomWidth: 1, borderBottomColor: 'rgba(61, 43, 31, 0.1)', paddingBottom: 10, marginBottom: 14, textAlign: 'center' },
  bankDetailContainer: { backgroundColor: '#FCF0DA', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  bankLabel: { fontSize: 11, color: 'rgba(61, 43, 31, 0.5)', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 6 },
  bankValue: { fontSize: 14, color: '#3D2B1F', fontWeight: 'bold', marginBottom: 4 },
  modalCloseBtn: { backgroundColor: '#3D2B1F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  modalCloseBtnText: { color: '#FFF6E6', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
  notiBox: { flexDirection: 'row', gap: 10, backgroundColor: '#FCF0DA', padding: 12, borderRadius: 8, marginBottom: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.1)' },
  notiText: { fontSize: 13, color: '#3D2B1F', flex: 1, lineHeight: 18 },
  legalBodyText: { fontSize: 13, color: '#3D2B1F', lineHeight: 20 }
});
