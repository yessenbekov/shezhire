import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface Props { size?: number; color?: string }

export default function IconSearch({ size = 24, color = '#C8922A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="2.2" />
      {/* Small cross inside to echo kazakh ornament */}
      <Path
        d="M10.5 8 V13 M8 10.5 H13"
        stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.55"
      />
      {/* Handle */}
      <Path
        d="M15.5 15.5 L21 21"
        stroke={color} strokeWidth="2.5" strokeLinecap="round"
      />
    </Svg>
  );
}
