import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface Props { size?: number; color?: string }

// Horseshoe — universally recognised equestrian symbol, clean at any size
export default function IconHorse({ size = 26, color = '#9A6E14' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Horseshoe arc */}
      <Path
        d="M5 20 L5 10 C5 6.1 8.1 3 12 3 C15.9 3 19 6.1 19 10 L19 20"
        stroke={color}
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nail holes */}
      <Circle cx="5"  cy="20" r="1.6" fill={color} />
      <Circle cx="19" cy="20" r="1.6" fill={color} />
      <Circle cx="5"  cy="14" r="1"   fill={color} opacity={0.55} />
      <Circle cx="19" cy="14" r="1"   fill={color} opacity={0.55} />
    </Svg>
  );
}
