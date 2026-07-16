export type Sex = 'м' | 'ж';

export interface Herd {
  id: string;
  owner_id: string;
  name: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface Horse {
  id: string;
  owner_id: string;
  herd_id: string | null;
  brand: string;          // "26/35"
  sequence_no: number;    // 35
  birth_year: number;     // 2026
  sex: Sex;               // нечётный → 'м', чётный → 'ж'
  name: string | null;    // кличка
  breed: string | null;
  color: string | null;
  sire_id: string | null; // отец
  dam_id: string | null;  // мать
  photo_url: string | null;
  notes: string | null;
  is_public: boolean;
  is_lead: boolean;
  died_at: string | null;
  disposition: 'alive' | 'dead' | 'sold' | 'slaughtered' | 'other' | null;
  disposition_notes: string | null;
  disposed_at: string | null;
  created_at: string;
  // joined
  sire?: Horse | null;
  dam?: Horse | null;
  herd?: Herd | null;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  region: string | null;
  avatar_url: string | null;
}

export function parseBrand(brand: string): { sequenceNo: number; birthYear: number; sex: Sex } | null {
  const match = brand.match(/^(\d{2})\/(\d+)$/);
  if (!match) return null;
  const birthYear = 2000 + parseInt(match[1], 10);
  const sequenceNo = parseInt(match[2], 10);
  const sex: Sex = sequenceNo % 2 === 0 ? 'ж' : 'м';
  return { sequenceNo, birthYear, sex };
}
