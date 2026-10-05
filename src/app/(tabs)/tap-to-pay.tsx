import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Svg, Path, Circle } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PaymentMethod = 'tap' | 'card' | 'cash';

export default function TapToPayEnterAmountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const inputRef = useRef<TextInput>(null);

  // Selected payment method (default: 'card' to match Figma screenshot)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');

  // Raw amount digits (default: '1250' from Figma screenshot)
  const [rawAmount, setRawAmount] = useState<string>('1250');

  // Blinking cursor state
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 600);
    return () => clearInterval(timer);
  }, []);

  // Ensure keyboard focuses reliably on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (!clean) {
      setRawAmount('0');
      return;
    }
    // Limit to 7 digits ($9,999,999)
    if (clean.length > 7) return;
    setRawAmount(clean);
  };

  const handleContinue = () => {
    Keyboard.dismiss();
    console.log('Continue with amount:', {
      amount: parseInt(rawAmount, 10),
      method: selectedMethod,
      business: user.businessName,
    });
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    router.back();
  };

  // Format with commas: 1250 -> 1,250
  const formattedAmount = parseInt(rawAmount || '0', 10).toLocaleString('en-US');

  // Titles and subtitles based on active method
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── 1. Header Bar with Back Arrow, Title, Subtitle & Settings Circle ── */}
        <View
          style={[
            styles.headerSection,
            {
              paddingTop: Math.max(insets.top, 20) + 8,
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

          {/* Right Settings Circle Button (as in Figma screenshot) */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.settingsCircle}
            onPress={() => console.log('Settings clicked')}
          >
            <Ionicons name="settings-sharp" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
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

            {/* ── 4. Generous Amount to Charge Input Area ── */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              style={styles.amountTouchCard}
            >
              <Text style={styles.amountLabel}>AMOUNT TO CHARGE</Text>

              <View style={styles.amountRow}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  ref={inputRef}
                  value={formattedAmount}
                  onChangeText={handleAmountChange}
                  keyboardType="number-pad"
                  style={styles.amountTextInput}
                  selectionColor="#0F172A"
                  autoFocus
                  autoCorrect={false}
                  caretHidden
                />
                <View
                  style={[
                    styles.cursorBar,
                    { opacity: cursorVisible ? 1 : 0 },
                  ]}
                />
              </View>
            </TouchableOpacity>

            {/* ── 5. Action Buttons: Continue (Black) & Cancel ── */}
            <View style={styles.buttonsContainer}>
              {/* Continue Button (Black) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleContinue}
                style={styles.continueButton}
              >
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>

              {/* Cancel Button (Soft Light Gray) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
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
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitleWrap: {
    alignItems: 'center',
    gap: 4,
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
  keyboardContainer: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 20,
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
    height: 38,
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
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FDE047',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    marginTop: 8,
  },
  badgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
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
    gap: 3,
  },
  merchantTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  merchantSubtitleText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  amountTouchCard: {
    width: '100%',
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
    marginBottom: 10,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dollarSign: {
    fontSize: 42,
    fontWeight: '700',
    color: '#D97706',
    marginRight: 6,
  },
  amountTextInput: {
    fontSize: 52,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -1,
    padding: 0,
    margin: 0,
    textAlign: 'center',
  },
  cursorBar: {
    width: 2.5,
    height: 44,
    backgroundColor: '#94A3B8',
    marginLeft: 4,
    borderRadius: 2,
  },
  buttonsContainer: {
    gap: 12,
    width: '100%',
  },
  continueButton: {
    height: 52,
    backgroundColor: '#0F172A', // Sleek Black
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    height: 52,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});
