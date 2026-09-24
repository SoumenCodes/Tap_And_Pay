import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { formatAUD } from '../utils/feeCalculator';
import type { RootStackParamList } from '../types';

type CardEntryNavProp = NativeStackNavigationProp<RootStackParamList, 'CardEntry'>;
type CardEntryRouteProp = RouteProp<RootStackParamList, 'CardEntry'>;

interface CardEntryScreenProps {
  navigation: CardEntryNavProp;
  route: CardEntryRouteProp;
}

export const CardEntryScreen: React.FC<CardEntryScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 24) + 16;

  const { amount, feeBreakdown, currency } = route.params;

  // Blank by default with placeholders
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholder, setCardholder] = useState('');

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  // Format MM/YY
  const handleExpiryChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  // Format CVC
  const handleCvcChange = (text: string) => {
    const raw = text.replace(/\D/g, '').slice(0, 4);
    setCvc(raw);
  };

  // Dynamic card brand detection
  const getCardBrand = (num: string): { name: string; badge: string; color: string } | null => {
    const raw = num.replace(/\D/g, '');
    if (!raw) return null;
    if (raw.startsWith('4')) {
      return { name: 'Visa', badge: 'VISA', color: '#1A1F71' };
    }
    if (/^(5[1-5]|2[2-7])/.test(raw)) {
      return { name: 'Mastercard', badge: 'MC', color: '#EB001B' };
    }
    if (/^3[47]/.test(raw)) {
      return { name: 'Amex', badge: 'AMEX', color: '#006FCF' };
    }
    return { name: 'Card', badge: 'CARD', color: '#475569' };
  };

  const detectedBrand = getCardBrand(cardNumber);
  const rawDigits = cardNumber.replace(/\D/g, '');
  const isFormValid = rawDigits.length >= 15 && expiry.length === 5 && cvc.length >= 3;

  const handlePay = () => {
    if (!isFormValid) return;
    navigation.navigate('Processing', {
      amount,
      feeBreakdown,
      currency,
      paymentMethod: 'card',
      cardDetails: {
        last4: rawDigits.slice(-4),
        brand: detectedBrand?.name || 'Card',
      },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: topPadding,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Enter Card Details</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Total Banner ── */}
          <View style={styles.totalBanner}>
            <Text style={styles.totalBannerLabel}>Total to charge:</Text>
            <Text style={styles.totalBannerAmount}>{formatAUD(amount)}</Text>
          </View>

          {/* ── Card Inputs ── */}
          <View style={styles.form}>
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CARD NUMBER</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="card-outline" size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                />
                {detectedBrand ? (
                  <View style={[styles.brandBadge, { backgroundColor: detectedBrand.color }]}>
                    <Text style={styles.brandBadgeText}>{detectedBrand.badge}</Text>
                  </View>
                ) : (
                  <Ionicons name="card" size={18} color="#CBD5E1" />
                )}
              </View>
            </View>

            {/* Expiry & CVC */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>EXPIRY</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={expiry}
                    onChangeText={handleExpiryChange}
                    placeholder="MM/YY"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>CVC / CVV</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    value={cvc}
                    onChangeText={handleCvcChange}
                    placeholder="123"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            {/* Cardholder Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CARDHOLDER NAME</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={cardholder}
                  onChangeText={setCardholder}
                  placeholder="Full name on card"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                />
              </View>
            </View>
          </View>

          {/* Security note */}
          <View style={styles.securityNote}>
            <Ionicons name="lock-closed-outline" size={15} color="#16A34A" />
            <Text style={styles.securityText}>
              256-bit encrypted manual card processing
            </Text>
          </View>
        </ScrollView>

        {/* ── Submit Button ── */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.payBtn, !isFormValid && styles.payBtnDisabled]}
            onPress={handlePay}
            disabled={!isFormValid}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnText}>
              Pay {formatAUD(amount)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingTop: 8,
  },
  totalBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  totalBannerLabel: {
    fontSize: 14,
    color: '#1E40AF',
    fontWeight: '500',
  },
  totalBannerAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  brandBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  brandBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  securityText: {
    fontSize: 12,
    color: '#64748B',
  },
  buttonWrapper: {
    marginTop: 16,
    marginBottom: 8,
  },
  payBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CardEntryScreen;
