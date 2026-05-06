-- updated_at on every table
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger trg_shops_updated_at              before update on public.shops              for each row execute function public.set_updated_at();
create trigger trg_users_updated_at              before update on public.users              for each row execute function public.set_updated_at();
create trigger trg_customers_updated_at          before update on public.customers          for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated_at           before update on public.vehicles           for each row execute function public.set_updated_at();
create trigger trg_vehicle_ownerships_updated_at before update on public.vehicle_ownerships for each row execute function public.set_updated_at();
create trigger trg_repair_orders_updated_at      before update on public.repair_orders      for each row execute function public.set_updated_at();
create trigger trg_line_items_updated_at         before update on public.line_items         for each row execute function public.set_updated_at();
create trigger trg_invoices_updated_at           before update on public.invoices           for each row execute function public.set_updated_at();
create trigger trg_payments_updated_at           before update on public.payments           for each row execute function public.set_updated_at();

-- Country-aware shop creation. Caller passes country_code; defaults derived from it.
create or replace function public.create_shop_for_owner(
  p_name         text,
  p_country_code public.country_code default 'CO',
  p_timezone     text default null,
  p_currency     char(3) default null,
  p_tax_rate     numeric default null
) returns public.shops
language plpgsql security definer
set search_path = public, pg_temp as $$
declare
  v_user_id  text := current_setting('app.user_id', true);
  v_tz       text;
  v_curr     char(3);
  v_rate     numeric;
  v_shop     public.shops;
begin
  if v_user_id is null or v_user_id = '' then raise exception 'not authenticated'; end if;

  v_tz   := coalesce(p_timezone, case p_country_code
              when 'CO' then 'America/Bogota'
              when 'MX' then 'America/Mexico_City'
              when 'CL' then 'America/Santiago'
              when 'US' then 'America/Los_Angeles' end);
  v_curr := coalesce(p_currency, case p_country_code
              when 'CO' then 'COP' when 'MX' then 'MXN'
              when 'CL' then 'CLP' when 'US' then 'USD' end);
  v_rate := coalesce(p_tax_rate, case p_country_code
              when 'CO' then 0.19 when 'MX' then 0.16
              when 'CL' then 0.19 when 'US' then 0.00 end);

  insert into public.shops (name, country_code, timezone, currency, default_tax_rate)
  values (p_name, p_country_code, v_tz, v_curr, v_rate)
  returning * into v_shop;

  insert into public.shop_memberships (user_id, shop_id, role)
  values (v_user_id, v_shop.id, 'owner');

  return v_shop;
end; $$;
revoke execute on function public.create_shop_for_owner(text,public.country_code,text,char,numeric) from public;
grant  execute on function public.create_shop_for_owner(text,public.country_code,text,char,numeric) to authenticated;

-- Snapshot currency + country + tax_rate onto RO at insert
create or replace function public.assign_repair_order_defaults()
returns trigger language plpgsql as $$
declare v_next int; v_shop public.shops%rowtype;
begin
  select * into v_shop from public.shops where id = new.shop_id;
  if new.currency is null     then new.currency     := v_shop.currency; end if;
  if new.country_code is null then new.country_code := v_shop.country_code; end if;
  if new.tax_rate is null     then new.tax_rate     := v_shop.default_tax_rate; end if;

  if new.ro_number is null or new.ro_number = 0 then
    perform pg_advisory_xact_lock(hashtext('repair_orders'::text || new.shop_id::text));
    select coalesce(max(ro_number),0)+1 into v_next
      from public.repair_orders where shop_id = new.shop_id;
    new.ro_number := v_next;
  end if;
  return new;
end; $$;
create trigger trg_repair_orders_assign_defaults
  before insert on public.repair_orders for each row execute function public.assign_repair_order_defaults();

-- Snapshot currency + country onto invoice; set compliance_status per country; assign invoice_number
create or replace function public.assign_invoice_defaults()
returns trigger language plpgsql as $$
declare v_next int; v_ro public.repair_orders%rowtype;
begin
  select * into v_ro from public.repair_orders where id = new.repair_order_id;
  if new.currency is null     then new.currency     := v_ro.currency; end if;
  if new.country_code is null then new.country_code := v_ro.country_code; end if;
  if new.compliance_status = 'not_required' and v_ro.country_code <> 'US' then
    new.compliance_status := 'pending';
  end if;
  if new.invoice_number is null or new.invoice_number = 0 then
    perform pg_advisory_xact_lock(hashtext('invoices'::text || new.shop_id::text));
    select coalesce(max(invoice_number),0)+1 into v_next
      from public.invoices where shop_id = new.shop_id;
    new.invoice_number := v_next;
  end if;
  return new;
end; $$;
create trigger trg_invoices_assign_defaults
  before insert on public.invoices for each row execute function public.assign_invoice_defaults();

-- Recompute RO totals when line_items change
create or replace function public.update_repair_order_totals()
returns trigger language plpgsql as $$
declare
  v_ro_id          uuid;
  v_subtotal_minor bigint;
  v_taxable_minor  bigint;
  v_tax_rate       numeric(6,4);
  v_tax_minor      bigint;
begin
  v_ro_id := coalesce(new.repair_order_id, old.repair_order_id);
  select tax_rate into v_tax_rate from public.repair_orders where id = v_ro_id;
  select
    coalesce(sum(round((qty::numeric * unit_price_minor::numeric))::bigint), 0),
    coalesce(sum(round((qty::numeric * unit_price_minor::numeric))::bigint) filter (where taxable), 0)
  into v_subtotal_minor, v_taxable_minor
  from public.line_items where repair_order_id = v_ro_id;
  v_tax_minor := round((v_taxable_minor::numeric * coalesce(v_tax_rate, 0)::numeric))::bigint;
  update public.repair_orders
     set subtotal_minor = v_subtotal_minor,
         tax_minor      = v_tax_minor,
         total_minor    = v_subtotal_minor + v_tax_minor,
         updated_at     = now()
   where id = v_ro_id;
  return null;
end; $$;
create trigger trg_line_items_recompute_totals
  after insert or update or delete on public.line_items
  for each row execute function public.update_repair_order_totals();

-- Stamp status timestamps on transition
create or replace function public.set_status_timestamps()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'approved'  and new.approved_at  is null then new.approved_at  := now(); end if;
    if new.status = 'declined'  and new.declined_at  is null then new.declined_at  := now(); end if;
    if new.status = 'completed' and new.completed_at is null then new.completed_at := now(); end if;
  end if;
  return new;
end; $$;
create trigger trg_repair_orders_status_timestamps
  before update on public.repair_orders for each row execute function public.set_status_timestamps();

-- Keep vehicles.current_customer_id in sync with the open ownership row
create or replace function public.sync_vehicle_current_owner()
returns trigger language plpgsql as $$
declare v_vehicle_id uuid; v_current uuid;
begin
  v_vehicle_id := coalesce(new.vehicle_id, old.vehicle_id);
  select customer_id into v_current
    from public.vehicle_ownerships
    where vehicle_id = v_vehicle_id and ended_at is null limit 1;
  update public.vehicles set current_customer_id = v_current, updated_at = now()
   where id = v_vehicle_id;
  return null;
end; $$;
create trigger trg_vehicle_ownerships_sync_current
  after insert or update or delete on public.vehicle_ownerships
  for each row execute function public.sync_vehicle_current_owner();

-- Public approval RPC — SECURITY DEFINER, safe projection only
create or replace function public.get_repair_order_by_token(p_token text)
returns jsonb language plpgsql security definer stable
set search_path = public, pg_temp as $$
declare v_result jsonb;
begin
  if p_token is null or length(p_token) < 16 then return null; end if;
  select jsonb_build_object(
    'repair_order', jsonb_build_object(
      'id', ro.id, 'ro_number', ro.ro_number, 'status', ro.status,
      'complaint', ro.complaint, 'odometer_in', ro.odometer_in,
      'currency', ro.currency, 'country_code', ro.country_code,
      'subtotal_minor', ro.subtotal_minor, 'tax_minor', ro.tax_minor,
      'total_minor', ro.total_minor,
      'approved_at', ro.approved_at, 'declined_at', ro.declined_at,
      'completed_at', ro.completed_at, 'created_at', ro.created_at
    ),
    'line_items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', li.id, 'type', li.type, 'description', li.description,
        'qty', li.qty, 'unit_price_minor', li.unit_price_minor,
        'taxable', li.taxable, 'position', li.position
      ) order by li.position, li.created_at)
      from public.line_items li where li.repair_order_id = ro.id
    ), '[]'::jsonb),
    'vehicle', jsonb_build_object(
      'year', v.year, 'make', v.make, 'model', v.model,
      'trim', v.trim, 'color', v.color, 'license_plate', v.license_plate
    ),
    'shop', jsonb_build_object(
      'name', s.name, 'phone', s.phone, 'email', s.email,
      'address_line1', s.address_line1, 'city', s.city, 'region', s.region,
      'postal_code', s.postal_code, 'country_code', s.country_code,
      'logo_url', s.logo_url, 'currency', s.currency
    )
  ) into v_result
  from public.repair_orders ro
  join public.vehicles v on v.id = ro.vehicle_id
  join public.shops    s on s.id = ro.shop_id
  where ro.public_token = p_token and ro.deleted_at is null;
  return v_result;
end; $$;
revoke execute on function public.get_repair_order_by_token(text) from public;
grant  execute on function public.get_repair_order_by_token(text) to anon, authenticated;

-- Approve / decline by token
create or replace function public.approve_repair_order_by_token(p_token text)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_count int;
begin
  update public.repair_orders set status = 'approved'
   where public_token = p_token and status = 'pending' and deleted_at is null;
  get diagnostics v_count = row_count; return v_count > 0;
end; $$;
revoke execute on function public.approve_repair_order_by_token(text) from public;
grant  execute on function public.approve_repair_order_by_token(text) to anon, authenticated;

create or replace function public.decline_repair_order_by_token(p_token text, p_reason text)
returns boolean language plpgsql security definer
set search_path = public, pg_temp as $$
declare v_count int;
begin
  update public.repair_orders set status = 'declined', decline_reason = p_reason
   where public_token = p_token and status = 'pending' and deleted_at is null;
  get diagnostics v_count = row_count; return v_count > 0;
end; $$;
revoke execute on function public.decline_repair_order_by_token(text,text) from public;
grant  execute on function public.decline_repair_order_by_token(text,text) to anon, authenticated;
