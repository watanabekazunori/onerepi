// ============================================
// ワンパン・バディ - 難易度バッジコンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChefHat } from 'lucide-react-native';
import { newColors, newSpacing, newBorderRadius, newTypography } from '../../styles/theme';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

const difficultyConfig = {
  easy: {
    label: '簡単',
    color: newColors.difficultyEasy,
    bgColor: newColors.difficultyEasyBg,
  },
  medium: {
    label: '普通',
    color: newColors.difficultyMedium,
    bgColor: newColors.difficultyMediumBg,
  },
  hard: {
    label: '本格',
    color: newColors.difficultyHard,
    bgColor: newColors.difficultyHardBg,
  },
};

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

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({
  difficulty,
  size = 'md',
  showIcon = true,
  showLabel = true,
}) => {
  const config = difficultyConfig[difficulty];
  const sizeStyle = sizeConfig[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bgColor,
          paddingHorizontal: sizeStyle.paddingH,
          paddingVertical: sizeStyle.paddingV,
          gap: sizeStyle.gap,
        },
      ]}
    >
      {showIcon && (
        <ChefHat size={sizeStyle.iconSize} color={config.color} />
      )}
      {showLabel && (
        <Text
          style={[
            styles.label,
            {
              color: config.color,
              fontSize: sizeStyle.fontSize,
            },
          ]}
        >
          {config.label}
        </Text>
      )}
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
