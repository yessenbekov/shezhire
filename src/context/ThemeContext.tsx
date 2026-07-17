import React, { createContext, useContext, useState, useEffect } from 'react';
import { DARK, LIGHT, type ThemeMode, type Colors } from '../theme';
import { DEFAULT_AGE_NAMES } from '../utils/horseAge';
import { supabase } from '../lib/supabase';
import type { Lang } from '../i18n';

interface ThemeCtx {
  mode: ThemeMode;
  C: Colors;
  toggleTheme: () => void;
  ageNames: Record<string, string>;
  saveAgeNames: (names: Record<string, string>) => Promise<void>;
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
}

const ThemeContext = createContext<ThemeCtx>({
  mode: 'light',
  C: LIGHT,
  toggleTheme: () => {},
  ageNames: DEFAULT_AGE_NAMES,
  saveAgeNames: async () => {},
  lang: 'kk',
  setLang: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [ageNames, setAgeNames] = useState<Record<string, string>>(DEFAULT_AGE_NAMES);
  const [lang, setLangState] = useState<Lang>('kk');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadSettings(session.user.id);
      else { setMode('light'); setAgeNames(DEFAULT_AGE_NAMES); }
    });
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadSettings(user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function loadSettings(userId: string) {
    const { data } = await supabase
      .from('shezhire_user_settings')
      .select('theme, age_names, language')
      .eq('id', userId)
      .single();
    if (data) {
      setMode((data.theme as ThemeMode) ?? 'light');
      setAgeNames(data.age_names ?? DEFAULT_AGE_NAMES);
      setLangState((data.language as Lang) ?? 'kk');
    }
  }

  async function toggleTheme() {
    const next: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('shezhire_user_settings').upsert({ id: user.id, theme: next, updated_at: new Date().toISOString() });
  }

  async function saveAgeNames(names: Record<string, string>) {
    setAgeNames(names);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('shezhire_user_settings').upsert({ id: user.id, age_names: names, updated_at: new Date().toISOString() });
  }

  async function setLang(l: Lang) {
    setLangState(l);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('shezhire_user_settings').upsert({ id: user.id, language: l, updated_at: new Date().toISOString() });
  }

  return (
    <ThemeContext.Provider value={{ mode, C: mode === 'dark' ? DARK : LIGHT, toggleTheme, ageNames, saveAgeNames, lang, setLang }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
