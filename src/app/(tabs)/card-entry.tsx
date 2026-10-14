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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import HeaderBar from '../../components/common/HeaderBar';

export default function CardEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    showFraudWarning?: string;
    pickup?: string;
    dropoff?: string;
  }>();

  const rawAmount = params.amount || '104.00';
  const numericAmount = parseFloat(rawAmount) || 104;

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

  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [cardholder, setCardholder] = useState('John Doe');

  // Fraud Warning Modal state (sole confirmation modal for card payment)
  const [isFraudWarningVisible, setIsFraudWarningVisible] = useState(
    params.showFraudWarning !== 'false'
  );
  const [isFraudRiskAccepted, setIsFraudRiskAccepted] = useState(true);
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

  // Open Fraud Warning modal
  const handleOpenConfirm = () => {
    if (!cardNumber) {
      setCardNumber('•••• •••• •••• 4242');
      setExpiry('12/28');
      setCvc('123');
      setCardholder('John Doe');
    }
    setIsFraudWarningVisible(true);
  };

  // Confirm and Charge -> Routes to Processing Screen
  const handleProceedCharge = () => {
    if (!isFraudRiskAccepted) return;
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsFraudWarningVisible(false);
      router.push({
        pathname: '/(tabs)/processing',
        params: {
          amount: rawAmount,
          method: 'card',
          pickup: params.pickup || 'Hospital',
          dropoff: params.dropoff || 'Home',
        },
      });
    }, 400);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header ── */}
      <HeaderBar title="Enter Card Details" showBack />

      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Total to Charge Section (100% Figma Match) ── */}
          <View style={styles.totalChargeCard}>
            <Text style={styles.totalChargeLabel}>TOTAL AMOUNT (INC GST)</Text>
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



      {/* ── FRAUD WARNING MODAL (100% MATCH WITH IMAGE 3) ── */}
      <Modal
        visible={isFraudWarningVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFraudWarningVisible(false)}
      >
        <View style={styles.fraudModalBackdrop}>
          <TouchableOpacity
            style={styles.modalBackdropTouch}
            activeOpacity={1}
            onPress={() => setIsFraudWarningVisible(false)}
          />

          <View style={styles.fraudModalSheet}>
            {/* Top Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Red Shield Alert Icon Box */}
            <View style={styles.fraudShieldBox}>
              <MaterialCommunityIcons name="shield-alert-outline" size={30} color="#DC2626" />
            </View>

            {/* Title: FRAUD WARNING */}
            <Text style={styles.fraudModalTitle}>FRAUD WARNING</Text>

            {/* Red Alert Banner Callout */}
            <View style={styles.fraudAlertBanner}>
              <Feather name="alert-triangle" size={18} color="#DC2626" style={{ marginRight: 10 }} />
              <Text style={styles.fraudAlertBannerText}>
                CARD PAYMENTS OVER PHONE OR VIA TEXT MESSAGE ARE PRONE TO FRAUD
              </Text>
            </View>

            {/* Information Box */}
            <View style={styles.fraudInfoBox}>
              <Text style={styles.fraudInfoText}>
                You accept that if this transaction is disputed, it will be charged back as the full amount plus any fees.
              </Text>
              <View style={styles.fraudInfoDivider} />
              <Text style={styles.fraudInfoText}>
                Only take payments over phone from known customers to minimise loss.
              </Text>
            </View>

            {/* Checkbox Authorization Row */}
            <TouchableOpacity
              style={styles.fraudCheckboxRow}
              activeOpacity={0.7}
              onPress={() => setIsFraudRiskAccepted((prev) => !prev)}
            >
              <View style={[styles.fraudCheckbox, isFraudRiskAccepted && styles.fraudCheckboxActive]}>
                {isFraudRiskAccepted && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.fraudCheckboxText}>
                I understand the chargeback risk and authorize charging{' '}
                <Text style={styles.fraudCheckboxBold}>${formattedWithComma}.{decimalPart} AUD</Text>.
              </Text>
            </TouchableOpacity>

            {/* Action Buttons: I Agree (Dark Blue) & Cancel Transaction */}
            <View style={styles.fraudButtonsWrap}>
              <TouchableOpacity
                style={[
                  styles.fraudAgreeBtn,
                  (!isFraudRiskAccepted || isProcessing) && styles.fraudAgreeBtnDisabled,
                ]}
                disabled={!isFraudRiskAccepted || isProcessing}
                activeOpacity={0.85}
                onPress={handleProceedCharge}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <View style={styles.fraudGoldDot} />
                    <Text style={styles.fraudAgreeBtnText}>I Agree</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fraudCancelBtn}
                activeOpacity={0.7}
                disabled={isProcessing}
                onPress={() => router.back()}
              >
                <Text style={styles.fraudCancelBtnText}>Cancel Transaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fraudModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouch: {
    flex: 1,
  },
  fraudModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  fraudShieldBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
  },
  fraudModalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  fraudAlertBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fraudAlertBannerText: {
    color: '#7F1D1D',
    fontSize: 10.5,
    fontWeight: '700',
    lineHeight: 16,
    flex: 1,
    letterSpacing: 0.2,
  },
  fraudInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  fraudInfoText: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 17,
  },
  fraudInfoDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  fraudCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  fraudCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fraudCheckboxActive: {
    backgroundColor: '#0A3977',
    borderColor: '#0A3977',
  },
  fraudCheckboxText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  fraudCheckboxBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  fraudButtonsWrap: {
    gap: 8,
  },
  fraudAgreeBtn: {
    backgroundColor: '#0A3977',
    borderRadius: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraudAgreeBtnDisabled: {
    opacity: 0.5,
  },
  fraudGoldDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
    marginRight: 8,
  },
  fraudAgreeBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  fraudCancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  fraudCancelBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalChargeAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  totalChargeDollar: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
    marginRight: 1,
  },
  totalChargeInt: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalChargeCents: {
    fontSize: 15,
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
    fontSize: 10,
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
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
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
    fontSize: 10,
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
    height: 48,
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
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtnAmount: {
    color: '#FBBF24',
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
});
