import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props { size?: number; color?: string }

export default function IconProfile({ size = 24, color = '#C8922A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Head */}
      <Circle cx="12" cy="8" r="4.2" fill={color} />
      {/* Shoulders / body arc */}
      <Path
        d="M3.5 22 C3.5 17.5 7.3 14 12 14 C16.7 14 20.5 17.5 20.5 22 Z"
        fill={color} opacity="0.85"
      />
    </Svg>
  );
}
