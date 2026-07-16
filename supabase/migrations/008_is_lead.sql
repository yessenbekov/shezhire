-- Lead horse flag (Үйір басшысы / Косячник)
ALTER TABLE public.shezhire_horses
  ADD COLUMN IF NOT EXISTS is_lead boolean NOT NULL DEFAULT false;
