// ============================================
// One-Pan Buddy - Button Component
// ============================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ButtonProps } from '../../types';
import { colors, spacing, borderRadius } from '../../lib/theme';

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.lg,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  md: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  lg: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  xl: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 80,
  },
});

const textVariantStyles = StyleSheet.create({
  primary: {
    color: colors.white,
  },
  secondary: {
    color: colors.text,
  },
  ghost: {
    color: colors.primary,
  },
  chip: {
    color: colors.text,
  },
  danger: {
    color: colors.white,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 14,
  },
  md: {
    fontSize: 16,
  },
  lg: {
    fontSize: 18,
  },
  xl: {
    fontSize: 24,
  },
});

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onPress,
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}) => {
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const buttonStyles: StyleProp<ViewStyle> = [
    styles.base,
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  ];

  const textStyles: StyleProp<TextStyle> = [
    styles.text,
    textVariantStyles[variant],
    textSizeStyles[size],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.white : colors.primary}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={textStyles}>{children}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
  },
});
