import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

interface Props { size?: number; color?: string }

export default function IconHorse({ size = 26, color = '#C8922A' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Horse head silhouette – chess-knight profile, facing right */}
      <Path
        d="M12 5 L14 2 L16 2 L17 5
           C18.5 5.5 20 8 20 11.5
           C20 15.5 18.5 18.5 16.5 20.5
           C14.5 22.5 11.5 22.5 9.5 20.5
           C7.5 18.5 7.5 15.5 8.5 12.5
           C7.5 9.5 7.5 6.5 9 5
           C10 3.5 11.5 4.5 12 5 Z"
        fill={color}
      />
      {/* Eye */}
      <Circle cx="17" cy="9" r="1.1" fill="white" fillOpacity="0.55" />
      {/* Nostril hint */}
      <Circle cx="19.5" cy="19" r="0.7" fill="white" fillOpacity="0.35" />
    </Svg>
  );
}
