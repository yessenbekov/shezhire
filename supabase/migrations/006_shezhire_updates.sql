-- Death tracking
ALTER TABLE public.shezhire_horses ADD COLUMN IF NOT EXISTS died_at timestamptz;

-- User settings (theme + age names)
CREATE TABLE IF NOT EXISTS public.shezhire_user_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'dark',
  age_names jsonb not null default '{"0":"Құлын","1":"Тай","2":"Жабағы","3":"Дөнен","5":"Бесті"}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.shezhire_user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own settings" ON public.shezhire_user_settings;
CREATE POLICY "Users manage own settings"
  ON public.shezhire_user_settings FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
