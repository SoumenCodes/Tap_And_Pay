import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function PaymentSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    paymentId?: string;
    cardLast4?: string;
  }>();

  const rawAmount = params.amount || '1250';
  const numericAmount = parseFloat(rawAmount) || 0;
  const isTap = params.method === 'tap' || !params.method;
  const cardLast4 = params.cardLast4 || '4242';
  const paymentId = params.paymentId || 'pi_3N5x...8F2d';

  // Format amount with commas: 1250 -> 1,250
  const formattedAmount =
    numericAmount >= 1000
      ? numericAmount.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : rawAmount;

  const businessName = user?.businessName || 'Crown Cuts';

  const handleViewReceipt = () => {
    router.push({
      pathname: '/(tabs)/receipt-details',
      params: {
        amount: rawAmount,
        method: isTap ? 'tap' : 'card',
        paymentId,
        cardLast4,
      },
    });
  };

  const handleDone = () => {
    router.push('/(tabs)');
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + 12,
          paddingBottom: Math.max(insets.bottom, 20),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Success Checkmark Badge ── */}
        <View style={styles.badgeContainer}>
          <View style={styles.greenCircle}>
            <Ionicons name="checkmark" size={36} color="#FFFFFF" />
          </View>
        </View>

        {/* ── Heading ── */}
        <Text style={styles.title}>Payment Successful</Text>

        {/* ── Amount ($ 1,250) ── */}
        <View style={styles.amountWrap}>
          <Text style={styles.dollarSign}>$ </Text>
          <Text style={styles.amountText}>{formattedAmount}</Text>
        </View>

        {/* ── Timestamp ── */}
        <Text style={styles.timestamp}>21 Sep 2026, 09:41 AM</Text>

        {/* ── Method Pill Badge ── */}
        <View style={styles.methodBadgeWrap}>
          <View style={styles.methodBadge}>
            <Ionicons
              name={isTap ? 'flash' : 'card'}
              size={12}
              color="#D97706"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.methodBadgeText}>
              {isTap ? 'Tap & Go' : 'Card Payment'}
            </Text>
          </View>
        </View>

        {/* ── Summary Details Card (100% Figma Match) ── */}
        <View style={styles.cardContainer}>
          {/* Row 1: Card info */}
          <View style={styles.cardRow}>
            <Ionicons name="card-outline" size={20} color="#64748B" style={styles.rowIcon} />
            <Text style={styles.rowText}>Visa •••• {cardLast4}</Text>
          </View>

          <View style={styles.divider} />

          {/* Row 2: Business name */}
          <View style={styles.cardRow}>
            <Ionicons name="storefront-outline" size={20} color="#64748B" style={styles.rowIcon} />
            <Text style={styles.rowText}>{businessName}</Text>
          </View>

          <View style={styles.divider} />

          {/* Row 3: Payment ID */}
          <View style={[styles.cardRow, { justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="document-text-outline" size={20} color="#64748B" style={styles.rowIcon} />
              <View>
                <Text style={styles.idLabel}>Payment ID</Text>
                <Text style={styles.rowText}>{paymentId}</Text>
              </View>
            </View>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="copy-outline" size={19} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Action Buttons ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewReceiptBtn}
          onPress={handleViewReceipt}
          activeOpacity={0.85}
        >
          <Text style={styles.viewReceiptText}>View Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={handleDone}
          activeOpacity={0.7}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  greenCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#22C55E', // Vibrant Green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dollarSign: {
    fontSize: 34,
    fontWeight: '800',
    color: '#D97706',
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  timestamp: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 10,
  },
  methodBadgeWrap: {
    marginBottom: 24,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  methodBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: '#FDE047',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  idLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  footer: {
    gap: 12,
    paddingBottom: 8,
  },
  viewReceiptBtn: {
    backgroundColor: '#FBBF24', // Yellow CTA
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  viewReceiptText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});
