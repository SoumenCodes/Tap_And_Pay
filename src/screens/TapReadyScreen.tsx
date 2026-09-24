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
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { radius } from '../constants/theme';
import { config } from '../constants/config';
import { AmountDisplay } from '../components/AmountDisplay';
import { useTerminal } from '../context/TerminalContext';
import type { RootStackParamList } from '../types';

type TapReadyNavProp = NativeStackNavigationProp<RootStackParamList, 'TapReady'>;
type TapReadyRouteProp = RouteProp<RootStackParamList, 'TapReady'>;

interface TapReadyScreenProps {
  navigation: TapReadyNavProp;
  route: TapReadyRouteProp;
}

// ─── Contactless Wave Icon in soft blue circle ───
const ContactlessBadge: React.FC = () => {
  const [pulse] = useState(() => new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <Animated.View style={[badgeStyles.circle, { transform: [{ scale: pulse }] }]}>
      <Svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <Circle cx="18" cy="22" r="2.8" fill="#2563EB" />
        <Path
          d="M14 18 Q18 11 22 18"
          stroke="#2563EB"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M10 17 Q18 7 26 17"
          stroke="#2563EB"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
        />
        <Path
          d="M6 16 Q18 3 30 16"
          stroke="#2563EB"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
          opacity={0.3}
        />
      </Svg>
    </Animated.View>
  );
};

const badgeStyles = StyleSheet.create({
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Minimalist Hand + Card Tapping Phone Line-Art Illustration ───
const TapIllustration: React.FC<{ onPress: () => void; hintText?: string }> = ({
  onPress,
  hintText = 'Tap card or anywhere to simulate',
}) => {
  const [cardFloat] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardFloat, { toValue: -6, duration: 1000, useNativeDriver: true }),
        Animated.timing(cardFloat, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [cardFloat]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={illStyles.touchable}>
      <Svg width="260" height="200" viewBox="0 0 260 200" fill="none">
        {/* ── Smartphone (tilted on the right) ── */}
        <G transform="rotate(8, 175, 110)">
          {/* Phone body */}
          <Rect
            x="130"
            y="30"
            width="82"
            height="146"
            rx="16"
            fill="#1E293B"
            stroke="#0F172A"
            strokeWidth="2.5"
          />
          {/* Screen */}
          <Rect
            x="134"
            y="36"
            width="74"
            height="134"
            rx="12"
            fill="#334155"
          />
          {/* Contactless waves on phone screen */}
          <Circle cx="171" cy="74" r="2.5" fill="white" />
          <Path
            d="M165 71 Q171 65 177 71"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M161 70 Q171 59 181 70"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.65}
          />
          <Path
            d="M157 69 Q171 53 185 69"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />
        </G>

        {/* ── Hand holding credit card ── */}
        <G>
          {/* Arm and palm line-art */}
          <Path
            d="M10 135 C35 130 50 115 58 102 C64 92 68 85 75 80"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M18 152 C42 145 60 130 70 114"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Thumb */}
          <Path
            d="M60 98 C65 92 78 88 88 92 C94 95 98 102 96 108 C93 114 85 116 75 115"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="#FFFFFF"
          />
          {/* Fingers behind card */}
          <Path
            d="M80 82 C85 78 94 76 100 80 C104 83 105 88 103 93"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M90 77 C95 73 104 72 109 76 C113 79 114 84 112 89"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Credit Card in hand */}
          <G transform="rotate(-18, 90, 75)">
            <Rect
              x="52"
              y="46"
              width="80"
              height="50"
              rx="6"
              fill="#FFFFFF"
              stroke="#1E293B"
              strokeWidth="2"
            />
            {/* Chip */}
            <Rect
              x="62"
              y="60"
              width="14"
              height="11"
              rx="2.5"
              fill="#F8FAFC"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
            {/* Card lines */}
            <Path d="M62 78 H90" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            <Path d="M62 84 H80" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
          </G>
        </G>
      </Svg>
      <Text style={illStyles.tapHint}>{hintText}</Text>
    </TouchableOpacity>
  );
};

const illStyles = StyleSheet.create({
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 8,
  },
});

// ─── Main Tap Ready Screen ───
export const TapReadyScreen: React.FC<TapReadyScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 24) + 16;
  const { amount, currency, feeBreakdown } = route.params;

  const { initAndConnectSimulatedReader, connectedReader, isConnecting } = useTerminal();

  // Proactively connect to simulated reader on mount
  useEffect(() => {
    if (!connectedReader && !isConnecting) {
      initAndConnectSimulatedReader().catch(() => {});
    }
  }, [connectedReader, isConnecting, initAndConnectSimulatedReader]);

  const handleStartPayment = () => {
    navigation.navigate('Processing', {
      amount,
      currency,
      paymentMethod: 'tap',
      feeBreakdown,
    });
  };

  return (
    <View style={[styles.root, { paddingTop: topPadding, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header with Back Chevron ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.6}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* ── Main Content Area ── */}
      <View style={styles.content}>
        {/* Contactless Wave Badge */}
        <ContactlessBadge />

        {/* Title */}
        <Text style={styles.title}>Tap to Pay</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Ask your customer to tap their{'\n'}card, phone or watch.
        </Text>

        {/* Large Amount */}
        <View style={styles.amountWrap}>
          <AmountDisplay amount={amount} currency={currency} size="lg" color="#0F172A" />
        </View>

        {/* Tap Illustration */}
        <View style={styles.illustWrap}>
          <TapIllustration
            onPress={handleStartPayment}
            hintText={
              isConnecting
                ? config.simulatedReader
                  ? 'Connecting simulated reader...'
                  : 'Initializing device NFC reader...'
                : connectedReader
                ? config.simulatedReader
                  ? 'Simulated reader ready · Tap to pay'
                  : 'NFC Ready · Tap to begin card read'
                : config.simulatedReader
                ? 'Tap card or anywhere to simulate'
                : 'Tap to start contactless payment'
            }
          />
        </View>
      </View>

      {/* ── Cancel Button ── */}
      <View style={styles.bottomWrapper}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancel</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  amountWrap: {
    marginTop: 16,
    marginBottom: 16,
  },
  illustWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomWrapper: {
    marginBottom: 6,
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
});

export default TapReadyScreen;
