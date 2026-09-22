import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../constants/theme';

interface NfcIconProps {
  size?: number;
  color?: string;
  animate?: boolean;
}

export const NfcIcon: React.FC<NfcIconProps> = ({
  size = 56,
  color = colors.primary,
  animate = false,
}) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animate, pulse]);

  return (
    <Animated.View style={{ transform: [{ scale: pulse }] }}>
      <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
        <Circle cx="28" cy="33" r="4" fill={color} />
        <Path d="M22 28 Q28 19 34 28" stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <Path d="M17 28 Q28 13 39 28" stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity={0.6} />
        <Path d="M12 28 Q28 7 44 28" stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none" opacity={0.3} />
      </Svg>
    </Animated.View>
  );
};

export const NfcCircleIcon: React.FC<{ size?: number }> = ({ size = 96 }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, transform: [{ scale: pulse }] }]}>
      <NfcIcon size={size * 0.6} color={colors.primary} animate />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.nfcCircleBg,
    borderWidth: 1.5,
    borderColor: colors.nfcCircleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NfcIcon;
