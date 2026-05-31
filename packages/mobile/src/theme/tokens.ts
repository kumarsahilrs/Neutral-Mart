/**
 * NirmalMandi Design Token System — packages/mobile
 * Aligned with spec: buyer panel = blue, seller panel = green.
 * Keeps Colors.light / Colors.dark API for existing screens.
 */

export const Colors = {
  // Brand — buyer panel (blue)
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  primaryPale: '#dbeafe',
  primaryDark: '#1d4ed8',

  // Seller panel (green) — for seller screens
  sellerPrimary: '#16a34a',
  sellerPrimaryLight: '#22c55e',
  sellerPrimaryPale: '#dcfce7',
  sellerPrimaryDark: '#15803d',

  // Urgency / highlight accent
  accent: '#f59e0b',
  accentLight: '#fef3c7',

  // Semantic
  success: '#16a34a',
  warning: '#d97706',
  error: '#dc2626',
  info: '#1565c0',

  // Light mode surfaces
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#475569',
    muted: '#94a3b8',
    border: '#e2e8f0',
    divider: '#f1f5f9',
  },

  // Dark mode surfaces
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#1e2d3d',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    muted: '#64748b',
    border: '#334155',
    divider: '#1e293b',
  },
} as const;

export const Typography = {
  sans: 'System',
  mono: 'Courier New',

  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const;

export const Spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16,
  5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
} as const;

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
