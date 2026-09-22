import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const colors = {
  // Pure white base
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  surfaceBorder: '#E2E8F0',
  surfaceBorderSubtle: '#F1F5F9',

  // Primary Stripe / Modern Blue
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primarySoft: '#EFF6FF',
  primaryBorder: '#BFDBFE',

  // NFC Circle
  nfcCircleBg: '#EFF6FF',
  nfcCircleBorder: '#BFDBFE',

  // Typography
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  white: '#FFFFFF',

  // Success Green
  success: '#22C55E',
  successDark: '#16A34A',
  successSoft: '#DCFCE7',

  // Error
  error: '#EF4444',
  errorSoft: '#FEE2E2',

  // Processing screen (dark)
  processingBg: '#111827',
  processingTrack: '#1E293B',
  processingRing: '#2563EB',

  // Keypad
  keyBg: '#F8FAFC',
  keyBorder: '#F1F5F9',
  keyText: '#0F172A',

  // Cancel / secondary button
  secondaryBtnBg: '#F1F5F9',
  secondaryBtnText: '#334155',

  // Tab bar
  tabBg: '#FFFFFF',
  tabBorder: '#F1F5F9',
  tabActive: '#2563EB',
  tabInactive: '#94A3B8',

  divider: '#F1F5F9',
};

export const spacing = {
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
};

export const typography = {
  size: {
    xs: 11,
    sm: 12,
    base: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 22,
    '3xl': 26,
    '4xl': 32,
    '5xl': 36,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_HEIGHT < 700,
};

export default {
  colors,
  spacing,
  typography,
  radius,
  screen,
};
