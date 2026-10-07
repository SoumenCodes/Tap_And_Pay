import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface HeaderBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  subtitle?: string | React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  showBorder?: boolean;
}

export default function HeaderBar({
  title,
  showBack = false,
  onBack,
  subtitle,
  rightAction,
  style,
  showBorder = false,
}: HeaderBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 24) + 8,
        },
        showBorder && styles.bottomBorder,
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Slot: Back Button or Spacer */}
        <View style={styles.sideSlot}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#0F172A" />
            </TouchableOpacity>
          )}
        </View>

        {/* Center Slot: Title and Optional Subtitle */}
        <View style={styles.centerSlot}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            typeof subtitle === 'string' ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : (
              subtitle
            )
          )}
        </View>

        {/* Right Slot: Action or Balance Spacer */}
        <View style={[styles.sideSlot, styles.rightSlot]}>
          {rightAction || null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  sideSlot: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightSlot: {
    alignItems: 'flex-end',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
});
