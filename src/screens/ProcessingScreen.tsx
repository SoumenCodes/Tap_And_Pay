import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import type { RootStackParamList, Transaction, Currency } from '../types';
import type { FeeBreakdown, PaymentMethodType } from '../utils/feeCalculator';

type ProcessingNavProp = NativeStackNavigationProp<RootStackParamList, 'Processing'>;
type ProcessingRouteProp = RouteProp<RootStackParamList, 'Processing'>;

interface ProcessingScreenProps {
  navigation: ProcessingNavProp;
  route: ProcessingRouteProp;
}

function makeMockTransaction(
  amount: number,
  currency: Currency,
  paymentMethod: PaymentMethodType,
  feeBreakdown?: FeeBreakdown
): Transaction {
  const isTap = paymentMethod === 'tap';
  return {
    id: 'tx_' + Math.random().toString(36).substring(2, 9),
    amount,
    originalAmount: feeBreakdown?.originalAmount,
    fee: feeBreakdown?.totalFee,
    percentageFee: feeBreakdown?.percentageFee,
    fixedFee: feeBreakdown?.fixedFee,
    currency,
    status: 'success',
    paymentMethod: isTap ? 'Tap to Pay' : 'Card',
    paymentMethodType: paymentMethod,
    cardLast4: '4242',
    cardBrand: 'Visa',
    paymentId: 'pi_3N5x...8F2d',
    storeName: 'Demo Store',
    timestamp: new Date(),
  };
}

const RING_SIZE = 190;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Circular Progress Arc Ring matching Figma screen 3 ───
const ProcessingRing: React.FC = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

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

  return (
    <View style={ringStyles.container}>
      {/* Outer rotating blue accent arc */}
      <Animated.View style={[ringStyles.rotatingRing, { transform: [{ rotate: spin }] }]}>
        <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          {/* Base muted ring */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#1E293B"
            strokeWidth={5}
            fill="none"
          />
          {/* Active bright blue progress arc */}
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke="#2563EB"
            strokeWidth={5}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE * 0.65} ${CIRCUMFERENCE * 0.35}`}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Inner Dark Circular Hub */}
      <View style={ringStyles.innerHub}>
        {/* Contactless waves in crisp white */}
        <Svg width="54" height="54" viewBox="0 0 54 54" fill="none">
          <Circle cx="27" cy="33" r="3.2" fill="white" />
          <Path
            d="M21 28 Q27 18 33 28"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M16 27 Q27 12 38 27"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity={0.65}
          />
          <Path
            d="M11 26 Q27 6 43 26"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity={0.35}
          />
        </Svg>
      </View>
    </View>
  );
};

const ringStyles = StyleSheet.create({
  container: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  innerHub: {
    width: RING_SIZE - 20,
    height: RING_SIZE - 20,
    borderRadius: (RING_SIZE - 20) / 2,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Main Processing Screen ───
export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const topPadding =
    Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 24) + 16;
  const { amount, currency, paymentMethod, feeBreakdown } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Success', {
        amount,
        currency,
        transaction: makeMockTransaction(amount, currency, paymentMethod, feeBreakdown),
      });
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigation, amount, currency, paymentMethod, feeBreakdown]);

  return (
    <View style={[styles.root, { paddingTop: topPadding, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      <View style={styles.centerContent}>
        {/* Animated Processing Ring */}
        <ProcessingRing />

        {/* Labels below */}
        <Text style={styles.title}>Processing payment...</Text>
        <Text style={styles.subtitle}>
          {paymentMethod === 'tap'
            ? "Please don't remove the card or phone."
            : 'Authorizing card transaction...'}
        </Text>
      </View>

      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 34,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  homeIndicator: {
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 2,
    marginBottom: 6,
  },
});

export default ProcessingScreen;
