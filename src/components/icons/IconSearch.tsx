import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function IconSearch({ size = 24, color = '#C8922A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="10" cy="10" r="6.5" stroke={color} strokeWidth="2" />
      {/* Крест-орнамент внутри */}
      <Line x1="10" y1="6.5" x2="10" y2="13.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <Line x1="6.5" y1="10" x2="13.5" y2="10" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Ручка лупы */}
      <Line x1="15" y1="15" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
