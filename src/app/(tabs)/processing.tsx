import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useTerminal } from '../../context/TerminalContext';
import { addTransaction } from '../../services/transactionStore';
import { calculateFee, type PaymentMethodType } from '../../utils/feeCalculator';
import { paymentSession } from '../../services/paymentSession';
import { dashboardService } from '../../services/dashboardService';

const RING_SIZE = 210;
const STROKE_WIDTH = 5.5;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ProcessingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    amount?: string;
    method?: string;
    cardInput?: string;
    pickup?: string;
    dropoff?: string;
  }>();

  const { runSimulatedPayment, statusMessage, errorMessage } = useTerminal();
  const [isFailed, setIsFailed] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const rawAmount = params.amount || '0';
  const numericAmount = parseFloat(rawAmount) || 0;
  const paymentMethod: PaymentMethodType = params.method === 'card' ? 'card' : 'tap';

  const parsedCardInput = useMemo(() => {
    if (!params.cardInput) return undefined;
    try {
      return JSON.parse(params.cardInput);
    } catch {
      return undefined;
    }
  }, [params.cardInput]);

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

  const paymentStateRef = useRef({
    numericAmount,
    rawAmount,
    paymentMethod,
    parsedCardInput,
    pickup: params.pickup || '',
    dropoff: params.dropoff || '',
    runSimulatedPayment,
    router,
  });

  useEffect(() => {
    paymentStateRef.current = {
      numericAmount,
      rawAmount,
      paymentMethod,
      parsedCardInput,
      pickup: params.pickup || '',
      dropoff: params.dropoff || '',
      runSimulatedPayment,
      router,
    };
  });

  const [executionToken, setExecutionToken] = useState(0);
  const hasExecutedRef = useRef(false);

  // Every time processing screen gains focus, reset execution state and trigger fresh process
  useFocusEffect(
    useCallback(() => {
      hasExecutedRef.current = false;
      setIsFailed(false);
      setErrorReason(null);
      setExecutionToken((t) => t + 1);

      return () => {
        hasExecutedRef.current = false;
      };
    }, [])
  );

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    async function process() {
      const {
        numericAmount: amt,
        rawAmount: rawAmt,
        paymentMethod: method,
        parsedCardInput: cardInput,
        pickup,
        dropoff,
        runSimulatedPayment: executePayment,
        router: navRouter,
      } = paymentStateRef.current;

      try {
        const feeBreakdown = calculateFee(amt, method);
        const result = await executePayment(amt, method, feeBreakdown, cardInput);

        if (result.success && result.paymentIntent) {
          const pi = result.paymentIntent;
          const charge = pi.charges?.[0];
          const cardDetails =
            charge?.paymentMethodDetails?.cardPresentDetails ||
            charge?.paymentMethodDetails?.cardDetails;

          const rawBrand = cardDetails?.brand || (cardInput ? 'Card' : 'Contactless');
          const brand = rawBrand.charAt(0).toUpperCase() + rawBrand.slice(1);
          const last4 = cardDetails?.last4 || cardInput?.number?.slice(-4) || '••••';
          const realTxnId = charge?.id || pi.paymentIntentId || pi.id || `pi_${Date.now()}`;
          const timestamp = new Date().toISOString();

          addTransaction({
            id: realTxnId,
            amount: amt,
            originalAmount: amt,
            fee: feeBreakdown.totalFee,
            percentageFee: feeBreakdown.percentageFee,
            fixedFee: feeBreakdown.fixedFee,
            currency: '$',
            status: 'success',
            paymentMethod: method === 'tap' ? 'Tap to Pay' : 'Card',
            paymentMethodType: method,
            cardLast4: last4,
            cardBrand: brand,
            paymentId: realTxnId,
            storeName: 'SE PAY',
            timestamp,
          });

          // Proactively refresh dashboard and notify payment listeners
          paymentSession.markPaymentCompleted();
          dashboardService.getDashboard().catch(() => {});

          // Transition to Payment Successful screen after brief display of success state
          setTimeout(() => {
            navRouter.replace({
              pathname: '/(tabs)/payment-success',
              params: {
                amount: rawAmt,
                method,
                paymentId: realTxnId,
                cardLast4: last4,
                cardBrand: brand,
                timestamp,
                pickup,
                dropoff,
              },
            });
          }, 450);
        } else {
          setIsFailed(true);
          setErrorReason(result.error || errorMessage || 'Payment could not be completed.');
        }
      } catch (err: any) {
        setIsFailed(true);
        setErrorReason(err?.message || 'An unexpected error occurred while processing payment.');
      }
    }

    process();
  }, [executionToken, retryCount, errorMessage]);

  const handleRetry = () => {
    hasExecutedRef.current = false;
    setIsFailed(false);
    setErrorReason(null);
    setRetryCount((c) => c + 1);
  };

  const handleCancel = () => {
    hasExecutedRef.current = false;
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/tap-to-pay');
    }
  };

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

      {isFailed ? (
        <View style={styles.centerSection}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="close-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.title}>Payment Failed</Text>
          <Text style={styles.errorSubtitle}>{errorReason}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* ── Central Processing Container ── */
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

          {/* ── Status Text ── */}
          <Text style={styles.title}>{statusMessage || 'Processing payment...'}</Text>
          <Text style={styles.subtitle}>{"Please don't remove or move the card."}</Text>
        </View>
      )}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  errorIconWrap: {
    marginBottom: 16,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 28,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  retryBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});
