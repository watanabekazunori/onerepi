// ============================================
// ワンパン・バディ - ステップインジケーター
// 調理画面の進捗表示に使用
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { newColors, newSpacing, newBorderRadius, newTypography } from '../../styles/theme';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number; // 0-indexed, -1 for ingredient check
  onStepPress?: (index: number) => void;
  showLabels?: boolean;
  compact?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps,
  currentStep,
  onStepPress,
  showLabels = false,
  compact = false,
}) => {
  // Include preparation step at index -1
  const steps = ['材料', ...Array.from({ length: totalSteps }, (_, i) => `${i + 1}`)];

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    const adjustedCurrent = currentStep + 1; // Shift to account for prep step
    if (index < adjustedCurrent) return 'completed';
    if (index === adjustedCurrent) return 'current';
    return 'upcoming';
  };

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {steps.map((label, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={[
                styles.stepContainer,
                compact && styles.stepContainerCompact,
              ]}
              onPress={() => onStepPress?.(index - 1)} // Adjust for prep step
              disabled={!onStepPress || status === 'upcoming'}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.circle,
                  compact && styles.circleCompact,
                  status === 'completed' && styles.circleCompleted,
                  status === 'current' && styles.circleCurrent,
                  status === 'upcoming' && styles.circleUpcoming,
                ]}
              >
                {status === 'completed' ? (
                  <Check size={compact ? 12 : 16} color={newColors.white} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      compact && styles.circleTextCompact,
                      status === 'current' && styles.circleTextCurrent,
                      status === 'upcoming' && styles.circleTextUpcoming,
                    ]}
                  >
                    {index === 0 ? '✓' : label}
                  </Text>
                )}
              </View>
              {showLabels && !compact && (
                <Text
                  style={[
                    styles.label,
                    status === 'current' && styles.labelCurrent,
                    status === 'upcoming' && styles.labelUpcoming,
                  ]}
                  numberOfLines={1}
                >
                  {index === 0 ? '材料' : `Step ${label}`}
                </Text>
              )}
            </TouchableOpacity>

            {!isLast && (
              <View
                style={[
                  styles.connector,
                  compact && styles.connectorCompact,
                  status === 'completed' && styles.connectorCompleted,
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: newSpacing.md,
    paddingVertical: newSpacing.sm,
  },
  containerCompact: {
    paddingVertical: newSpacing.xs,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepContainerCompact: {
    minWidth: 24,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  circleCompleted: {
    backgroundColor: newColors.success,
  },
  circleCurrent: {
    backgroundColor: newColors.primary,
  },
  circleUpcoming: {
    backgroundColor: newColors.surfaceAlt,
    borderWidth: 2,
    borderColor: newColors.border,
  },
  circleText: {
    fontSize: newTypography.sizes.sm,
    fontWeight: newTypography.weights.bold,
    color: newColors.white,
  },
  circleTextCompact: {
    fontSize: newTypography.sizes.xs,
  },
  circleTextCurrent: {
    color: newColors.white,
  },
  circleTextUpcoming: {
    color: newColors.textMuted,
  },
  label: {
    marginTop: newSpacing.xs,
    fontSize: newTypography.sizes.xs,
    fontWeight: newTypography.weights.medium,
    color: newColors.textSecondary,
  },
  labelCurrent: {
    color: newColors.primary,
    fontWeight: newTypography.weights.bold,
  },
  labelUpcoming: {
    color: newColors.textMuted,
  },
  connector: {
    width: 20,
    height: 2,
    backgroundColor: newColors.border,
    marginHorizontal: newSpacing.xs,
  },
  connectorCompact: {
    width: 12,
  },
  connectorCompleted: {
    backgroundColor: newColors.success,
  },
});
