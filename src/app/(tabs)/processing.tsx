import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

const RING_SIZE = 210;
const STROKE_WIDTH = 5.5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProcessingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string; method?: string }>();

  // Continuous smooth linear rotation of the gold arc
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Simulating payment completion and transition
  const hasFinishedRef = useRef(false);
  useEffect(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    const timer = setTimeout(() => {
      // Transition to screen 13 (Payment Successful)
      router.replace({
        pathname: '/(tabs)/payment-success',
        params: {
          amount: params.amount || '1250',
          method: params.method || 'tap',
        },
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [router, params.amount, params.method]);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Central Processing Container ── */}
      <View style={styles.centerSection}>
        {/* Circle with Radial Glow, Rotating Dual-Tone Arc, and Unicorn */}
        <View style={styles.circleContainer}>
          {/* Inner Soft Warm Radial Glow */}
          <Svg
            width={RING_SIZE}
            height={RING_SIZE}
            viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
            style={styles.glowSvg}
          >
            <Defs>
              <RadialGradient
                id="innerGlow"
                cx="50%"
                cy="50%"
                rx="50%"
                ry="50%"
                fx="50%"
                fy="50%"
              >
                <Stop offset="0%" stopColor="#FEF9C3" stopOpacity="0.85" />
                <Stop offset="65%" stopColor="#FFFBEB" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS - STROKE_WIDTH / 2}
              fill="url(#innerGlow)"
            />
          </Svg>

          {/* Rotating Two-Tone Ring (Dark Navy with Gold Active Arc) */}
          <Animated.View
            style={[
              styles.rotatingRing,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
              {/* Dark Navy Base Ring (~65% arc visible) */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#1E293B"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              {/* Vibrant Gold Active Progress Segment (~35% of circle) */}
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#F59E0B"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${CIRCUMFERENCE * 0.35} ${CIRCUMFERENCE * 0.65}`}
                strokeDashoffset={CIRCUMFERENCE * 0.1}
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Centered SE PAY Unicorn Mascot Emblem */}
          <View style={styles.unicornWrap}>
            <Image
              source={require('../../../assets/se_pay_unicorn.png')}
              style={styles.unicornImage}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* ── Status Text (100% Figma Match) ── */}
        <Text style={styles.title}>Processing payment...</Text>
        <Text style={styles.subtitle}>{"Please don't remove the card."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 24,
  },
  circleContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 44,
  },
  glowSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  rotatingRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    top: 0,
    left: 0,
  },
  unicornWrap: {
    position: 'absolute',
    width: 82,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  unicornImage: {
    width: 82,
    height: 110,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
});
