// ============================================
// ワンパン・バディ - 栄養情報グラフィカル表示
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircularProgress } from './CircularProgress';
import { newColors, newSpacing, newTypography } from '../../styles/theme';

interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
}

interface NutritionChartProps {
  nutrition: NutritionInfo;
  compact?: boolean;
}

// 1日の推奨摂取量（目安）
const DAILY_VALUES = {
  calories: 2000,
  protein: 50,
  fat: 65,
  carbohydrates: 300,
};

const nutritionConfig = [
  {
    key: 'calories' as const,
    label: 'カロリー',
    unit: 'kcal',
    color: newColors.caloriesColor,
  },
  {
    key: 'protein' as const,
    label: 'タンパク質',
    unit: 'g',
    color: newColors.proteinColor,
  },
  {
    key: 'fat' as const,
    label: '脂質',
    unit: 'g',
    color: newColors.fatColor,
  },
  {
    key: 'carbohydrates' as const,
    label: '炭水化物',
    unit: 'g',
    color: newColors.carbsColor,
  },
];

export const NutritionChart: React.FC<NutritionChartProps> = ({
  nutrition,
  compact = false,
}) => {
  const size = compact ? 60 : 72;
  const strokeWidth = compact ? 6 : 8;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {nutritionConfig.map((item) => {
        const value = nutrition[item.key];
        const dailyValue = DAILY_VALUES[item.key];
        const progress = Math.min((value / dailyValue) * 100, 100);

        return (
          <View key={item.key} style={styles.item}>
            <CircularProgress
              progress={progress}
              size={size}
              strokeWidth={strokeWidth}
              color={item.color}
              backgroundColor={newColors.surfaceAlt}
              showLabel={false}
            >
              <Text
                style={[
                  styles.value,
                  compact && styles.valueCompact,
                  { color: item.color },
                ]}
              >
                {value}
              </Text>
            </CircularProgress>
            <Text style={[styles.unit, compact && styles.unitCompact]}>
              {item.unit}
            </Text>
            <Text
              style={[styles.label, compact && styles.labelCompact]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: newSpacing.md,
  },
  containerCompact: {
    paddingVertical: newSpacing.sm,
  },
  item: {
    alignItems: 'center',
    flex: 1,
  },
  value: {
    fontSize: newTypography.sizes.lg,
    fontWeight: newTypography.weights.bold,
  },
  valueCompact: {
    fontSize: newTypography.sizes.md,
  },
  unit: {
    fontSize: newTypography.sizes.xs,
    color: newColors.textMuted,
    marginTop: 2,
  },
  unitCompact: {
    fontSize: 10,
  },
  label: {
    fontSize: newTypography.sizes.xs,
    color: newColors.textSecondary,
    fontWeight: newTypography.weights.medium,
    marginTop: 2,
  },
  labelCompact: {
    fontSize: 10,
  },
});
