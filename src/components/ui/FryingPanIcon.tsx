// ============================================
// One-Pan Buddy - Frying Pan Icon (Custom SVG)
// Based on v0 minimalist frying pan design
// ============================================

import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface FryingPanIconProps {
  size?: number;
  color?: string;
  variant?: 'line' | 'solid';
}

export const FryingPanIcon: React.FC<FryingPanIconProps> = ({
  size = 24,
  color = '#FF8C00',
  variant = 'line',
}) => {
  if (variant === 'solid') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Pan body - solid */}
        <Circle cx="10" cy="12" r="7" fill={color} />
        {/* Handle */}
        <Path
          d="M17 12H22C22.5523 12 23 11.5523 23 11V11C23 10.4477 22.5523 10 22 10H17"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Steam lines */}
        <Path
          d="M8 7C8 6 8.5 5 9 4"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <Path
          d="M11 6C11 5 11.5 4 12 3"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  // Line variant (default)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Pan body - outline */}
      <Circle
        cx="10"
        cy="12"
        r="6"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Handle */}
      <Path
        d="M16 12H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Steam lines */}
      <Path
        d="M7 7C7.5 5.5 8 4 8 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M10 6C10.5 4.5 11 3 11 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Path
        d="M13 7C13.5 5.5 14 4 14 4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};
