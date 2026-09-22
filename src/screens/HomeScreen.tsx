import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, radius } from '../constants/theme';
import { AmountDisplay } from '../components/AmountDisplay';
import { Keypad } from '../components/Keypad';
import type { RootStackParamList, Currency } from '../types';

type HomeScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface HomeScreenProps {
  navigation: HomeScreenNavProp;
}

const CURRENCY: Currency = '₹';
const MAX_AMOUNT = 9999999;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24) + 18;

  // Default to 1250 as shown in the Figma reference
  const [rawAmount, setRawAmount] = useState('1250');

  const numericAmount = parseInt(rawAmount, 10) || 0;
  const isValid = numericAmount > 0;

  const handleKeyPress = useCallback((key: string) => {
    setRawAmount((prev) => {
      if (key === 'backspace') {
        const next = prev.slice(0, -1);
        return next === '' ? '0' : next;
      }
      if (prev === '0' && key !== '00') return key;
      const next = prev + key;
      if (parseInt(next, 10) > MAX_AMOUNT) return prev;
      return next;
    });
  }, []);

  const handleContinue = () => {
    if (!isValid) return;
    navigation.navigate('TapReady', { amount: numericAmount, currency: CURRENCY });
  };

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header: Title + Settings Icon (aligned as in Figma) ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.pageTitle}>Tap to Pay</Text>
          <Text style={styles.pageSubtitle}>
            Accept contactless payments{'\n'}with a tap.
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.6}>
          <Ionicons name="settings-outline" size={22} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* ── Store Selector Card ── */}
      <TouchableOpacity style={styles.storeCard} activeOpacity={0.75}>
        <View style={styles.storeIconWrap}>
          <Ionicons name="storefront-outline" size={20} color="#2563EB" />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>Demo Store</Text>
          <Text style={styles.storeSub}>Soumen's Business</Text>
        </View>
        <Ionicons name="chevron-down" size={16} color="#64748B" />
      </TouchableOpacity>

      {/* ── Centered Amount Display with Generous Vertical Breathing Room ── */}
      <View style={styles.amountSection}>
        <AmountDisplay
          amount={numericAmount}
          currency={CURRENCY}
          size="xl"
          color="#0F172A"
        />
      </View>

      {/* ── Numeric Keypad ── */}
      <View style={styles.keypadSection}>
        <Keypad onPress={handleKeyPress} />
      </View>

      {/* ── Continue Button ── */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
          disabled={!isValid}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: 16,
  },
  titleCol: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  settingsBtn: {
    padding: 4,
    marginTop: 2,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  storeIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  storeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  amountSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  keypadSection: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonWrapper: {
    marginBottom: 12,
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;
