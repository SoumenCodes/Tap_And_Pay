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

import { AmountDisplay } from '../components/AmountDisplay';
import { Keypad } from '../components/Keypad';
import { MethodToggle } from '../components/MethodToggle';
import type { RootStackParamList, Currency } from '../types';
import type { PaymentMethodType } from '../utils/feeCalculator';

type HomeScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface HomeScreenProps {
  navigation: HomeScreenNavProp;
}

const CURRENCY: Currency = '$';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 24) + 16;

  // Selected payment method toggle (Tap vs Card)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('tap');

  // Left-to-right string input (default '0')
  const [rawInput, setRawInput] = useState<string>('0');

  const numericAmount = parseFloat(rawInput) || 0;
  const isValid = numericAmount > 0;

  const handleKeyPress = useCallback((key: string) => {
    setRawInput((prev) => {
      if (key === 'backspace') {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      }
      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }
      // If currently '0', replace with the entered digit
      if (prev === '0') {
        return key;
      }
      // Max 2 decimal digits after dot
      if (prev.includes('.')) {
        const [, decPart] = prev.split('.');
        if (decPart && decPart.length >= 2) return prev;
      }
      // Max 8 integer digits
      if (prev.replace('.', '').length >= 8) return prev;
      return prev + key;
    });
  }, []);

  const handleContinue = () => {
    if (!isValid) return;
    navigation.navigate('FeeConfirmation', {
      amount: numericAmount,
      paymentMethod,
      currency: CURRENCY,
    });
  };

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Pill Method Toggle: [ ))) Tap | 💳 Card ] ── */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <Text style={styles.pageTitle}>Tap to Pay</Text>
          <Text style={styles.pageSubtitle}>
            Accept contactless payments{'\n'}with a tap.
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.6}>
          <Ionicons name="settings-outline" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>
      <View style={{ gap: 10, marginBottom: 4 }}>

        <View style={styles.toggleRow}>
          <MethodToggle
            selectedMethod={paymentMethod}
            onSelectMethod={setPaymentMethod}
          />
        </View>

        {/* ── Store Selector Card ── */}
        <TouchableOpacity style={styles.storeCard} activeOpacity={0.75}>
          <View style={styles.storeIconWrap}>
            <Ionicons name="storefront-outline" size={17} color="#2563EB" />
          </View>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>Demo Store</Text>
            <Text style={styles.storeSub}>{"Soumen's Business"}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* ── Centered Amount Display (Left-to-Right with . decimal) ── */}
      <View style={styles.amountSection}>
        <AmountDisplay
          displayValue={rawInput}
          currency={CURRENCY}
          size="xl"
          color="#0F172A"
        />
      </View>

      {/* ── Numeric Keypad with . decimal ── */}
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
  toggleRow: {
    alignItems: 'center',
    // marginTop: 2,
    // marginBottom: 8,
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
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  settingsBtn: {
    padding: 4,
    marginTop: 2,
  },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 10,
    marginBottom: 4,

  },
  storeIconWrap: {
    width: 44,
    height: 44,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  storeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  amountSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  keypadSection: {
    width: '100%',
    justifyContent: 'center',
    marginBottom: 4,
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
    fontSize: 15,
    fontWeight: '600',
  },
});

export default HomeScreen;
