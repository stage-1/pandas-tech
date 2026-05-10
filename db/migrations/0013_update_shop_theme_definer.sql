-- Theme updates from the app bypass RLS on public.shops (same pattern as create_shop_for_owner).
-- Validates session user via current_setting('app.user_id') and owner role on resolved shop row.

CREATE OR REPLACE FUNCTION public.update_shop_theme_for_session(p_theme_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid       text := nullif(trim(current_setting('app.user_id', true)), '');
  v_shop_id   uuid;
  v_role      public.shop_role;
BEGIN
  IF v_uid IS NULL OR v_uid = '' THEN
    RAISE EXCEPTION 'not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_theme_slug NOT IN ('pandas', 'ocean', 'forest') THEN
    RAISE EXCEPTION 'invalid theme_slug'
      USING ERRCODE = '23514'; -- check_violation
  END IF;

  SELECT s.id, m.role
  INTO v_shop_id, v_role
  FROM public.shops s
  JOIN public.shop_memberships m ON m.shop_id = s.id
  WHERE m.user_id = v_uid
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_shop' USING ERRCODE = '02000';
  END IF;

  IF v_role IS DISTINCT FROM 'owner'::public.shop_role THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501'; -- insufficient_privilege
  END IF;

  UPDATE public.shops
  SET theme_slug = p_theme_slug,
      updated_at = now()
  WHERE id = v_shop_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'shop_update_failed';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.update_shop_theme_for_session(text)
  IS 'Applies tenant theme_slug for app.user_id shop (first membership LIMIT 1), owner-only.';

REVOKE ALL ON FUNCTION public.update_shop_theme_for_session(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_shop_theme_for_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_shop_theme_for_session(text) TO service_role;