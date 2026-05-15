import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CartScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
      </View>
      <View style={styles.container}>
        <FontAwesome name="shopping-bag" size={64} color="rgba(61, 43, 31, 0.2)" />
        <Text style={styles.emptyText}>Your cart is currently empty</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/collections')}>
          <Text style={styles.buttonText}>Browse Jewellery</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  header: { padding: 20, backgroundColor: '#3D2B1F', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EBA938', letterSpacing: 1, marginTop: 20 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#3D2B1F', marginTop: 16, marginBottom: 32 },
  button: { backgroundColor: '#EBA938', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#3D2B1F', fontWeight: 'bold', fontSize: 16 }
});
