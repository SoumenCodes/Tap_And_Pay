/**
 * SE Pay Unified Design System Colors
 * Extracted directly from Figma design tokens
 */

export const colors = {
  // Brand & Accent Colors
  brand: {
    primary: '#0050B6',
    primaryDark: '#003882',
    primaryLight: '#2563EB',
    primarySoft: '#EFF6FF',
    primaryBorder: '#BFDBFE',

    // Luxury Gold Accents (SE Pay Emblem & Active States)
    gold: '#D4AF37',
    goldDark: '#B8860B',
    goldDeep: '#775A00',
    goldLight: '#EEC14B',
    goldMuted: '#C59B27',
    goldSoft: '#FEF3C7',
    goldGlow: 'rgba(251, 191, 36, 0.45)',
  },

  // Dark & Neutral Blacks (Primary CTA Buttons & Headers)
  black: {
    pure: '#000000',
    deep: '#040404',
    dark: '#09090B',
    charcoal: '#18181B',
    subtle: '#111827',
  },

  // Surfaces & Backgrounds
  background: {
    primary: '#FFFFFF',
    surface: '#FFFFFF',
    subtle: '#F8FAFC',
    muted: '#F1F5F9',
    card: '#FFFFFF',
    input: '#F8FAFC',
  },

  // Borders & Dividers
  border: {
    default: '#E2E8F0',
    subtle: '#F1F5F9',
    card: 'rgba(226, 232, 240, 0.9)',
    active: '#0F172A',
    gold: 'rgba(238, 193, 75, 0.4)',
  },

  // Typography
  text: {
    primary: '#0F172A',
    secondary: '#475569',
    muted: '#94A3B8',
    disabled: '#CBD5E1',
    inverse: '#FFFFFF',
    link: '#0284C7',
    gold: '#775A00',
  },

  // Status & Alerts
  status: {
    success: '#10B981',
    successDark: '#065F46',
    successSoft: '#ECFDF5',
    error: '#EF4444',
    errorSoft: '#FEE2E2',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    info: '#0284C7',
    infoSoft: '#E0F2FE',
  },

  // Bottom Navigation
  tab: {
    background: '#FFFFFF',
    border: '#F1F5F9',
    activeText: '#775A00',
    activeIcon: '#B8860B',
    activeIndicator: '#D4AF37',
    inactiveText: '#94A3B8',
    inactiveIcon: '#94A3B8',
  },
} as const;

export type AppColors = typeof colors;
export default colors;
