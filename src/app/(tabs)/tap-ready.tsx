import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import Svg, { Rect, Path, G, Defs, Filter, FeDropShadow } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

// ─── Tilted Phone + Card Tap Graphic Component ───
const TapIllustration: React.FC = () => {
  const [floatAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim]);

  return (
    <View style={illStyles.container}>
      {/* ── Smartphone Graphic ── */}
      <View style={illStyles.phoneContainer}>
        <Svg width="180" height="260" viewBox="0 0 180 260" fill="none">
          {/* Tilted phone body (approx 12 deg tilt) */}
          <G transform="rotate(12, 90, 130)">
            {/* Phone Base with Gold Border */}
            <Rect
              x="30"
              y="15"
              width="120"
              height="230"
              rx="26"
              fill="#181F2A"
              stroke="#F59E0B"
              strokeWidth="3.5"
            />
            {/* Top Ear Speaker Notch */}
            <Rect
              x="75"
              y="26"
              width="30"
              height="3.5"
              rx="1.75"
              fill="#334155"
            />
            {/* Contactless NFC Waves in Gold (top right of phone screen) */}
            <G transform="translate(100, 68) rotate(35)">
              <Path
                d="M0 0 Q6 -8 0 -16"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M5 3 Q14 -8 5 -19"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M10 6 Q22 -8 10 -22"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </G>
          </G>
        </Svg>
      </View>

      {/* ── Floating White Payment Card (Floating animation) ── */}
      <Animated.View
        style={[
          illStyles.cardWrapper,
          {
            transform: [{ translateY: floatAnim }],
          },
        ]}
      >
        <Svg width="170" height="120" viewBox="0 0 170 120" fill="none">
          <Defs>
            <Filter id="cardShadow" x="-10%" y="-10%" width="130%" height="130%">
              <FeDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.18" />
            </Filter>
          </Defs>
          {/* Tilted Card (approx -20 deg) */}
          <G transform="rotate(-20, 85, 60)">
            {/* Card Body */}
            <Rect
              x="25"
              y="25"
              width="120"
              height="75"
              rx="9"
              fill="#FFFFFF"
              stroke="#1E293B"
              strokeWidth="2"
              filter="url(#cardShadow)"
            />
            {/* Gold EMV Chip */}
            <Rect
              x="37"
              y="42"
              width="20"
              height="16"
              rx="3"
              fill="#F59E0B"
              stroke="#D97706"
              strokeWidth="1.2"
            />
            {/* Chip Grid Lines */}
            <Path d="M47 42 V58" stroke="#D97706" strokeWidth="1" />
            <Path d="M37 50 H57" stroke="#D97706" strokeWidth="1" />

            {/* Split Accent Line across card */}
            <Path
              d="M37 72 H75"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <Path
              d="M78 72 H110"
              stroke="#CBD5E1"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const illStyles = StyleSheet.create({
  container: {
    width: 260,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  phoneContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
    left: 8,
    top: 50,
    zIndex: 10,
  },
});

export default function TapReadyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ amount?: string }>();

  const rawAmount = params.amount || '1250';
  const numericAmount = parseFloat(rawAmount) || 0;

  // Format with commas: 1250 -> 1,250
  const formattedAmount =
    numericAmount >= 1000
      ? numericAmount.toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })
      : rawAmount;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 20 : 16) + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header with Back Chevron ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.6}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Main Content Matching Figma ── */}
      <View style={styles.content}>
        {/* Large Amount: $ 1,250 with cursor */}
        <View style={styles.amountWrap}>
          <Text style={styles.dollarSign}>$ </Text>
          <Text style={styles.amountText}>{formattedAmount}</Text>
          <View style={styles.cursorBar} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Ready for Payment</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Ask your customer to tap their card,{'\n'}phone or watch.
        </Text>

        {/* Tap Illustration */}
        <TapIllustration />
      </View>

      {/* ── Cancel Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: 20,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dollarSign: {
    fontSize: 36,
    fontWeight: '800',
    color: '#D97706', // Warm Gold
  },
  amountText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#0F172A', // Deep Black
    letterSpacing: -0.5,
  },
  cursorBar: {
    width: 2,
    height: 38,
    backgroundColor: '#CBD5E1',
    marginLeft: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 20,
  },
  footer: {
    paddingBottom: 8,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
});
