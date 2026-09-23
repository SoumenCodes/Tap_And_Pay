import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { colors, radius } from '../constants/theme';
import { AmountDisplay } from '../components/AmountDisplay';
import type { RootStackParamList } from '../types';

type ReceiptNavProp = NativeStackNavigationProp<RootStackParamList, 'Receipt'>;
type ReceiptRouteProp = RouteProp<RootStackParamList, 'Receipt'>;

interface ReceiptScreenProps {
  navigation: ReceiptNavProp;
  route: ReceiptRouteProp;
}

// ─── Small Visa Badge ───
const VisaBadge: React.FC = () => (
  <View style={visaStyles.badge}>
    <Text style={visaStyles.text}>VISA</Text>
  </View>
);

const visaStyles = StyleSheet.create({
  badge: {
    backgroundColor: '#1A1F71',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});

export const ReceiptScreen: React.FC<ReceiptScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24) + 16;
  const { transaction } = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Receipt from ${transaction.storeName}\nTotal Paid: $${transaction.amount.toFixed(2)}\nMethod: ${transaction.paymentMethod}\nStatus: Paid\nDate: 21 Sep 2026, 09:41 AM\nPayment ID: ${transaction.paymentId}\nPowered by Stripe`,
      });
    } catch {
      // ignore
    }
  };

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

      {/* ── Top Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Receipt</Text>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleShare}
          activeOpacity={0.6}
        >
          <Ionicons name="share-outline" size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* ── Receipt Card ── */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Store Info */}
          <View style={styles.storeRow}>
            <View style={styles.storeIconWrap}>
              <Ionicons name="storefront-outline" size={20} color="#2563EB" />
            </View>
            <View>
              <Text style={styles.storeName}>Demo Store</Text>
              <Text style={styles.storeSub}>Soumen's Business</Text>
            </View>
          </View>

          {/* Amount and Paid Badge */}
          <View style={styles.amountSection}>
            <AmountDisplay
              amount={transaction.amount}
              currency={transaction.currency}
              size="xl"
              color="#0F172A"
            />
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>Paid</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Details list */}
          <View style={styles.detailsList}>
            {/* Date & Time */}
            <View style={styles.detailBlock}>
              <Text style={styles.fieldLabel}>Date & Time</Text>
              <Text style={styles.fieldValue}>21 Sep 2026, 09:41 AM</Text>
            </View>

            {/* Payment Method */}
            <View style={styles.detailBlock}>
              <Text style={styles.fieldLabel}>Payment Method</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.fieldValue}>
                  {transaction.paymentMethod} ({transaction.cardBrand} •••• {transaction.cardLast4})
                </Text>
                <VisaBadge />
              </View>
            </View>

            {/* Base Amount & Fee (if breakdown available) */}
            {transaction.originalAmount !== undefined && (
              <View style={styles.detailBlock}>
                <Text style={styles.fieldLabel}>Base Amount</Text>
                <Text style={styles.fieldValue}>
                  ${transaction.originalAmount.toFixed(2)}
                </Text>
              </View>
            )}

            {transaction.fee !== undefined && (
              <View style={styles.detailBlock}>
                <Text style={styles.fieldLabel}>Processing Fee (1.7% + Fixed)</Text>
                <Text style={styles.fieldValue}>
                  ${transaction.fee.toFixed(2)}
                </Text>
              </View>
            )}

            {/* Payment ID */}
            <View style={styles.detailBlock}>
              <Text style={styles.fieldLabel}>Payment ID</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.fieldValue}>{transaction.paymentId}</Text>
                <TouchableOpacity activeOpacity={0.6}>
                  <Ionicons name="copy-outline" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Powered by Stripe */}
          <View style={styles.stripeFooter}>
            <Text style={styles.poweredBy}>Powered by </Text>
            <Text style={styles.stripeBrand}>stripe</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

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
    marginBottom: 16,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  storeIconWrap: {
    width: 42,
    height: 42,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  storeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  paidBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginTop: 8,
  },
  paidText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  detailsList: {
    gap: 16,
  },
  detailBlock: {
    gap: 3,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  fieldValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stripeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 4,
  },
  poweredBy: {
    fontSize: 12,
    color: '#94A3B8',
  },
  stripeBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: -0.5,
  },
});

export default ReceiptScreen;
