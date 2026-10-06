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
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function CardEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ amount?: string }>();

  const rawAmount = params.amount || '1250';
  const numericAmount = parseFloat(rawAmount) || 0;

  // Format parts for exact Figma match: $ [gold] 1250 [black] .00 [gray]
  const integerPart =
    numericAmount >= 10000
      ? Math.floor(numericAmount).toLocaleString('en-US')
      : Math.floor(numericAmount).toString();
  const formattedWithComma = numericAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const decimalPart = (numericAmount.toFixed(2)).split('.')[1] || '00';

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardholder, setCardholder] = useState('');

  // Confirmation Modal state
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
  const getCardBrand = (num: string): { name: string; badge: string; color: string } => {
    const raw = num.replace(/\D/g, '');
    if (raw.startsWith('4')) {
      return { name: 'Visa', badge: 'VISA', color: '#1D4ED8' };
    }
    if (/^(5[1-5]|2[2-7])/.test(raw)) {
      return { name: 'Mastercard', badge: 'MC', color: '#EB001B' };
    }
    if (/^3[47]/.test(raw)) {
      return { name: 'Amex', badge: 'AMEX', color: '#006FCF' };
    }
    return { name: 'Visa', badge: 'VISA', color: '#1D4ED8' };
  };

  const detectedBrand = getCardBrand(cardNumber);
  const rawDigits = cardNumber.replace(/\D/g, '');
  const last4 = rawDigits.length >= 4 ? rawDigits.slice(-4) : '4242';

  // Open confirmation modal
  const handleOpenConfirm = () => {
    // If not filled, fill with mock values for smooth previewing matching Figma
    if (!cardNumber) {
      setCardNumber('•••• •••• •••• 4242');
      setExpiry('12/28');
      setCvc('123');
      setCardholder('John Doe');
    }
    setIsConfirmModalVisible(true);
  };

  // Confirm and Charge -> Routes to Processing Screen
  const handleProceedCharge = () => {
    if (!isAuthorized) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsConfirmModalVisible(false);
      router.push({
        pathname: '/(tabs)/processing',
        params: { amount: rawAmount, method: 'card' },
      });
    }, 400);
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
                  <Text style={styles.cardBadgeText}>{detectedBrand.badge}</Text>
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
              style={styles.confirmBtn}
              onPress={handleOpenConfirm}
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

      {/* ── 9 Card Details Confirmation Popup (100% Figma Match) ── */}
      <Modal
        visible={isConfirmModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsConfirmModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setIsConfirmModalVisible(false)}
          />

          <View style={styles.modalSheet}>
            {/* Drag Handle Bar */}
            <View style={styles.dragHandle} />

            {/* Security Shield Icon */}
            <View style={styles.shieldContainer}>
              <Ionicons name="shield-checkmark-outline" size={26} color="#2563EB" />
            </View>

            {/* Header Titles */}
            <Text style={styles.modalTitle}>Authorize Payment</Text>
            <Text style={styles.modalSubtitle}>Please confirm the transaction details below</Text>

            {/* Summary Details Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.amountLabel}>AMOUNT TO CHARGE</Text>

              <View style={styles.amountRow}>
                <Text style={styles.modalDollar}>$</Text>
                <Text style={styles.modalAmountInt}>{formattedWithComma}</Text>
                <Text style={styles.modalAmountDec}>.{decimalPart} AUD</Text>
              </View>

              <View style={styles.divider} />

              {/* Merchant Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Merchant</Text>
                <Text style={styles.detailValue}>
                  {user?.businessName || 'SE PAY Australia'}
                </Text>
              </View>

              {/* Card Row */}
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Card</Text>
                <View style={styles.cardValueContainer}>
                  <View style={styles.visaBadge}>
                    <Text style={styles.visaBadgeText}>{detectedBrand.badge}</Text>
                  </View>
                  <Text style={styles.cardMaskedText}>•••• {last4}</Text>
                </View>
              </View>
            </View>

            {/* Checkbox authorization */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              activeOpacity={0.7}
              onPress={() => setIsAuthorized((prev) => !prev)}
            >
              <View style={[styles.checkbox, isAuthorized && styles.checkboxActive]}>
                {isAuthorized && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.checkboxText}>
                I confirm and authorize this card payment of{' '}
                <Text style={styles.checkboxBold}>${formattedWithComma}.{decimalPart} AUD.</Text>
              </Text>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.proceedBtn, !isAuthorized && styles.proceedBtnDisabled]}
                onPress={handleProceedCharge}
                disabled={!isAuthorized || isProcessing}
                activeOpacity={0.85}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.proceedBtnText}>
                    Proceed & Charge{' '}
                    <Text style={styles.proceedBtnAmount}>${integerPart}.{decimalPart}</Text>
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsConfirmModalVisible(false)}
                activeOpacity={0.7}
                disabled={isProcessing}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#0F172A',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
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

  /* ── Modal Styles ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  shieldContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 18,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  modalDollar: {
    fontSize: 26,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 2,
  },
  modalAmountInt: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalAmountDec: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '700',
  },
  cardValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visaBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  visaBadgeText: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardMaskedText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  checkboxText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  checkboxBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  modalButtons: {
    gap: 10,
  },
  proceedBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedBtnDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  proceedBtnAmount: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});
