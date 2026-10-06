import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.tab.background,
          borderTopColor: colors.tab.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: colors.tab.activeText,
        tabBarInactiveTintColor: colors.tab.inactiveText,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name="home"
                size={22}
                color={focused ? colors.tab.activeIcon : colors.tab.inactiveIcon}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name="clipboard-outline"
                size={22}
                color={focused ? colors.tab.activeIcon : colors.tab.inactiveIcon}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name="person-outline"
                size={22}
                color={focused ? colors.tab.activeIcon : colors.tab.inactiveIcon}
              />
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tap-to-pay"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="card-entry"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tap-ready"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="processing"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 18,
    height: 2.5,
    backgroundColor: colors.tab.activeIndicator,
    borderRadius: 999,
  },
});
