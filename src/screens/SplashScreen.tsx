import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';

import type { RootStackParamList } from '../types';

type SplashNavProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface SplashScreenProps {
  navigation: SplashNavProp;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.92));
  const [footerAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate to Main after 2.0s
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, footerAnim, navigation]);

  const handleSkip = () => {
    navigation.replace('Main');
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleSkip}
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 24) + 16,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top spacer */}
      <View style={styles.topSpacer} />

      {/* ── Center Brand Logo & Info ── */}
      <Animated.View
        style={[
          styles.centerWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Official Taxi Logo */}
        <Image
          source={require('../../assets/taxi-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Subtitle / Tagline */}
        <Text style={styles.tagline}>
          TAP TO PAY &middot; CONTACTLESS CHECKOUT
        </Text>

        {/* Decorative Amber Accent Line */}
        <View style={styles.accentLineWrap}>
          <View style={styles.accentDot} />
          <View style={styles.accentBar} />
          <View style={styles.accentDot} />
        </View>
      </Animated.View>

      {/* ── Bottom Section: Contactless Badge & Powered by Stripe ── */}
      <Animated.View style={[styles.bottomWrap, { opacity: footerAnim }]}>
        {/* Contactless pill badge */}
        <View style={styles.contactlessBadge}>
          <Svg width="18" height="18" viewBox="0 0 36 36" fill="none">
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
          <Text style={styles.contactlessText}>Tap to Pay on Android</Text>
        </View>

        {/* Powered by Stripe */}
        <View style={styles.stripeWrap}>
          <Text style={styles.poweredText}>Powered by </Text>
          <Text style={styles.stripeText}>stripe</Text>
          <Text style={styles.terminalText}> Terminal</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topSpacer: {
    height: 40,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: 290,
    height: 145,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.8,
    marginTop: 4,
    textAlign: 'center',
  },
  accentLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  accentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  accentBar: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#F59E0B',
  },
  bottomWrap: {
    alignItems: 'center',
    gap: 12,
  },
  contactlessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  contactlessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    letterSpacing: 0.2,
  },
  stripeWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  poweredText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  stripeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: -0.5,
  },
  terminalText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default SplashScreen;
