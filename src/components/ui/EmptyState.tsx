// ============================================
// ワンパン・バディ - 空状態コンポーネント
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { newColors, newSpacing, newBorderRadius, newTypography } from '../../styles/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🍳',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && (
        <Text style={styles.description}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: newSpacing.xxl,
    paddingHorizontal: newSpacing.lg,
  },
  icon: {
    fontSize: 64,
    marginBottom: newSpacing.md,
  },
  title: {
    fontSize: newTypography.sizes.lg,
    fontWeight: newTypography.weights.semibold,
    color: newColors.text,
    textAlign: 'center',
    marginBottom: newSpacing.sm,
  },
  description: {
    fontSize: newTypography.sizes.md,
    color: newColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: newSpacing.lg,
  },
  actionButton: {
    backgroundColor: newColors.primary,
    paddingVertical: newSpacing.sm,
    paddingHorizontal: newSpacing.lg,
    borderRadius: newBorderRadius.full,
  },
  actionLabel: {
    fontSize: newTypography.sizes.md,
    fontWeight: newTypography.weights.semibold,
    color: newColors.white,
  },
});
