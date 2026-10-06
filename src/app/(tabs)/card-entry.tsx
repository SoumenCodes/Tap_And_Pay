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
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function CardEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();

  const rawAmount = params.amount || '1250';
  const numericAmount = parseFloat(rawAmount) || 0;

  // Format parts for exact Figma match: $ [gold] 1250 [black] .00 [gray]
  const integerPart =
    numericAmount >= 10000
      ? Math.floor(numericAmount).toLocaleString('en-US')
      : Math.floor(numericAmount).toString();
  const decimalPart = (numericAmount.toFixed(2)).split('.')[1] || '00';

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

  // Detect card brand
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
    return { name: 'Card', badge: 'CARD', color: '#64748B' };
  };

  const detectedBrand = getCardBrand(cardNumber);
  const rawDigits = cardNumber.replace(/\D/g, '');
  const isFormValid = rawDigits.length >= 15 && expiry.length === 5 && cvc.length >= 3;

  const handlePay = () => {
    if (!isFormValid) return;
    console.log('Processing Card Payment:', {
      amount: numericAmount,
      cardNumber: rawDigits,
      expiry,
      cvc,
      cardholder,
      brand: detectedBrand?.name,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 20 : 16) + 8,
          },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── Top Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
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
          {/* ── Total to Charge Section (100% Figma Match) ── */}
          <View style={styles.totalChargeCard}>
            <Text style={styles.totalChargeLabel}>Total to charge:</Text>
            <View style={styles.totalChargeAmountContainer}>
              <Text style={styles.totalChargeDollar}>$</Text>
              <Text style={styles.totalChargeInt}>{integerPart}</Text>
              <Text style={styles.totalChargeCents}>.{decimalPart}</Text>
            </View>
          </View>

          {/* ── Card Inputs ── */}
          <View style={styles.form}>
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CARD NUMBER</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="card-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={handleCardNumberChange}
                  placeholder="0000 0000 0000 0000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={19}
                />
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{detectedBrand?.badge || 'CARD'}</Text>
                </View>
              </View>
            </View>

            {/* Expiry & CVC Row */}
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
                  <Ionicons name="lock-closed-outline" size={18} color="#CBD5E1" />
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

          {/* ── Action Buttons ── */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.confirmBtn, !isFormValid && styles.confirmBtnDisabled]}
              onPress={handlePay}
              disabled={!isFormValid}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>
                Confirm & Collect{' '}
                <Text style={styles.confirmBtnAmount}>${integerPart}.{decimalPart}</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  totalChargeCard: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#FDE047',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 1,
  },
  totalChargeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalChargeAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalChargeDollar: {
    fontSize: 22,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 1,
  },
  totalChargeInt: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalChargeCents: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
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
    color: '#0F172A',
    letterSpacing: 0.6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  cardBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonsContainer: {
    gap: 12,
    marginTop: 28,
  },
  confirmBtn: {
    backgroundColor: '#004085',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#004085',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  confirmBtnAmount: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});
