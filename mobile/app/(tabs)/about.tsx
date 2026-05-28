import { StyleSheet, Text, View, SafeAreaView, ScrollView, Image } from 'react-native';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>About Us</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: 100, height: 100, resizeMode: 'contain', marginBottom: 12 }} 
            />
            <Text style={styles.logoText}>Brahmani <Text style={{color: '#EBA938'}}>JEWELLERS</Text></Text>
          </View>
          <Text style={styles.desc}>
            Welcome to Brahmani Jewellers, your trusted destination for exquisite jewellery. 
            We specialize in crafting timeless pieces that celebrate life's most precious moments.
          </Text>
          <Text style={styles.desc}>
            Our collection features 100% pure hallmarked gold and silver ornaments, ranging from traditional designs to modern everyday wear.
          </Text>
          
          <View style={styles.contactBox}>
            <Text style={styles.contactTitle}>Contact Details</Text>
            <Text style={styles.contactText}>📞 +91 99258 11771</Text>
            <Text style={styles.contactText}>📧 info.brahmanijewellers@gmail.com</Text>
            <Text style={styles.contactText}>📍 Choksi Bazar, Azad Chowk, Amraiwadi, Ahmedabad</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF6E6' },
  header: { padding: 20, backgroundColor: '#3D2B1F', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#EBA938', letterSpacing: 1, marginTop: 20 },
  container: { padding: 20 },
  card: { backgroundColor: '#FCF0DA', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(235, 169, 56, 0.2)' },
  logoText: { fontSize: 28, fontWeight: 'bold', color: '#3D2B1F', marginBottom: 16, textAlign: 'center' },
  desc: { fontSize: 16, color: '#3D2B1F', lineHeight: 24, marginBottom: 16, textAlign: 'center' },
  contactBox: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(61, 43, 31, 0.1)' },
  contactTitle: { fontSize: 18, fontWeight: 'bold', color: '#3D2B1F', marginBottom: 12 },
  contactText: { fontSize: 16, color: '#3D2B1F', marginBottom: 8 }
});
