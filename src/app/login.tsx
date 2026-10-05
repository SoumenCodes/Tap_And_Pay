import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '../constants/colors';
import { useAuth, LoginType, MOCK_ACCOUNTS } from '../context/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login, quickLogin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = () => {
    // If empty, default to Other Business for smooth design review
    if (!username.trim() && !password.trim()) {
      quickLogin('other_business');
      router.replace('/(tabs)');
      return;
    }

    const result = login(username, password);
    if (result.success) {
      setErrorMessage('');
      router.replace('/(tabs)');
    } else {
      setErrorMessage(result.error || 'Invalid credentials');
    }
  };

  const handleFillCredentials = (type: LoginType) => {
    const acc = MOCK_ACCOUNTS[type];
    setUsername(acc.username);
    setPassword(acc.passwords[0]);
    setErrorMessage('');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: Math.max(insets.top, 24) + 16,
                paddingBottom: Math.max(insets.bottom, 24) + 20,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Top Brand Logo */}
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/se_pay_brand_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Title & Subtitle */}
            <View style={styles.heroTextWrap}>
              <Text style={styles.headingTitle}>Login</Text>
              <Text style={styles.headingSubtitle}>
                Fast, Secure & Seamless Payments
              </Text>
            </View>

            {/* Card Container with subtle warm gold border/shadow */}
            <View style={styles.cardOuter}>
              {/* Top Accent Stripe Line */}
              <View style={styles.topStripeWrapper}>
                <LinearGradient
                  colors={[
                    'rgba(251, 191, 36, 0)',
                    'rgba(251, 191, 36, 0.4)',
                    '#FBBF24',
                    '#F59E0B',
                    '#FBBF24',
                    'rgba(251, 191, 36, 0.4)',
                    'rgba(251, 191, 36, 0)',
                  ]}
                  locations={[0, 0.2, 0.4, 0.5, 0.6, 0.8, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.topStripeLine}
                />
              </View>

              <View style={styles.cardInner}>
                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBanner}>
                    <Feather name="alert-circle" size={15} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : null}

                {/* Username Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>User Name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Type User Name"
                      placeholderTextColor="#94A3B8"
                      value={username}
                      onChangeText={(val) => {
                        setUsername(val);
                        if (errorMessage) setErrorMessage('');
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.inputContainer}>
                    <Feather
                      name="lock"
                      size={18}
                      color="#475569"
                      style={styles.inputLeadingIcon}
                    />
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="******"
                      placeholderTextColor="#94A3B8"
                      value={password}
                      onChangeText={(val) => {
                        setPassword(val);
                        if (errorMessage) setErrorMessage('');
                      }}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      style={styles.eyeButton}
                    >
                      <Feather
                        name={showPassword ? 'eye' : 'eye-off'}
                        size={18}
                        color="#475569"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotBtn}
                  activeOpacity={0.7}
                  onPress={() => console.log('Forgot Password clicked')}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button in sleek black */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleLogin}
                  style={styles.loginBtnOuter}
                >
                  <LinearGradient
                    colors={[colors.black.charcoal, colors.black.dark, colors.black.pure]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginBtnGradient}
                  >
                    <Text style={styles.loginBtnText}>Login</Text>
                    <Feather name="arrow-right" size={18} color={colors.text.inverse} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Test Accounts Section */}
            <View style={styles.testSectionWrap}>
              <Text style={styles.testSectionTitle}>Quick Test Credentials</Text>
              <View style={styles.testButtonsRow}>
                <TouchableOpacity
                  style={styles.testChip}
                  activeOpacity={0.75}
                  onPress={() => handleFillCredentials('taxi_owner')}
                >
                  <Text style={styles.testChipText}>🚕 Taxi Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testChip}
                  activeOpacity={0.75}
                  onPress={() => handleFillCredentials('taxi_business')}
                >
                  <Text style={styles.testChipText}>🚖 Taxi Business</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.testChip}
                  activeOpacity={0.75}
                  onPress={() => handleFillCredentials('other_business')}
                >
                  <Text style={styles.testChipText}>💈 Other Business</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 140,
    height: 75,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  heroTextWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  headingSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '400',
    textAlign: 'center',
  },
  cardOuter: {
    width: Math.min(SCREEN_WIDTH - 48, 350),
    backgroundColor: colors.background.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.card,
    shadowColor: colors.brand.goldMuted,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  topStripeWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  topStripeLine: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInner: {
    padding: 24,
    gap: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '500',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.input,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputLeadingIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  passwordInput: {
    letterSpacing: 2,
  },
  eyeButton: {
    padding: 4,
    marginLeft: 6,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.link,
  },
  loginBtnOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.black.charcoal,
    shadowColor: colors.black.pure,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 8,
  },
  loginBtnText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
  testSectionWrap: {
    marginTop: 20,
    width: Math.min(SCREEN_WIDTH - 48, 350),
    alignItems: 'center',
    gap: 10,
  },
  testSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  testButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  testChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  testChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
});
