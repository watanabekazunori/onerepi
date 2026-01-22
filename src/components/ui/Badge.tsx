// ============================================
// One-Pan Buddy - Badge Component
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BadgeProps } from '../../types';
import { colors, borderRadius } from '../../lib/theme';

export const Badge: React.FC<BadgeProps> = ({
  count,
  size = 'md',
  color = colors.primary,
}) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.badge, styles[`size_${size}`], { backgroundColor: color }]}>
      <Text style={[styles.text, styles[`textSize_${size}`]]}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  size_sm: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
  },
  size_md: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
  },

  text: {
    color: colors.white,
    fontWeight: '700',
  },

  textSize_sm: {
    fontSize: 10,
  },
  textSize_md: {
    fontSize: 12,
  },
});
