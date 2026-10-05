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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'transactions' | 'profile'>('home');

  const handleLogin = () => {
    // When home dashboard is ready, navigate there
    console.log('Logging in with:', username);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <StatusBar style="dark" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.content,
              {
                paddingTop: Math.max(insets.top, 24) + 20,
              },
            ]}
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
              {/* Subtle top amber glow edge */}
              <LinearGradient
                colors={[
                  'rgba(251, 191, 36, 0.45)',
                  'rgba(245, 158, 11, 0.1)',
                  'transparent',
                ]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.cardTopGlow}
              />

              <View style={styles.cardInner}>
                {/* Username Field */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>User Name</Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Type User Name"
                      placeholderTextColor="#94A3B8"
                      value={username}
                      onChangeText={setUsername}
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
                      onChangeText={setPassword}
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
                    colors={['#18181B', '#09090B', '#000000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginBtnGradient}
                  >
                    <Text style={styles.loginBtnText}>Login</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Bottom Navigation Mockup (Home, Transactions, Profile) */}
        <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          {/* Home Tab (Active in Figma design) */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="home"
              size={20}
              color={activeTab === 'home' ? '#B8860B' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'home' ? styles.navLabelActive : styles.navLabelInactive,
              ]}
            >
              Home
            </Text>
            {activeTab === 'home' && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>

          {/* Transactions Tab */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('transactions')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={activeTab === 'transactions' ? '#B8860B' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'transactions'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
              ]}
            >
              Transactions
            </Text>
            {activeTab === 'transactions' && (
              <View style={styles.activeTabIndicator} />
            )}
          </TouchableOpacity>

          {/* Profile Tab */}
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setActiveTab('profile')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={activeTab === 'profile' ? '#B8860B' : '#94A3B8'}
            />
            <Text
              style={[
                styles.navLabel,
                activeTab === 'profile'
                  ? styles.navLabelActive
                  : styles.navLabelInactive,
              ]}
            >
              Profile
            </Text>
            {activeTab === 'profile' && (
              <View style={styles.activeTabIndicator} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoWrap: {
    width: 140,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  heroTextWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  headingSubtitle: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '400',
    textAlign: 'center',
  },
  cardOuter: {
    width: Math.min(SCREEN_WIDTH - 48, 350),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#C59B27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  cardInner: {
    padding: 24,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
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
    color: '#0284C7',
  },
  loginBtnOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#18181B',
    shadowColor: '#000',
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
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    gap: 4,
  },
  navLabel: {
    fontSize: 11,
  },
  navLabelActive: {
    color: '#775A00',
    fontWeight: '600',
  },
  navLabelInactive: {
    color: '#94A3B8',
    fontWeight: '400',
  },
  activeTabIndicator: {
    width: 20,
    height: 2.5,
    backgroundColor: '#D4AF37',
    borderRadius: 999,
    marginTop: 2,
  },
});
