import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { colors, radius, spacing, typography } from '../constants/theme';

interface PaymentCardLogosProps {
  size?: 'sm' | 'md' | 'lg';
  horizontal?: boolean;
}

// ─── Visa SVG ─────────────────────────────────────────────────────────────────
const VisaCard: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 42 28" fill="none">
    <Rect width="42" height="28" rx="4" fill="#1A1F71" />
    <Path
      d="M17 19l2.5-10h2.5l-2.5 10H17zm11.5-10c-.5-.2-1.3-.4-2.2-.4-2.4 0-4.1 1.3-4.1 3.1 0 1.4 1.2 2.1 2.2 2.6 1 .5 1.3.8 1.3 1.2 0 .6-.8 1-1.5 1-.9 0-1.5-.1-2.3-.5l-.3-.2-.3 2c.6.2 1.6.5 2.7.5 2.6 0 4.3-1.3 4.3-3.2 0-1-.6-1.9-2-2.5-.8-.4-1.3-.7-1.3-1.1 0-.4.4-.8 1.3-.8.7 0 1.3.1 1.7.3l.2.1.3-1.9zM32.5 9h-1.9c-.6 0-1 .2-1.3.7L26 19h2.6l.5-1.5h3.2l.3 1.5H35L32.5 9zm-3.1 6.5l1-2.7.5 2.7h-1.5zM14.5 9l-2.4 6.8-.3-1.3c-.5-1.6-1.8-3.3-3.3-4.2L10.8 19h2.7L17.2 9h-2.7z"
      fill="white"
    />
    <Path
      d="M9.5 9H5.5L5.4 9.2c3.2.8 5.3 2.8 6.2 5.1L10.6 9.7C10.4 9.2 10 9 9.5 9z"
      fill="#F9A51A"
    />
  </Svg>
);

// ─── Mastercard SVG ────────────────────────────────────────────────────────────
const MastercardCard: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 42 28" fill="none">
    <Rect width="42" height="28" rx="4" fill="#252525" />
    <Circle cx="16" cy="14" r="7" fill="#EB001B" />
    <Circle cx="26" cy="14" r="7" fill="#F79E1B" />
    <Path
      d="M21 9.5a7 7 0 0 1 0 9A7 7 0 0 1 21 9.5z"
      fill="#FF5F00"
    />
  </Svg>
);

// ─── Amex SVG ─────────────────────────────────────────────────────────────────
const AmexCard: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 42 28" fill="none">
    <Rect width="42" height="28" rx="4" fill="#006FCF" />
    <G>
      <Path
        d="M8 10h4.5l1 2.2 1-2.2H19v.8l-.7-2H14l-1.2 2.8h-.7L11 10.8V10H8v8h3v-2h.5l.5 2H14l.5-2h.5v2h3V13l1.5 5H21l1.5-5V18h2V10h-3.5l-1.3 3-1.3-3H15v.8l-.5-1.3L14 11l-.5.5L13 10H8z"
        fill="white"
      />
    </G>
  </Svg>
);

const sizeDims = {
  sm: { width: 32, height: 22 },
  md: { width: 42, height: 28 },
  lg: { width: 56, height: 37 },
};

export const PaymentCardLogos: React.FC<PaymentCardLogosProps> = ({
  size = 'md',
  horizontal = true,
}) => {
  const dims = sizeDims[size];

  return (
    <View style={[styles.container, horizontal && styles.horizontal]}>
      <View style={styles.logo}>
        <VisaCard width={dims.width} height={dims.height} />
      </View>
      <View style={styles.logo}>
        <MastercardCard width={dims.width} height={dims.height} />
      </View>
      <View style={styles.logo}>
        <AmexCard width={dims.width} height={dims.height} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing['2'],
  },
  horizontal: {
    flexDirection: 'row',
  },
  logo: {
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
});

export default PaymentCardLogos;
