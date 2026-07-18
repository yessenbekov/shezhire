import type { Sex } from '../types';

export const DEFAULT_AGE_NAMES: Record<string, string> = {
  '0': 'Құлын',
  '1': 'Тай',
  '2': 'Жабағы',
  '3': 'Дөнен',
  '4': 'Тобылғы',
  '5': 'Бесті',
};

export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function getAgeName(birthYear: number, sex: Sex, ageNames: Record<string, string>): string {
  const age = getAge(birthYear);
  const key = String(Math.max(0, age));
  if (ageNames[key]) return ageNames[key];
  if (ageNames[String(age)]) return ageNames[String(age)];
  if (age <= 0) return ageNames['0'] ?? DEFAULT_AGE_NAMES['0'];
  if (age >= 6) return sex === 'ж' ? (ageNames['6f'] ?? 'Бие') : (ageNames['6'] ?? 'Айғыр');
  return DEFAULT_AGE_NAMES[key] ?? `${age} жас`;
}
