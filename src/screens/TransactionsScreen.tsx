import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../constants/theme';
import { StatusBadge } from '../components/StatusBadge';
import { formatAUD } from '../utils/feeCalculator';

const MOCK_TRANSACTIONS = [
  {
    id: '1',
    amount: 101.80,
    currency: '$' as const,
    method: 'Tap to Pay',
    status: 'success' as const,
    cardBrand: 'Visa',
    cardLast4: '4242',
    storeName: 'Demo Store',
    timestamp: '21 Sep 2026, 09:41 AM',
    paymentId: 'pi_3N5x...8F2d',
  },
  {
    id: '2',
    amount: 35.00,
    currency: '$' as const,
    method: 'Card',
    status: 'success' as const,
    cardBrand: 'Mastercard',
    cardLast4: '5353',
    storeName: 'Demo Store',
    timestamp: '21 Sep 2026, 08:15 AM',
    paymentId: 'pi_4K7y...9G3e',
  },
  {
    id: '3',
    amount: 12.50,
    currency: '$' as const,
    method: 'Tap to Pay',
    status: 'failed' as const,
    cardBrand: 'Visa',
    cardLast4: '1111',
    storeName: 'Demo Store',
    timestamp: '20 Sep 2026, 05:22 PM',
    paymentId: 'pi_5L8z...1H4f',
  },
  {
    id: '4',
    amount: 102.00,
    currency: '$' as const,
    method: 'Card',
    status: 'success' as const,
    cardBrand: 'Amex',
    cardLast4: '0005',
    storeName: 'Demo Store',
    timestamp: '19 Sep 2026, 02:10 PM',
    paymentId: 'pi_6M9a...2I5g',
  },
];

const TransactionItem: React.FC<{ item: typeof MOCK_TRANSACTIONS[0] }> = ({ item }) => (
  <TouchableOpacity style={itemStyles.row} activeOpacity={0.7}>
    <View style={[itemStyles.iconWrap, { backgroundColor: item.status === 'success' ? '#DCFCE7' : '#FEE2E2' }]}>
      <Ionicons
        name={item.status === 'success' ? 'card-outline' : 'close-circle-outline'}
        size={18}
        color={item.status === 'success' ? '#16A34A' : '#EF4444'}
      />
    </View>
    <View style={itemStyles.info}>
      <Text style={itemStyles.cardText}>
        {item.method} • {item.cardBrand} •••• {item.cardLast4}
      </Text>
      <Text style={itemStyles.time}>{item.timestamp}</Text>
    </View>
    <View style={itemStyles.right}>
      <Text style={[itemStyles.amount, { color: item.status === 'success' ? '#0F172A' : '#EF4444' }]}>
        {formatAUD(item.amount)}
      </Text>
      <StatusBadge status={item.status === 'success' ? 'paid' : 'failed'} />
    </View>
  </TouchableOpacity>
);

const itemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  cardText: { fontSize: 13, fontWeight: '500', color: '#0F172A' },
  time: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '700' },
});

export const TransactionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24) + 16;

  const totalSuccess = MOCK_TRANSACTIONS
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.6}>
          <Ionicons name="options-outline" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total Collected</Text>
          <Text style={styles.summaryAmount}>{formatAUD(totalSuccess)}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#FFFFFF' }]}>3</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={[styles.statNum, { color: '#FCA5A5' }]}>1</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Recent Payments</Text>

      <View style={styles.listCard}>
        <FlatList
          data={MOCK_TRANSACTIONS}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <TransactionItem item={item} />}
          scrollEnabled={false}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  filterBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#2563EB',
    borderRadius: radius.xl,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statBorder: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.25)',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
});

export default TransactionsScreen;
