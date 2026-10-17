import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HeaderBar from '../components/common/HeaderBar';
import { APP_CONFIG } from '../constants/appConfig';
import { authService } from '../services/authService';

type ForgotStep = 'mobile' | 'otp' | 'new_password' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<ForgotStep>('mobile');
  const [mobileNumber, setMobileNumber] = useState('0400 555 320');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const otpInputRef = useRef<TextInput>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (!isTimerActive) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive]);

  // Format mobile display with masking
  const maskedMobile = () => {
    const raw = mobileNumber.replace(/\s+/g, '');
    const last3 = raw.slice(-3) || '320';
    return `+61 ••• ••• ${last3}`;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Step 1: Send OTP via live stage API
  const handleSendOtp = async () => {
    Keyboard.dismiss();
    const cleanNumber = mobileNumber.trim();
    if (!cleanNumber) {
      setErrorMessage('Please enter your DC Number, Username, or Mobile Number');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      // Send to live stage API: POST /api/forgot-password with { username }
      const res = await authService.requestPasswordResetOtp({
        username: cleanNumber,
      });

      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp);
      }

      setOtpCode('');
      setTimerSeconds(res.data?.expires_in ? Math.min(res.data.expires_in, 60) : 30);
      setIsTimerActive(true);
      setStep('otp');
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset code. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP via live stage API
  const handleResendOtp = async () => {
    const cleanNumber = mobileNumber.trim();
    if (!cleanNumber) return;

    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await authService.requestPasswordResetOtp({
        username: cleanNumber,
      });

      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp);
      }

      setOtpCode('');
      setTimerSeconds(30);
      setIsTimerActive(true);
      Alert.alert(
        'New Code Sent',
        res.data?.message || `A new 6-digit code has been sent to ${mobileNumber}.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const [tempResetToken, setTempResetToken] = useState<string | null>(null);

  // Step 2: Verify OTP via live stage API
  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    if (otpCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit verification code');
      return;
    }

    const cleanUsername = mobileNumber.trim();

    try {
      setIsLoading(true);
      setErrorMessage('');

      // Send to live stage API: POST /api/verify-otp with { username, otp }
      const res = await authService.verifyPasswordResetOtp({
        username: cleanUsername,
        otp: otpCode.trim(),
      });

      if (res.data?.temp_token) {
        setTempResetToken(res.data.temp_token);
      }

      setStep('new_password');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password via live stage API
  const handleResetPassword = async () => {
    Keyboard.dismiss();
    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');

      if (tempResetToken) {
        // Send to live stage API: POST /api/reset-password with Bearer tempToken
        await authService.resetPassword({
          tempToken: tempResetToken,
          password: newPassword.trim(),
          confirm_password: confirmPassword.trim(),
        });
      }

      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <StatusBar style="dark" />

        {/* Top Header Bar */}
        <HeaderBar
          title={step === 'success' ? 'Password Reset' : 'Forgot Password'}
          showBack={step !== 'success'}
          onBack={() => {
            if (step === 'otp') {
              setStep('mobile');
              setErrorMessage('');
            } else if (step === 'new_password') {
              setStep('otp');
              setErrorMessage('');
            } else {
              router.back();
            }
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Brand Logo */}
            <View style={styles.logoWrap}>
              <Image
                source={require('../../assets/se_pay_brand_logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
              />
            </View>

            {/* Stepper Progress Indicators */}
            {step !== 'success' && (
              <View style={styles.stepperContainer}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <Text style={styles.stepDotText}>1</Text>
                </View>
                <View
                  style={[
                    styles.stepConnector,
                    (step === 'otp' || step === 'new_password') && styles.stepConnectorActive,
                  ]}
                />
                <View
                  style={[
                    styles.stepDot,
                    (step === 'otp' || step === 'new_password') && styles.stepDotActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepDotText,
                      (step === 'otp' || step === 'new_password') && styles.stepDotTextActive,
                    ]}
                  >
                    2
                  </Text>
                </View>
                <View
                  style={[
                    styles.stepConnector,
                    step === 'new_password' && styles.stepConnectorActive,
                  ]}
                />
                <View style={[styles.stepDot, step === 'new_password' && styles.stepDotActive]}>
                  <Text
                    style={[
                      styles.stepDotText,
                      step === 'new_password' && styles.stepDotTextActive,
                    ]}
                  >
                    3
                  </Text>
                </View>
              </View>
            )}

            {/* Main Interactive Card */}
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
                {/* ── STEP 1: MOBILE NUMBER ── */}
                {step === 'mobile' && (
                  <View>
                    <View style={styles.iconCircle}>
                      <Ionicons name="phone-portrait-outline" size={26} color="#B45309" />
                    </View>

                    <Text style={styles.stepTitle}>Reset via Mobile</Text>
                    <Text style={styles.stepDescription}>
                      Enter your registered mobile phone number. We will send you a 6-digit verification code.
                    </Text>

                    {/* Error Banner */}
                    {errorMessage ? (
                      <View style={styles.errorBanner}>
                        <Feather name="alert-circle" size={14} color="#DC2626" />
                        <Text style={styles.errorText}>{errorMessage}</Text>
                      </View>
                    ) : null}

                    {/* Mobile Input Group */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>REGISTERED MOBILE NUMBER</Text>
                      <View style={styles.phoneInputRow}>
                        <View style={styles.countryCodeBadge}>
                          <Text style={styles.flagText}>🇦🇺</Text>
                          <Text style={styles.countryCodeText}>+61</Text>
                        </View>

                        <TextInput
                          style={styles.phoneInput}
                          placeholder="0400 555 320"
                          placeholderTextColor="#94A3B8"
                          value={mobileNumber}
                          onChangeText={(val) => {
                            setMobileNumber(val);
                            if (errorMessage) setErrorMessage('');
                          }}
                          keyboardType="phone-pad"
                          autoFocus
                        />
                      </View>
                    </View>

                    {/* Quick helper note */}
                    <Text style={styles.helperText}>
                      Standard SMS carrier rates may apply. Code expires in 10 minutes.
                    </Text>

                    {/* Send Code Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSendOtp}
                      disabled={isLoading}
                      style={[styles.actionBtnOuter, isLoading && { opacity: 0.75 }]}
                    >
                      <LinearGradient
                        colors={['#1E293B', '#0F172A', '#020617']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionBtnGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.actionBtnText}>Send Verification Code</Text>
                            <Feather name="arrow-right" size={17} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── STEP 2: OTP VERIFICATION ── */}
                {step === 'otp' && (
                  <View>
                    <View style={styles.iconCircleBlue}>
                      <Ionicons name="shield-checkmark-outline" size={26} color="#2563EB" />
                    </View>

                    <Text style={styles.stepTitle}>Enter 6-Digit Code</Text>
                    <Text style={styles.stepDescription}>
                      We have sent a verification code to{' '}
                      <Text style={styles.highlightText}>{maskedMobile()}</Text>.
                    </Text>

                    {/* Error Banner */}
                    {errorMessage ? (
                      <View style={styles.errorBanner}>
                        <Feather name="alert-circle" size={14} color="#DC2626" />
                        <Text style={styles.errorText}>{errorMessage}</Text>
                      </View>
                    ) : null}

                    {/* 6 Digit Display Boxes */}
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => otpInputRef.current?.focus()}
                      style={styles.otpBoxesRow}
                    >
                      {[0, 1, 2, 3, 4, 5].map((index) => {
                        const digit = otpCode[index] || '';
                        const isCurrent = otpCode.length === index;
                        return (
                          <View
                            key={index}
                            style={[
                              styles.otpBox,
                              digit ? styles.otpBoxFilled : null,
                              isCurrent ? styles.otpBoxActive : null,
                            ]}
                          >
                            <Text style={styles.otpDigitText}>{digit}</Text>
                          </View>
                        );
                      })}
                    </TouchableOpacity>

                    {/* Hidden Actual Input */}
                    <TextInput
                      ref={otpInputRef}
                      value={otpCode}
                      onChangeText={(val) => {
                        const clean = val.replace(/[^0-9]/g, '').slice(0, 6);
                        setOtpCode(clean);
                        if (errorMessage) setErrorMessage('');
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={styles.hiddenInput}
                    />

                    {/* Quick Demo Fill Chip */}
                    <View style={styles.quickCodeWrap}>
                      <TouchableOpacity
                        style={styles.quickCodeChip}
                        onPress={() => setOtpCode(devOtp || '123456')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="flash-outline" size={13} color="#D97706" />
                        <Text style={styles.quickCodeText}>
                          {devOtp ? `Server Code: ${devOtp}` : 'Use Test Code: 123456'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Resend Timer Row */}
                    <View style={styles.resendRow}>
                      {isTimerActive ? (
                        <Text style={styles.timerText}>
                          Resend code in{' '}
                          <Text style={styles.timerBold}>
                            00:{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}
                          </Text>
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                          <Text style={styles.resendLinkText}>Didn’t receive code? Resend SMS</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Verify OTP Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleVerifyOtp}
                      disabled={isLoading || otpCode.length < 6}
                      style={[
                        styles.actionBtnOuter,
                        (otpCode.length < 6 || isLoading) && styles.actionBtnDisabled,
                      ]}
                    >
                      <LinearGradient
                        colors={['#1E293B', '#0F172A', '#020617']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionBtnGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.actionBtnText}>Verify & Continue</Text>
                            <Feather name="check" size={17} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Change Mobile Button */}
                    <TouchableOpacity
                      style={styles.changeMobileBtn}
                      onPress={() => {
                        setStep('mobile');
                        setErrorMessage('');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeMobileText}>Change mobile number</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── STEP 3: CREATE NEW PASSWORD ── */}
                {step === 'new_password' && (
                  <View>
                    <View style={styles.iconCircleAmber}>
                      <Ionicons name="key-outline" size={26} color="#D97706" />
                    </View>

                    <Text style={styles.stepTitle}>Create New Password</Text>
                    <Text style={styles.stepDescription}>
                      Set a strong password for your merchant terminal account.
                    </Text>

                    {/* Error Banner */}
                    {errorMessage ? (
                      <View style={styles.errorBanner}>
                        <Feather name="alert-circle" size={14} color="#DC2626" />
                        <Text style={styles.errorText}>{errorMessage}</Text>
                      </View>
                    ) : null}

                    {/* New Password Field */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                      <View style={styles.inputContainer}>
                        <Feather name="lock" size={17} color="#64748B" style={styles.inputLeadingIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="At least 6 characters"
                          placeholderTextColor="#94A3B8"
                          value={newPassword}
                          onChangeText={(val) => {
                            setNewPassword(val);
                            if (errorMessage) setErrorMessage('');
                          }}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Feather
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={17}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Confirm Password Field */}
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
                      <View style={styles.inputContainer}>
                        <Feather name="shield" size={17} color="#64748B" style={styles.inputLeadingIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="Re-enter your password"
                          placeholderTextColor="#94A3B8"
                          value={confirmPassword}
                          onChangeText={(val) => {
                            setConfirmPassword(val);
                            if (errorMessage) setErrorMessage('');
                          }}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <Feather
                            name={showConfirmPassword ? 'eye' : 'eye-off'}
                            size={17}
                            color="#64748B"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Reset Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleResetPassword}
                      disabled={isLoading}
                      style={[styles.actionBtnOuter, isLoading && { opacity: 0.75 }]}
                    >
                      <LinearGradient
                        colors={['#1E293B', '#0F172A', '#020617']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionBtnGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Text style={styles.actionBtnText}>Update Password</Text>
                            <Feather name="arrow-right" size={17} color="#FFFFFF" />
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── STEP 4: SUCCESS VIEW ── */}
                {step === 'success' && (
                  <View style={styles.successContainer}>
                    <View style={styles.successIconCircle}>
                      <Ionicons name="checkmark-done-circle" size={48} color="#059669" />
                    </View>

                    <Text style={styles.successTitle}>Password Reset Complete!</Text>
                    <Text style={styles.successMessage}>
                      Your password has been successfully updated. You can now securely log in with your new credentials.
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => router.replace('/login')}
                      style={styles.actionBtnOuter}
                    >
                      <LinearGradient
                        colors={['#1E293B', '#0F172A', '#020617']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionBtnGradient}
                      >
                        <Text style={styles.actionBtnText}>Back to Login</Text>
                        <Feather name="log-in" size={17} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Back to Login link */}
            {step !== 'success' && (
              <TouchableOpacity
                style={styles.bottomLoginLink}
                onPress={() => router.replace('/login')}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.bottomLoginText}>
                  Remember your password? <Text style={styles.loginBold}>Log in</Text>
                </Text>
              </TouchableOpacity>
            )}

            {/* Version Text */}
            <View style={styles.versionWrap}>
              <Text style={styles.versionText}>{APP_CONFIG.displayVersion}</Text>
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
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  logoWrap: {
    width: 200,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandLogo: {
    width: '100%',
    height: '100%',
  },

  /* Stepper Progress Bar */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepConnector: {
    width: 44,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepConnectorActive: {
    backgroundColor: '#0F172A',
  },

  /* Card Outer & Inner */
  cardOuter: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF08A',
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  topStripeWrapper: {
    width: '100%',
    height: 3,
  },
  topStripeLine: {
    width: '100%',
    height: '100%',
  },
  cardInner: {
    padding: 20,
  },

  /* Step Icons */
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  iconCircleBlue: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  iconCircleAmber: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
  highlightText: {
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Error Banner */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },

  /* Fields */
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
    gap: 4,
  },
  flagText: {
    fontSize: 16,
  },
  countryCodeText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 18,
  },

  /* Inputs for Password */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    height: 48,
  },
  inputLeadingIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },

  /* Buttons */
  actionBtnOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnDisabled: {
    opacity: 0.5,
  },

  /* OTP Boxes */
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  otpBox: {
    width: 44,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  otpBoxActive: {
    borderColor: '#D97706',
    backgroundColor: '#FFFDF7',
  },
  otpDigitText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  quickCodeWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  quickCodeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  quickCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  timerText: {
    fontSize: 12,
    color: '#64748B',
  },
  timerBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resendLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563EB',
  },
  changeMobileBtn: {
    alignItems: 'center',
    marginTop: 14,
  },
  changeMobileText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Success View */
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    marginBottom: 14,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 6,
  },

  /* Bottom Login Link */
  bottomLoginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  bottomLoginText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginBold: {
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Version */
  versionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
});
