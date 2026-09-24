import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { radius } from '../constants/theme';
import { AmountDisplay } from '../components/AmountDisplay';
import type { RootStackParamList } from '../types';

type SuccessNavProp = NativeStackNavigationProp<RootStackParamList, 'Success'>;
type SuccessRouteProp = RouteProp<RootStackParamList, 'Success'>;

interface SuccessScreenProps {
  navigation: SuccessNavProp;
  route: SuccessRouteProp;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24) + 24;
  const { amount, currency, transaction } = route.params;

  const [scaleCheck] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(scaleCheck, {
      toValue: 1,
      tension: 180,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [scaleCheck]);

  const handleNewPayment = () => {
    navigation.navigate('Main');
  };

  const handleViewReceipt = () => {
    navigation.navigate('Receipt', { transaction });
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

      {/* ── Main Top Info ── */}
      <View style={styles.topSection}>
        {/* Animated Green Checkmark Badge */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleCheck }] }]}>
          <Ionicons name="checkmark" size={38} color="#FFFFFF" />
        </Animated.View>

        <Text style={styles.title}>Payment Successful</Text>

        <View style={styles.amountWrap}>
          <AmountDisplay amount={amount} currency={currency} size="lg" color="#0F172A" />
        </View>

        <Text style={styles.dateText}>
          {new Date(transaction.timestamp).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </View>

      {/* ── Payment Details Card ── */}
      <View style={styles.card}>
        {/* Row 1: Method & Card info */}
        <View style={styles.row}>
          <Ionicons name="card-outline" size={18} color="#64748B" />
          <Text style={styles.rowText}>
            {transaction.paymentMethod}: {transaction.cardBrand} •••• {transaction.cardLast4}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Row 2: Store info */}
        <View style={styles.row}>
          <Ionicons name="storefront-outline" size={18} color="#64748B" />
          <Text style={styles.rowText}>{transaction.storeName || 'South Eastern Taxi Brokers'}</Text>
        </View>

        <View style={styles.divider} />

        {/* Row 3: Transaction ID */}
        <View style={styles.row}>
          <Ionicons name="receipt-outline" size={18} color="#64748B" />
          <View style={styles.paymentIdCol}>
            <Text style={styles.paymentIdLabel}>Transaction ID</Text>
            <Text style={styles.paymentIdValue} numberOfLines={1} ellipsizeMode="middle" selectable>
              {transaction.paymentId}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.newPaymentBtn}
          onPress={handleNewPayment}
          activeOpacity={0.85}
        >
          <Text style={styles.newPaymentText}>New Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.receiptBtn}
          onPress={handleViewReceipt}
          activeOpacity={0.7}
        >
          <Text style={styles.receiptBtnText}>View Receipt</Text>
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
  topSection: {
    alignItems: 'center',
    paddingTop: 10,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  amountWrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  rowText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0F172A',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  paymentIdCol: {
    flex: 1,
  },
  paymentIdLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  paymentIdValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  bottomActions: {
    gap: 10,
    marginBottom: 6,
  },
  newPaymentBtn: {
    backgroundColor: '#2563EB',
    borderRadius: radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPaymentText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  receiptBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptBtnText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default SuccessScreen;
