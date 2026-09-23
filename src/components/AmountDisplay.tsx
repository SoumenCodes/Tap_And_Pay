import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import type { Currency } from '../types';

interface AmountDisplayProps {
  amount?: number;
  displayValue?: string;
  currency?: Currency;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

function formatWithCommas(str: string): string {
  if (!str) return '0';
  if (str.includes('.')) {
    const [intPart, decPart] = str.split('.');
    const parsed = parseInt(intPart || '0', 10);
    const formattedInt = isNaN(parsed) ? '0' : parsed.toLocaleString('en-US');
    return `${formattedInt}.${decPart}`;
  }
  const parsed = parseInt(str, 10);
  return isNaN(parsed) ? '0' : parsed.toLocaleString('en-US');
}

function formatNumber(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  displayValue,
  currency = '$',
  size = 'lg',
  color = colors.textPrimary,
}) => {
  const formatted =
    displayValue !== undefined
      ? formatWithCommas(displayValue)
      : formatNumber(amount ?? 0);

  const fontSize = size === 'sm' ? 20 : size === 'md' ? 28 : size === 'lg' ? 34 : 42;
  const currSize = size === 'sm' ? 18 : size === 'md' ? 26 : size === 'lg' ? 32 : 40;

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
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  currency: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  integer: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});

export default AmountDisplay;
