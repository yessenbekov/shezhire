export type ThemeMode = 'dark' | 'light';

export const DARK = {
  bg: '#1C0A0A',
  surface: '#2A1210',
  surfaceAlt: '#3A1A12',
  border: '#5A2820',
  gold: '#C8922A',
  text: '#FFFFFF',
  textSub: '#F5E6C8',
  muted: '#9A7A5A',
  faint: '#5A3A2A',
  male: '#5ABBD4',
  maleBg: '#0D1E2D',
  maleBorder: '#2D7D9F',
  female: '#D45A9E',
  femaleBg: '#2D0D1A',
  femaleBorder: '#9F2D65',
  danger: '#C84A4A',
  success: '#4AAC7A',
  overlay: 'rgba(0,0,0,0.7)',
  statusBar: 'light' as const,
};

export const LIGHT = {
  bg: '#F5EFE6',
  surface: '#FFFFFF',
  surfaceAlt: '#EDE5D8',
  border: '#DDD0B8',
  gold: '#9A6E14',
  text: '#1A0808',
  textSub: '#2A1210',
  muted: '#7A5A40',
  faint: '#A08060',
  male: '#1A6A8A',
  maleBg: '#D8EFF8',
  maleBorder: '#1A6A8A',
  female: '#8A1A5A',
  femaleBg: '#F8D8EE',
  femaleBorder: '#8A1A5A',
  danger: '#C84A4A',
  success: '#2A9060',
  overlay: 'rgba(0,0,0,0.5)',
  statusBar: 'dark' as const,
};

export type Colors = Omit<typeof DARK, 'statusBar'> & { statusBar: 'light' | 'dark' };
