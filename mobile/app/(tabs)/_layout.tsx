import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

function TabIcon({ name, color, focused }) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? 1.28 : 1,
      useNativeDriver: true,
      friction: 4,
      tension: 40,
    }).start();
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }], paddingVertical: 4 }}>
      <FontAwesome size={22} name={name} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EBA938', // Ochre
        tabBarInactiveTintColor: 'rgba(255, 246, 230, 0.6)', // Faded Cream
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          letterSpacing: 0.5,
          marginTop: -4,
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#3D2B1F', // Coffee
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 6,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Designs',
          tabBarIcon: ({ color, focused }) => <TabIcon name="diamond" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => <TabIcon name="shopping-cart" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="user-circle" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null, // Hide old about tab
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Hide old explore tab
        }}
      />
    </Tabs>
  );
}
