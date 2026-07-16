-- Disposition fields on horses
ALTER TABLE public.shezhire_horses
  ADD COLUMN IF NOT EXISTS disposition text DEFAULT 'alive'
    CHECK (disposition IN ('alive', 'dead', 'sold', 'slaughtered', 'other')),
  ADD COLUMN IF NOT EXISTS disposition_notes text,
  ADD COLUMN IF NOT EXISTS disposed_at timestamptz;

-- Migrate existing died_at data
UPDATE public.shezhire_horses
  SET disposition = 'dead', disposed_at = died_at
  WHERE died_at IS NOT NULL AND disposition IS NULL;

-- Language preference in user settings
ALTER TABLE public.shezhire_user_settings
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'kk';
