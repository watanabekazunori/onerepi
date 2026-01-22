// ============================================
// ワンパン・バディ - 調理時間バッジコンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { newColors, newSpacing, newBorderRadius, newTypography } from '../../styles/theme';

interface TimeBadgeProps {
  minutes: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'ghost';
  showIcon?: boolean;
}

const sizeConfig = {
  sm: {
    paddingH: newSpacing.sm,
    paddingV: 2,
    fontSize: newTypography.sizes.xs,
    iconSize: 10,
    gap: 2,
  },
  md: {
    paddingH: newSpacing.md,
    paddingV: newSpacing.xs,
    fontSize: newTypography.sizes.sm,
    iconSize: 12,
    gap: 4,
  },
  lg: {
    paddingH: newSpacing.lg,
    paddingV: newSpacing.sm,
    fontSize: newTypography.sizes.md,
    iconSize: 16,
    gap: 6,
  },
};

export const TimeBadge: React.FC<TimeBadgeProps> = ({
  minutes,
  size = 'md',
  variant = 'filled',
  showIcon = true,
}) => {
  const sizeStyle = sizeConfig[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: newColors.primarySoft,
          textColor: newColors.primary,
          borderWidth: 0,
          borderColor: 'transparent',
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          textColor: newColors.primary,
          borderWidth: 1,
          borderColor: newColors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: newColors.textSecondary,
          borderWidth: 0,
          borderColor: 'transparent',
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: variantStyle.backgroundColor,
          borderWidth: variantStyle.borderWidth,
          borderColor: variantStyle.borderColor,
          paddingHorizontal: sizeStyle.paddingH,
          paddingVertical: sizeStyle.paddingV,
          gap: sizeStyle.gap,
        },
      ]}
    >
      {showIcon && (
        <Clock size={sizeStyle.iconSize} color={variantStyle.textColor} />
      )}
      <Text
        style={[
          styles.label,
          {
            color: variantStyle.textColor,
            fontSize: sizeStyle.fontSize,
          },
        ]}
      >
        {minutes}分
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: newBorderRadius.full,
  },
  label: {
    fontWeight: newTypography.weights.semibold,
  },
});
