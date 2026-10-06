import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  Vibration,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Svg, Path, Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaymentMethod = 'tap' | 'card' | 'cash';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'backspace'],
];

export default function TapToPayEnterAmountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  // Selected payment method (default: 'card' to match Figma design)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');

  // Amount string state (default '1250' from Figma design)
  const [amountStr, setAmountStr] = useState<string>('0');

  // Blinking cursor state
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 600);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = (key: string) => {
    try {
      Vibration.vibrate(8);
    } catch {
      // ignore
    }

    setAmountStr((prev) => {
      if (key === 'backspace') {
        if (prev.length <= 1) return '0';
        return prev.slice(0, -1);
      }

      if (key === '.') {
        if (prev.includes('.')) return prev;
        return prev + '.';
      }

      // If current is '0', replace with new key
      if (prev === '0') {
        return key;
      }

      // Max 2 decimals if dot present
      if (prev.includes('.')) {
        const [, dec] = prev.split('.');
        if (dec && dec.length >= 2) return prev;
      }

      // Max 7 integer digits
      if (prev.replace('.', '').length >= 7) return prev;

      return prev + key;
    });
  };

  const handleContinue = () => {
    const num = parseFloat(amountStr) || 0;
    console.log('Continue with amount:', {
      amount: num,
      method: selectedMethod,
      business: user.businessName,
    });
  };

  const handleCancel = () => {
    router.back();
  };

  // Format with commas: e.g. 1250 -> 1,250 or 1250.50 -> 1,250.50
  const formatDisplayAmount = () => {
    if (!amountStr || amountStr === '0') return '0';
    if (amountStr.includes('.')) {
      const [intPart, decPart] = amountStr.split('.');
      const formattedInt = parseInt(intPart || '0', 10).toLocaleString('en-US');
      return `${formattedInt}.${decPart}`;
    }
    const parsed = parseInt(amountStr, 10);
    return isNaN(parsed) ? '0' : parsed.toLocaleString('en-US');
  };

  const displayAmount = formatDisplayAmount();
  const numericAmount = parseFloat(amountStr) || 0;
  const isValid = numericAmount > 0;

  // Header content by active method
  const getHeaderInfo = () => {
    switch (selectedMethod) {
      case 'card':
        return {
          title: 'Card Payment',
          subtitle: 'Accept secure card payments.',
        };
      case 'tap':
        return {
          title: 'Tap to Pay',
          subtitle: 'Accept contactless payments.',
        };
      case 'cash':
        return {
          title: 'Cash Payment',
          subtitle: 'Accept secure cash payments.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  // Merchant details based on login role
  const isOtherBusiness = user.loginType === 'other_business';
  const merchantTitle = isOtherBusiness ? 'Crown Cuts' : user.name || 'Lovedeep Khangura';
  const merchantSubtitle = isOtherBusiness
    ? "Soumen's Business"
    : `Taxi No. ${user.taxiNumber || 'M6061'}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── 1. Header Bar with Back Arrow, Title, Subtitle & Settings Circle ── */}
      <View
        style={[
          styles.headerSection,
          {
            paddingTop: Math.max(insets.top, 20) + 6,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>{headerInfo.title}</Text>
          <Text style={styles.headerSubtitle}>{headerInfo.subtitle}</Text>
        </View>

        {/* Right Settings Circle */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.settingsCircle}
          onPress={() => console.log('Settings clicked')}
        >
          <Ionicons name="settings-sharp" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.contentWrap}>
        {/* ── 2. Three-Method Toggle Capsule: [ •))) Tap & Go | 💳 Card | 💵 Cash ] ── */}
        <View style={styles.methodCapsuleOuter}>
          {/* Tap & Go */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedMethod('tap')}
            style={[
              styles.methodSegment,
              selectedMethod === 'tap' && styles.methodSegmentActive,
            ]}
          >
            <Svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <Circle
                cx="8"
                cy="12"
                r="1.8"
                fill={selectedMethod === 'tap' ? '#0F172A' : '#475569'}
              />
              <Path
                d="M12 7 C14.5 9 14.5 15 12 17"
                stroke={selectedMethod === 'tap' ? '#0F172A' : '#475569'}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
              <Path
                d="M16 4.5 C19.5 7.5 19.5 16.5 16 19.5"
                stroke={selectedMethod === 'tap' ? '#0F172A' : '#475569'}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />
            </Svg>
            <Text
              style={[
                styles.methodLabel,
                selectedMethod === 'tap' && styles.methodLabelActive,
              ]}
            >
              Tap & Go
            </Text>
          </TouchableOpacity>

          {/* Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedMethod('card')}
            style={[
              styles.methodSegment,
              selectedMethod === 'card' && styles.methodSegmentActive,
            ]}
          >
            <Feather
              name="credit-card"
              size={14}
              color={selectedMethod === 'card' ? '#0F172A' : '#475569'}
            />
            <Text
              style={[
                styles.methodLabel,
                selectedMethod === 'card' && styles.methodLabelActive,
              ]}
            >
              Card
            </Text>
          </TouchableOpacity>

          {/* Cash */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setSelectedMethod('cash')}
            style={[
              styles.methodSegment,
              selectedMethod === 'cash' && styles.methodSegmentActive,
            ]}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={selectedMethod === 'cash' ? '#0F172A' : '#475569'}
            />
            <Text
              style={[
                styles.methodLabel,
                selectedMethod === 'cash' && styles.methodLabelActive,
              ]}
            >
              Cash
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Merchant Card with Gold Border & Logo ── */}
        <View style={styles.merchantCard}>
          <View style={styles.badgeWrap}>
            {isOtherBusiness ? (
              <Image
                source={require('../../../assets/crown_cuts_badge_hd.png')}
                style={styles.crownBadgeImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('../../../assets/taxi-logo.png')}
                style={styles.crownBadgeImage}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={styles.merchantTextCol}>
            <Text style={styles.merchantTitleText}>{merchantTitle}</Text>
            <Text style={styles.merchantSubtitleText}>{merchantSubtitle}</Text>
          </View>
        </View>

        {/* ── 4. Centered Amount to Charge Display ── */}
        <View style={styles.amountDisplayArea}>
          <Text style={styles.amountLabel}>AMOUNT TO CHARGE</Text>

          <View style={styles.amountRow}>
            <Text style={styles.dollarSign}>$</Text>
            <Text style={styles.amountDigits}>{displayAmount}</Text>
            <View
              style={[
                styles.cursorBar,
                { opacity: cursorVisible ? 1 : 0 },
              ]}
            />
          </View>
        </View>

        {/* ── 5. Action Buttons: Continue (Black) & Cancel ── */}
        <View style={styles.buttonsWrap}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleContinue}
            disabled={!isValid}
            style={[
              styles.continueButton,
              !isValid && styles.continueButtonDisabled,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCancel}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* ── 6. On-Screen Custom Numeric Keypad (POC Style) ── */}
        <View style={styles.keypadContainer}>
          {KEYPAD_ROWS.map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((k) => (
                <TouchableOpacity
                  key={k}
                  style={styles.keypadKey}
                  activeOpacity={0.55}
                  onPress={() => handleKeyPress(k)}
                >
                  {k === 'backspace' ? (
                    <Ionicons name="backspace-outline" size={22} color="#0F172A" />
                  ) : k === '.' ? (
                    <Text style={[styles.keyText, styles.dotKeyText]}>.</Text>
                  ) : (
                    <Text style={styles.keyText}>{k}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitleWrap: {
    alignItems: 'center',
    gap: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0050B6',
  },
  settingsCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 10,
  },
  methodCapsuleOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 24,
    padding: 4,
    width: Math.min(SCREEN_WIDTH - 40, 340),
    alignSelf: 'center',
  },
  methodSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 20,
    gap: 6,
  },
  methodSegmentActive: {
    backgroundColor: '#FBBF24',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  methodLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  badgeWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  crownBadgeImage: {
    width: '100%',
    height: '100%',
  },
  merchantTextCol: {
    flex: 1,
    gap: 2,
  },
  merchantTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  merchantSubtitleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  amountDisplayArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollarSign: {
    fontSize: 38,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 6,
  },
  amountDigits: {
    fontSize: 48,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
  },
  cursorBar: {
    width: 2.5,
    height: 40,
    backgroundColor: '#94A3B8',
    marginLeft: 4,
    borderRadius: 2,
  },
  buttonsWrap: {
    gap: 8,
    width: '100%',
  },
  continueButton: {
    height: 48,
    backgroundColor: '#0F172A', // Sleek Black
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  continueButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  keypadContainer: {
    width: '100%',
    gap: 8,
    paddingTop: 4,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadKey: {
    flex: 1,
    height: 46,
    backgroundColor: '#F4F6F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  dotKeyText: {
    fontSize: 26,
    marginTop: -6,
  },
});
