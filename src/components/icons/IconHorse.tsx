import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export default function IconHorse({ size = 26, color = '#C8922A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Тело */}
      <Path
        d="M6 22 C6 22 5 18 7 15 C9 12 11 11 13 11 L15 11 C17 11 19 10 20 8 C21 6 21 4 20 3"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
      {/* Голова */}
      <Path
        d="M20 3 C21 2 23 2 24 3 C25 4 25 6 24 7 C23 8 21 8 20 8"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
      {/* Грива */}
      <Path
        d="M20 4 C19 3 18 3 17 4 C16 5 16 7 17 8"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      {/* Ноздря */}
      <Circle cx="24" cy="6" r="0.8" fill={color} />
      {/* Спина и зад */}
      <Path
        d="M13 11 C15 11 18 12 20 14 C22 16 22 19 21 21 C20 23 18 24 16 24"
        stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"
      />
      {/* Ноги передние */}
      <Path d="M9 18 L8 26 M11 18 L11 26" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Ноги задние */}
      <Path d="M16 22 L15 29 M19 21 L19 28" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Хвост */}
      <Path
        d="M21 21 C23 20 25 21 26 23 C27 25 26 27 24 28"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
    </Svg>
  );
}
