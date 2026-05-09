ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS manufacturer   text,
  ADD COLUMN IF NOT EXISTS plant_country  text,
  ADD COLUMN IF NOT EXISTS make_logo_url  text;
