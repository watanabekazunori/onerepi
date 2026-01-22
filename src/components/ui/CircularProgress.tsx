// ============================================
// ワンパン・バディ - 円形プログレスコンポーネント
// タイマーや栄養情報の視覚化に使用
// ============================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { newColors, newTypography } from '../../styles/theme';

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
  children?: React.ReactNode;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 8,
  color = newColors.primary,
  backgroundColor = newColors.border,
  showLabel = true,
  label,
  sublabel,
  children,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.labelContainer}>
        {children ? (
          children
        ) : showLabel ? (
          <>
            <Text
              style={[
                styles.label,
                { fontSize: size * 0.22, color },
              ]}
              numberOfLines={1}
            >
              {label ?? `${Math.round(clampedProgress)}%`}
            </Text>
            {sublabel && (
              <Text
                style={[
                  styles.sublabel,
                  { fontSize: size * 0.12 },
                ]}
                numberOfLines={1}
              >
                {sublabel}
              </Text>
            )}
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: newTypography.weights.bold,
    textAlign: 'center',
  },
  sublabel: {
    color: newColors.textMuted,
    fontWeight: newTypography.weights.medium,
    textAlign: 'center',
    marginTop: 2,
  },
});
