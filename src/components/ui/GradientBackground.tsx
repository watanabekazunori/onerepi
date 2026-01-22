// ============================================
// ワンパン・バディ - グラデーション背景コンポーネント
// ============================================

import React from 'react';
import { StyleSheet, ViewStyle, StyleProp, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, newBorderRadius } from '../../styles/theme';

type GradientVariant = 'primary' | 'primarySoft' | 'coral' | 'warm' | 'hero' | 'heroSoft' | 'cooking' | 'success' | 'cardOverlay';

interface GradientBackgroundProps {
  variant?: GradientVariant;
  colors?: readonly [ColorValue, ColorValue, ...ColorValue[]];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'primary',
  colors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  borderRadius,
  style,
  children,
}) => {
  const gradientColors = colors || gradients[variant];

  return (
    <LinearGradient
      colors={gradientColors as readonly [ColorValue, ColorValue, ...ColorValue[]]}
      start={start}
      end={end}
      style={[
        styles.gradient,
        borderRadius !== undefined && { borderRadius },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});
