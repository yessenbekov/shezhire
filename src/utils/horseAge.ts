import type { Sex } from '../types';

export const DEFAULT_AGE_NAMES: Record<string, string> = {
  '0': 'Құлын',
  '1': 'Тай',
  '2': 'Жабағы',
  '3': 'Дөнен',
  '5': 'Бесті',
};

export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

export function getAgeName(birthYear: number, sex: Sex, ageNames: Record<string, string>): string {
  const age = getAge(birthYear);
  if (ageNames[String(age)]) return ageNames[String(age)];
  if (age <= 0) return 'Құлын';
  if (age >= 6) return sex === 'ж' ? 'Бие' : 'Айғыр';
  return `${age} жас`;
}
