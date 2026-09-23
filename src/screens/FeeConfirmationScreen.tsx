import React, { useState } from 'react';
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
import { RouteProp } from '@react-navigation/native';

import { colors, radius } from '../constants/theme';
import { MethodToggle } from '../components/MethodToggle';
import { calculateFee, formatAUD, type PaymentMethodType } from '../utils/feeCalculator';
import type { RootStackParamList } from '../types';

type FeeConfirmationNavProp = NativeStackNavigationProp<RootStackParamList, 'FeeConfirmation'>;
type FeeConfirmationRouteProp = RouteProp<RootStackParamList, 'FeeConfirmation'>;

interface FeeConfirmationScreenProps {
  navigation: FeeConfirmationNavProp;
  route: FeeConfirmationRouteProp;
}

export const FeeConfirmationScreen: React.FC<FeeConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 24) + 16;

  const { amount, paymentMethod: initialMethod, currency } = route.params;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>(initialMethod);

  // Dynamic fee calculation based on the selected method
  const feeBreakdown = calculateFee(amount, selectedMethod);

  const handleProceed = () => {
    if (selectedMethod === 'tap') {
      navigation.navigate('TapReady', {
        amount: feeBreakdown.finalTotal,
        feeBreakdown,
        currency,
      });
    } else {
      navigation.navigate('CardEntry', {
        amount: feeBreakdown.finalTotal,
        feeBreakdown,
        currency,
      });
    }
  };

  const isTap = selectedMethod === 'tap';

  return (
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

      {/* ── Top Header with Back Chevron ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Payment</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Main Content Area ── */}
      <View style={styles.content}>
        {/* Payment Method Switcher */}
        <View style={styles.methodToggleWrap}>
          <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
          <MethodToggle
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />
          <Text style={styles.methodRateHint}>
            {isTap ? 'Tap to Pay: 1.7% + $0.10 fixed fee' : 'Card: 1.7% + $0.30 fixed fee'}
          </Text>
        </View>

        {/* ── Fee Breakdown Card ── */}
        <View style={styles.breakdownCard}>
          {/* Original Amount */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Amount</Text>
            <Text style={styles.rowValue}>{formatAUD(feeBreakdown.originalAmount)}</Text>
          </View>

          {/* 1.7% Fee */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>1.7% fee</Text>
            <Text style={styles.rowValue}>{formatAUD(feeBreakdown.percentageFee)}</Text>
          </View>

          {/* Fixed Fee */}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fixed fee</Text>
            <Text style={styles.rowValue}>{formatAUD(feeBreakdown.fixedFee)}</Text>
          </View>

          {/* Total Fee */}
          <View style={styles.row}>
            <Text style={styles.rowLabelSub}>Total fee</Text>
            <Text style={styles.rowValueSub}>{formatAUD(feeBreakdown.totalFee)}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Final Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatAUD(feeBreakdown.finalTotal)}</Text>
          </View>
        </View>

        {/* Security badge */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#16A34A" />
          <Text style={styles.securityText}>
            Secured payment via Stripe Terminal
          </Text>
        </View>
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleProceed}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>
            {isTap
              ? `Confirm & Tap to Pay ${formatAUD(feeBreakdown.finalTotal)}`
              : `Confirm & Pay ${formatAUD(feeBreakdown.finalTotal)}`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Back to Edit</Text>
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
  content: {
    flex: 1,
    paddingTop: 8,
  },
  methodToggleWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  methodRateHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  breakdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
  },
  rowLabelSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  rowValueSub: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2563EB',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    fontSize: 12,
    color: '#64748B',
  },
  buttonWrapper: {
    gap: 10,
    marginBottom: 8,
  },
  confirmBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FeeConfirmationScreen;
