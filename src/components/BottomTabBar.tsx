import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

const TABS = [
  {
    name: 'Home',
    label: 'Home',
    icon: 'home' as const,
    activeIcon: 'home' as const,
  },
  {
    name: 'Transactions',
    label: 'Transactions',
    icon: 'receipt-outline' as const,
    activeIcon: 'receipt' as const,
  },
  {
    name: 'More',
    label: 'More',
    icon: 'reorder-three-outline' as const,
    activeIcon: 'reorder-three' as const,
  },
];

interface BottomTabBarProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? colors.primary : '#94A3B8'}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.primary : '#94A3B8',
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
  },
});

export default BottomTabBar;
