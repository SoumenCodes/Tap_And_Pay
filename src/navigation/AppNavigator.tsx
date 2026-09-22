import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeScreen } from '../screens/HomeScreen';
import { TransactionsScreen } from '../screens/TransactionsScreen';
import { TapReadyScreen } from '../screens/TapReadyScreen';
import { ProcessingScreen } from '../screens/ProcessingScreen';
import { SuccessScreen } from '../screens/SuccessScreen';
import { ReceiptScreen } from '../screens/ReceiptScreen';
import { BottomTabBar } from '../components/BottomTabBar';
import { radius } from '../constants/theme';
import type { RootStackParamList, MainTabParamList } from '../types';

// ─── More / Settings Screen ───
function MoreScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24) + 16;

  const menuItems = [
    { icon: 'key-outline' as const, label: 'Stripe API Keys' },
    { icon: 'location-outline' as const, label: 'Terminal Location' },
    { icon: 'shield-checkmark-outline' as const, label: 'Security & Compliance' },
    { icon: 'phone-portrait-outline' as const, label: 'Device Diagnostics' },
    { icon: 'toggle-outline' as const, label: 'Simulator Mode' },
    { icon: 'help-circle-outline' as const, label: 'Help & Docs' },
  ];

  return (
    <View style={[moreStyles.root, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={moreStyles.header}>
        <View style={moreStyles.logoWrap}>
          <Ionicons name="wifi" size={24} color="#2563EB" />
        </View>
        <Text style={moreStyles.appName}>TapToPay</Text>
        <Text style={moreStyles.version}>Version 1.0 · Stripe Terminal</Text>
      </View>

      {menuItems.map((item) => (
        <TouchableOpacity key={item.label} style={moreStyles.menuRow} activeOpacity={0.7}>
          <View style={moreStyles.menuIcon}>
            <Ionicons name={item.icon} size={18} color="#2563EB" />
          </View>
          <Text style={moreStyles.menuLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const moreStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrap: {
    width: 52,
    height: 52,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  version: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
});

// ─── Tab Navigator (SINGLE Bottom Tab Bar) ───
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <BottomTabBar
          activeTab={props.state.routeNames[props.state.index]}
          onTabPress={(tabName) => props.navigation.navigate(tabName)}
        />
      )}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Stack Navigator ───
const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="TapReady"
        component={TapReadyScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Processing"
        component={ProcessingScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Receipt"
        component={ReceiptScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;
