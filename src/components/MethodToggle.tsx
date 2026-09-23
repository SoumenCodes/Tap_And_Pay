import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import type { PaymentMethodType } from '../utils/feeCalculator';

interface MethodToggleProps {
  selectedMethod: PaymentMethodType;
  onSelectMethod: (method: PaymentMethodType) => void;
}

// Crisp contactless icon
const ContactlessIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <Circle cx="8" cy="12" r="1.8" fill={color} />
    <Path
      d="M12 7 C14.5 9 14.5 15 12 17"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M16 4.5 C19.5 7.5 19.5 16.5 16 19.5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      fill="none"
    />
  </Svg>
);

// Crisp card icon
const CardIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width="20" height="16" viewBox="0 0 20 16" fill="none">
    <Rect
      x="1"
      y="1"
      width="18"
      height="14"
      rx="3"
      stroke={color}
      strokeWidth="1.8"
      fill="none"
    />
    <Path d="M1 5.5 H19" stroke={color} strokeWidth="1.8" />
    <Rect x="4" y="9.5" width="3" height="2" rx="0.5" fill={color} />
  </Svg>
);

export const MethodToggle: React.FC<MethodToggleProps> = ({
  selectedMethod,
  onSelectMethod,
}) => {
  const isTap = selectedMethod === 'tap';

  return (
    <View style={styles.container}>
      {/* Left Segment: Tap */}
      <TouchableOpacity
        style={[styles.segment, styles.leftSegment, isTap && styles.activeSegment]}
        onPress={() => onSelectMethod('tap')}
        activeOpacity={0.8}
      >
        <ContactlessIcon color={isTap ? '#2563EB' : '#1E293B'} />
        <Text style={[styles.label, isTap ? styles.activeLabel : styles.inactiveLabel]}>
          Tap
        </Text>
      </TouchableOpacity>

      {/* Center divider line */}
      <View style={styles.divider} />

      {/* Right Segment: Card */}
      <TouchableOpacity
        style={[styles.segment, styles.rightSegment, !isTap && styles.activeSegment]}
        onPress={() => onSelectMethod('card')}
        activeOpacity={0.8}
      >
        <CardIcon color={!isTap ? '#2563EB' : '#1E293B'} />
        <Text style={[styles.label, !isTap ? styles.activeLabel : styles.inactiveLabel]}>
          Card
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: 236,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  leftSegment: {
    borderTopLeftRadius: 21,
    borderBottomLeftRadius: 21,
  },
  rightSegment: {
    borderTopRightRadius: 21,
    borderBottomRightRadius: 21,
  },
  activeSegment: {
    backgroundColor: '#DCEBFE',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#CBD5E1',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  activeLabel: {
    color: '#2563EB',
  },
  inactiveLabel: {
    color: '#1E293B',
  },
});

export default MethodToggle;
