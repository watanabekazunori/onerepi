// ============================================
// Onerepi - Mobile Container
// 全画面をスマホサイズに制限するラッパー
// ============================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

// スマホ最大幅
const MAX_WIDTH = 390;

interface MobileContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  style,
  backgroundColor = '#FFFFFF',
}) => {
  return (
    <View style={[styles.outer, { backgroundColor }]}>
      <View style={[styles.inner, { backgroundColor }, style]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
  },
});
