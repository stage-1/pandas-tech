-- Add p_role parameter to create_shop_for_owner so the onboard wizard can pass the user's chosen role.
CREATE OR REPLACE FUNCTION public.create_shop_for_owner(
  p_name         text,
  p_country_code public.country_code default 'CO',
  p_timezone     text default null,
  p_currency     char(3) default null,
  p_tax_rate     numeric default null,
  p_role         public.shop_role default 'owner'
) RETURNS public.shops
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE
  v_user_id  text := current_setting('app.user_id', true);
  v_tz       text;
  v_curr     char(3);
  v_rate     numeric;
  v_shop     public.shops;
BEGIN
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_tz   := coalesce(p_timezone, CASE p_country_code
              WHEN 'CO' THEN 'America/Bogota'
              WHEN 'MX' THEN 'America/Mexico_City'
              WHEN 'CL' THEN 'America/Santiago'
              WHEN 'US' THEN 'America/Los_Angeles' END);
  v_curr := coalesce(p_currency, CASE p_country_code
              WHEN 'CO' THEN 'COP' WHEN 'MX' THEN 'MXN'
              WHEN 'CL' THEN 'CLP' WHEN 'US' THEN 'USD' END);
  v_rate := coalesce(p_tax_rate, CASE p_country_code
              WHEN 'CO' THEN 0.19 WHEN 'MX' THEN 0.16
              WHEN 'CL' THEN 0.19 WHEN 'US' THEN 0.00 END);

  INSERT INTO public.shops (name, country_code, timezone, currency, default_tax_rate)
  VALUES (p_name, p_country_code, v_tz, v_curr, v_rate)
  RETURNING * INTO v_shop;

  INSERT INTO public.shop_memberships (user_id, shop_id, role)
  VALUES (v_user_id, v_shop.id, p_role);

  RETURN v_shop;
END; $$;
