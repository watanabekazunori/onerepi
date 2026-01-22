// ============================================
// One-Pan Buddy - Theme Configuration
// Based on v0 Design: Warm Orange (#FF8C00) Primary
// ============================================

import { Theme } from '../types';

export const theme: Theme = {
  colors: {
    // Primary - Warm Orange (v0 design spec)
    primary: '#FF8C00',
    primaryLight: '#FFB347',
    primaryDark: '#E07B00',

    // Secondary
    secondary: '#6B7280',

    // Backgrounds
    background: '#F5F7FA', // Light blue-grey (v0 chat background)
    surface: '#FFFFFF',
    surfaceAlt: '#F3F4F6',

    // Text
    text: '#1F2937',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',

    // Border
    border: '#E5E7EB',

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Base
    white: '#FFFFFF',
    black: '#000000',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  typography: {
    fontFamily: 'System', // Will use Nunito when loaded
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },

  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

// Cooking Mode (Dark Theme for wet-finger UI)
export const cookingTheme: Theme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#1F2937',
    surface: '#374151',
    surfaceAlt: '#4B5563',
    text: '#FFFFFF',
    textSecondary: '#D1D5DB',
    textMuted: '#9CA3AF',
    border: '#4B5563',
  },
};

// Shorthand color access
export const colors = theme.colors;
export const spacing = theme.spacing;
export const typography = theme.typography;
export const borderRadius = theme.borderRadius;

// ============================================
// 後方互換性: 新しいテーマシステムからの再エクスポート
// ============================================
export {
  newColors,
  newSpacing,
  newBorderRadius,
  newTypography,
  shadows,
  gradients,
  cookingColors,
} from '../styles/theme';
