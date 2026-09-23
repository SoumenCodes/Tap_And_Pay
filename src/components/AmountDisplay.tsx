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

function formatAUDAmount(amount: number): string {
  return amount.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  currency = 'A$',
  size = 'lg',
  color = colors.textPrimary,
}) => {
  const formatted = formatAUDAmount(amount);

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
