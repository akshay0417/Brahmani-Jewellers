import { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabBarButton({ iconName, isFocused, onPress }) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [isFocused]);

  // Translate active button upwards
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -18],
  });

  // Scale active button up slightly
  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  // Slide white notch cutout up/down
  const notchTranslateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -22],
  });

  // Scale notch cutout
  const notchScale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.tabItemContainer}>
      {/* Animated button container */}
      <Animated.View
        style={[
          styles.btnContainer,
          {
            transform: [{ translateY: translateY }, { scale: scale }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={[
            styles.buttonCircle,
            {
              backgroundColor: isFocused ? '#D4AF37' : 'transparent', // Royal Gold for active button
              borderWidth: isFocused ? 0 : 0,
            },
          ]}
        >
          <FontAwesome
            name={iconName}
            size={20}
            color={isFocused ? '#FFFFFF' : '#8E8E93'} // White icon when active, Warm Gray when inactive
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const allowedRoutes = ['index', 'collections', 'invest', 'coins', 'profile'];

  return (
    <View style={[
      styles.tabBarContainer,
      {
        height: 60 + Math.max(insets.bottom, 12),
        paddingBottom: Math.max(insets.bottom, 12),
      }
    ]}>
      {state.routes.map((route, index) => {
        // Explicitly only show the allowed 5 tabs
        if (!allowedRoutes.includes(route.name)) return null;

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName = 'home';
        if (route.name === 'index') iconName = 'home';
        else if (route.name === 'collections') iconName = 'diamond';
        else if (route.name === 'invest') iconName = 'line-chart';
        else if (route.name === 'coins') iconName = 'circle-o';
        else if (route.name === 'profile') iconName = 'user';

        return (
          <TabBarButton
            key={route.key}
            iconName={iconName}
            isFocused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Shop',
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: 'Invest',
        }}
      />
      <Tabs.Screen
        name="coins"
        options={{
          title: 'Coins',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null, // Hidden from bottom bar
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Hidden from bottom bar
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF', // Dashboard theme base color: White
    height: 60,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 12,
    shadowColor: '#D4AF37', // Dashboard theme shadow accent
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  btnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notchCutout: {
    position: 'absolute',
    top: -22,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF', // Clean cutout blending with white tab bar background
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
});
