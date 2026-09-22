import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import type { Currency } from '../types';

interface AmountDisplayProps {
  amount: number;
  currency?: Currency;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

function formatAmount(amount: number): string {
  if (amount === 0) return '0';
  const str = amount.toString();
  if (str.length <= 3) return str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = '₹',
  size = 'lg',
  color = colors.textPrimary,
}) => {
  const formatted = formatAmount(amount);

  const fontSize = size === 'sm' ? 20 : size === 'md' ? 28 : size === 'lg' ? 34 : 40;
  const currSize = size === 'sm' ? 16 : size === 'md' ? 22 : size === 'lg' ? 26 : 30;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={[styles.currency, { fontSize: currSize, color }]}>
          {currency}
        </Text>
        <Text style={[styles.integer, { fontSize, color }]}>
          {formatted}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currency: {
    fontWeight: '700',
    marginRight: 6,
  },
  integer: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

export default AmountDisplay;
