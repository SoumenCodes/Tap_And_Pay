import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

import { useTerminal } from '../context/TerminalContext';
import { radius } from '../constants/theme';
import { addTransaction } from '../services/transactionStore';
import type { RootStackParamList, Transaction } from '../types';

type ProcessingNavProp = NativeStackNavigationProp<RootStackParamList, 'Processing'>;
type ProcessingRouteProp = RouteProp<RootStackParamList, 'Processing'>;

interface ProcessingScreenProps {
  navigation: ProcessingNavProp;
  route: ProcessingRouteProp;
}

const RING_SIZE = 190;
const RADIUS = 88;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ─── Circular Progress Arc Ring matching Figma screen 3 ───
const ProcessingRing: React.FC = () => {
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

  const { runSimulatedPayment, statusMessage, errorMessage } = useTerminal();
  const [hasError, setHasError] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    async function process() {
      setHasError(false);
      setErrorText(null);

      const result = await runSimulatedPayment(amount, paymentMethod, feeBreakdown);

      if (isCancelled) return;

      if (result.success && result.paymentIntent) {
        const pi = result.paymentIntent;
        const charge = pi.charges?.[0];
        const cardDetails =
          charge?.paymentMethodDetails?.cardPresentDetails ||
          charge?.paymentMethodDetails?.cardDetails;

        const passedCard = route.params.cardDetails;
        const rawBrand = cardDetails?.brand || passedCard?.brand || 'Card';
        const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
        const last4 = cardDetails?.last4 || passedCard?.last4 || '••••';

        // Real Stripe Transaction ID (charge.id like ch_... or paymentIntent.id like pi_...)
        const realTxnId = charge?.id || pi.id || 'pi_terminal_' + Date.now();

        const transaction: Transaction = {
          id: realTxnId,
          amount,
          originalAmount: feeBreakdown?.originalAmount,
          fee: feeBreakdown?.totalFee,
          percentageFee: feeBreakdown?.percentageFee,
          fixedFee: feeBreakdown?.fixedFee,
          currency,
          status: 'success',
          paymentMethod: paymentMethod === 'tap' ? 'Tap to Pay' : 'Card',
          paymentMethodType: paymentMethod,
          cardLast4: last4,
          cardBrand: brand,
          paymentId: realTxnId,
          storeName: 'South Eastern Taxi Brokers',
          timestamp: new Date(),
        };

        // Record in transaction store
        addTransaction(transaction);

        setTimeout(() => {
          if (!isCancelled) {
            navigation.replace('Success', {
              amount,
              currency,
              transaction,
            });
          }
        }, 500);
      } else {
        setHasError(true);
        setErrorText(result.error || errorMessage || 'Payment could not be completed.');
      }
    }

    process();

    return () => {
      isCancelled = true;
    };
  }, [navigation, amount, currency, paymentMethod, feeBreakdown, runSimulatedPayment, retryCount, errorMessage]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
  };

  return (
    <View style={[styles.root, { paddingTop: topPadding, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {hasError ? (
        <View style={styles.centerContent}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.errorSubtitle}>{errorText}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.centerContent}>
          {/* Animated Processing Ring */}
          <ProcessingRing />

          {/* Labels below */}
          <Text style={styles.title}>
            {paymentMethod === 'tap' ? 'Processing payment...' : 'Authorizing card...'}
          </Text>
          <Text style={styles.subtitle}>
            {statusMessage && statusMessage !== 'Ready'
              ? statusMessage
              : paymentMethod === 'tap'
              ? "Please don't remove the card or phone."
              : 'Authorizing card transaction...'}
          </Text>
        </View>
      )}

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
    width: '100%',
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
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorIconWrap: {
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#F87171',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  actionRow: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 28,
    gap: 12,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: '#1E293B',
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
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
