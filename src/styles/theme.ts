// ============================================
// ワンパン・バディ - 新デザインシステム
// 食欲をそそる暖色系カラーパレット
// ============================================

import { ViewStyle } from 'react-native';

// カラーパレット
export const newColors = {
  // Primary - 食欲をそそるウォームオレンジ
  primary: '#FF6B35',
  primaryLight: '#FF9F6B',
  primaryDark: '#E55A2B',
  primarySoft: '#FFF0E8',

  // Secondary - コーラル系
  coral: '#FF8A80',
  coralLight: '#FFAB91',
  coralSoft: '#FFF3F0',

  // Accent - クリーム・木目調
  cream: '#FFF8E7',
  warmBrown: '#8D6E63',
  warmBrownLight: '#A1887F',
  warmBrownDark: '#6D4C41',

  // 難易度カラー
  difficultyEasy: '#4CAF50',
  difficultyEasyBg: '#E8F5E9',
  difficultyMedium: '#FF9800',
  difficultyMediumBg: '#FFF3E0',
  difficultyHard: '#F44336',
  difficultyHardBg: '#FFEBEE',

  // 栄養素カラー
  caloriesColor: '#FF6B35',
  caloriesBg: '#FFF0E8',
  proteinColor: '#E91E63',
  proteinBg: '#FCE4EC',
  fatColor: '#FFC107',
  fatBg: '#FFFDE7',
  carbsColor: '#8BC34A',
  carbsBg: '#F1F8E9',

  // Backgrounds
  background: '#FFFAF5',
  surface: '#FFFFFF',
  surfaceWarm: '#FFF5EB',
  surfaceAlt: '#F8F4F0',

  // Text
  text: '#2D1810',
  textSecondary: '#5D4037',
  textMuted: '#A1887F',
  textOnPrimary: '#FFFFFF',

  // Border
  border: '#F0E6DE',
  borderLight: '#F8F0E8',

  // Status
  success: '#4CAF50',
  successBg: '#E8F5E9',
  warning: '#FF9800',
  warningBg: '#FFF3E0',
  error: '#F44336',
  errorBg: '#FFEBEE',
  info: '#2196F3',
  infoBg: '#E3F2FD',

  // Base
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(45, 24, 16, 0.5)',
};

// Cooking Mode (ダークテーマ)
export const cookingColors = {
  ...newColors,
  background: '#1A1A2E',
  surface: '#252540',
  surfaceWarm: '#2D2D48',
  surfaceAlt: '#353550',
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  border: '#404060',
  borderLight: '#505070',
};

// スペーシング
export const newSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// タイポグラフィ
export const newTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 34,
    hero: 48,
    giant: 64,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

// ボーダー半径
export const newBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

// シャドウ
export const shadows = {
  sm: {
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  md: {
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  lg: {
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } as ViewStyle,
  xl: {
    shadowColor: '#2D1810',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  } as ViewStyle,
  glow: {
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
  glowSuccess: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  } as ViewStyle,
};

// グラデーション定義（タプル型でexpo-linear-gradient互換）
export const gradients = {
  primary: ['#FF8C42', '#FF6B35', '#E55A2B'] as const,
  primarySoft: ['#FFF5EB', '#FFE8D6'] as const,
  coral: ['#FFAB91', '#FF8A80'] as const,
  warm: ['#FFF8E7', '#FFE8D6', '#FFD6B8'] as const,
  hero: ['#FF9F6B', '#FF6B35'] as const,
  heroSoft: ['#FFF0E8', '#FFE0D0'] as const,
  cooking: ['#252540', '#1A1A2E'] as const,
  success: ['#66BB6A', '#4CAF50'] as const,
  cardOverlay: ['transparent', 'rgba(45, 24, 16, 0.6)'] as const,
};

// アニメーション設定
export const animations = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
  },
};

// 新しいテーマオブジェクト
export const newTheme = {
  colors: newColors,
  spacing: newSpacing,
  typography: newTypography,
  borderRadius: newBorderRadius,
  shadows,
  gradients,
  animations,
};

export const newCookingTheme = {
  ...newTheme,
  colors: cookingColors,
};

export type NewTheme = typeof newTheme;
export type NewColors = typeof newColors;
