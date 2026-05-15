import { StatusBar } from 'expo-status-bar';
import { Text, View, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-3xl font-bold text-coffee mb-2">Brahmani Jewellers</Text>
        <Text className="text-lg text-ochre text-center">
          Mobile Application Starter
        </Text>
        <View className="mt-8 bg-coffee px-6 py-3 rounded-full">
          <Text className="text-cream font-semibold">Explore Collection</Text>
        </View>
        <StatusBar style="dark" />
      </View>
    </SafeAreaView>
  );
}
