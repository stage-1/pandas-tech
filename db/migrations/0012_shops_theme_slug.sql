-- Per-tenant UI preset (CSS maps slug → semantic tokens in the app).
-- Idempotent: safe to run on databases that partially applied older versions.

ALTER TABLE public.shops
  ADD COLUMN IF NOT EXISTS theme_slug text;

UPDATE public.shops SET theme_slug = 'pandas' WHERE theme_slug IS NULL;

ALTER TABLE public.shops ALTER COLUMN theme_slug SET DEFAULT 'pandas';
ALTER TABLE public.shops ALTER COLUMN theme_slug SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shops_theme_slug_check'
      AND conrelid = 'public.shops'::regclass
  ) THEN
    ALTER TABLE public.shops
      ADD CONSTRAINT shops_theme_slug_check
      CHECK (theme_slug IN ('pandas', 'ocean', 'forest'));
  END IF;
END $$;

COMMENT ON COLUMN public.shops.theme_slug IS
  'Preset id for tenant UI tokens; palettes live in application CSS (data-shop-theme).';
