import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';

interface Props { size?: number; color?: string }

export default function IconReport({ size = 24, color = '#C8922A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Three ascending bars */}
      <Rect x="2"   y="14" width="5" height="8" rx="1.5" fill={color} opacity="0.65" />
      <Rect x="9.5" y="8"  width="5" height="14" rx="1.5" fill={color} opacity="0.82" />
      <Rect x="17"  y="3"  width="5" height="19" rx="1.5" fill={color} />
      {/* Baseline */}
      <Path d="M1 22.5 H23" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </Svg>
  );
}
