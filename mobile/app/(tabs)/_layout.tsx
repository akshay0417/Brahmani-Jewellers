import { useEffect, useRef } from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

function TabBarButton({ iconName, label, isFocused, onPress }) {
  const animatedValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      friction: 8,
      tension: 70,
    }).start();
  }, [isFocused]);

  const scale = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.tabItemContainer}
    >
      <Animated.View style={[styles.btnContainer, { transform: [{ scale }] }]}>
        <View
          style={[
            styles.buttonIconBg,
            {
              backgroundColor: isFocused ? 'rgba(107, 17, 36, 0.1)' : 'transparent',
            },
          ]}
        >
          <FontAwesome
            name={iconName}
            size={18}
            color={isFocused ? '#6B1124' : '#8E8E93'}
          />
        </View>
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? '#6B1124' : '#8E8E93',
              fontWeight: isFocused ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const allowedRoutes = ['index', 'collections', 'invest', 'coins', 'profile'];

  return (
    <View style={[
      styles.tabBarContainer,
      {
        height: 62 + Math.max(insets.bottom, 12),
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
        let label = 'Home';
        if (route.name === 'index') {
          iconName = 'home';
          label = 'Home';
        } else if (route.name === 'collections') {
          iconName = 'diamond';
          label = 'Collection';
        } else if (route.name === 'invest') {
          iconName = 'line-chart';
          label = 'Invest';
        } else if (route.name === 'coins') {
          iconName = 'circle-o';
          label = 'Coins';
        } else if (route.name === 'profile') {
          iconName = 'user';
          label = 'Profile';
        }

        return (
          <TabBarButton
            key={route.key}
            iconName={iconName}
            label={label}
            isFocused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user, isLoading } = useAuth() || {};
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!user) {
    return null;
  }
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { position: 'absolute' },
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
    height: 62,
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
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  btnContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconBg: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    marginTop: 2,
  },
});
