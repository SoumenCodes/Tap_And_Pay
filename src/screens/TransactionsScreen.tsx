import React, { useState, useEffect } from 'react';
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
import { radius } from '../constants/theme';
import { StatusBadge } from '../components/StatusBadge';
import { formatAUD } from '../utils/feeCalculator';
import { getTransactions, subscribeTransactions } from '../services/transactionStore';
import type { Transaction } from '../types';

const TransactionItem: React.FC<{ item: Transaction }> = ({ item }) => {
  const formattedTime = new Date(item.timestamp).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <TouchableOpacity style={itemStyles.row} activeOpacity={0.7}>
      <View
        style={[
          itemStyles.iconWrap,
          { backgroundColor: item.status === 'success' ? '#DCFCE7' : '#FEE2E2' },
        ]}
      >
        <Ionicons
          name={item.status === 'success' ? 'card-outline' : 'close-circle-outline'}
          size={18}
          color={item.status === 'success' ? '#16A34A' : '#EF4444'}
        />
      </View>
      <View style={itemStyles.info}>
        <Text style={itemStyles.cardText}>
          {item.paymentMethod} • {item.cardBrand} •••• {item.cardLast4}
        </Text>
        <Text style={itemStyles.time}>{formattedTime}</Text>
        <Text style={itemStyles.txnId} numberOfLines={1} ellipsizeMode="middle">
          {item.paymentId}
        </Text>
      </View>
      <View style={itemStyles.right}>
        <Text
          style={[
            itemStyles.amount,
            { color: item.status === 'success' ? '#0F172A' : '#EF4444' },
          ]}
        >
          {formatAUD(item.amount)}
        </Text>
        <StatusBadge status={item.status === 'success' ? 'paid' : 'failed'} />
      </View>
    </TouchableOpacity>
  );
};

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
  cardText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  time: { fontSize: 11, color: '#64748B', marginTop: 2 },
  txnId: { fontSize: 10, color: '#94A3B8', marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontWeight: '700' },
});

export const TransactionsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 24) + 16;

  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());

  useEffect(() => {
    // Keep transactions updated when new payments succeed
    const unsubscribe = subscribeTransactions(() => {
      setTransactions(getTransactions());
    });
    return unsubscribe;
  }, []);

  const totalSuccess = transactions
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  const successCount = transactions.filter((t) => t.status === 'success').length;
  const failedCount = transactions.filter((t) => t.status === 'failed').length;

  return (
    <View style={[styles.root, { paddingTop: topPadding, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total Collected</Text>
          <Text style={styles.summaryAmount}>{formatAUD(totalSuccess)}</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#FFFFFF' }]}>{successCount}</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
          <View style={[styles.stat, styles.statBorder]}>
            <Text style={[styles.statNum, { color: '#FCA5A5' }]}>{failedCount}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Recent Payments</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={44} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySub}>
            Live payments processed via Tap to Pay or Card will appear here with verified Stripe transaction IDs.
          </Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          <FlatList
            data={transactions}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => <TransactionItem item={item} />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
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
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  emptyCard: {
    flex: 1,
    maxHeight: 280,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default TransactionsScreen;
