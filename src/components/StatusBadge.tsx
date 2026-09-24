import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radius } from '../constants/theme';

interface StatusBadgeProps {
  status: 'paid' | 'pending' | 'failed' | 'cancelled';
}

const config = {
  paid: { bg: '#DCFCE7', text: '#15803D', label: 'Paid' },
  pending: { bg: '#FEF9C3', text: '#A16207', label: 'Pending' },
  failed: { bg: '#FEE2E2', text: '#DC2626', label: 'Failed' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelled' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const c = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.text, { color: c.text }]}>{c.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['1'],
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
});

export default StatusBadge;
