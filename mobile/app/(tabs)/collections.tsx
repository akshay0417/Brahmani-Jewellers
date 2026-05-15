import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';

export default function CollectionsScreen() {
  const dummyProducts = [
    { id: 1, name: "Bridal Gold Necklace", price: "₹2,45,000", image: "https://images.unsplash.com/photo-1599643478514-4a4e08d50d02?w=500&q=80" },
    { id: 2, name: "Diamond Solitaire Ring", price: "₹85,000", image: "https://images.unsplash.com/photo-1605100804763-247f67b8548e?w=500&q=80" },
    { id: 3, name: "Traditional Gold Bangles", price: "₹1,20,000", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80" },
    { id: 4, name: "Ruby Drop Earrings", price: "₹45,000", image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Designs</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          {dummyProducts.map(item => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <View style={styles.cardInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <TouchableOpacity style={styles.button}>
                  <Text style={styles.buttonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  header: { padding: 20, backgroundColor: '#3D2B1F', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EBA938', letterSpacing: 1, marginTop: 20 },
  container: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FCF0DA', borderRadius: 12, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  image: { width: '100%', height: 150 },
  cardInfo: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#3D2B1F', marginBottom: 4 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: '#EBA938', marginBottom: 12 },
  button: { backgroundColor: '#3D2B1F', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  buttonText: { color: '#FFF6E6', fontWeight: 'bold', fontSize: 12 }
});
