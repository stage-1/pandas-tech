alter table public.shops              enable row level security;
alter table public.users              enable row level security;
alter table public.shop_memberships   enable row level security;
alter table public.customers          enable row level security;
alter table public.vehicles           enable row level security;
alter table public.vehicle_ownerships enable row level security;
alter table public.repair_orders      enable row level security;
alter table public.line_items         enable row level security;
alter table public.invoices           enable row level security;
alter table public.payments           enable row level security;

create or replace function public.current_user_shop_ids()
returns setof uuid language sql stable security invoker
set search_path = public, pg_temp as $$
  select shop_id from public.shop_memberships
  where user_id = current_setting('app.user_id', true);
$$;

-- users: self only
create policy users_self_select on public.users for select to authenticated
  using (id = current_setting('app.user_id', true));
create policy users_self_update on public.users for update to authenticated
  using (id = current_setting('app.user_id', true))
  with check (id = current_setting('app.user_id', true));

-- shops: members read; owners update; insert only via create_shop_for_owner RPC
create policy shops_member_select on public.shops for select to authenticated
  using (id in (select public.current_user_shop_ids()));
create policy shops_owner_update on public.shops for update to authenticated
  using (id in (select shop_id from public.shop_memberships where user_id = current_setting('app.user_id', true) and role = 'owner'))
  with check (id in (select shop_id from public.shop_memberships where user_id = current_setting('app.user_id', true) and role = 'owner'));

-- shop_memberships
create policy memberships_self_select on public.shop_memberships for select to authenticated
  using (
    user_id = current_setting('app.user_id', true)
    or shop_id in (select shop_id from public.shop_memberships where user_id = current_setting('app.user_id', true) and role = 'owner')
  );
create policy memberships_owner_insert on public.shop_memberships for insert to authenticated
  with check (shop_id in (select shop_id from public.shop_memberships where user_id = current_setting('app.user_id', true) and role = 'owner'));
create policy memberships_owner_update on public.shop_memberships for update to authenticated
  using (shop_id in (select shop_id from public.shop_memberships where user_id = current_setting('app.user_id', true) and role = 'owner'));
create policy memberships_owner_delete on public.shop_memberships for delete to authenticated
  using (shop_id in (select shop_id from public.shop_memberships where user_id = current_setting('app.user_id', true) and role = 'owner'));

-- customers
create policy customers_member_select on public.customers for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy customers_member_insert on public.customers for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy customers_member_update on public.customers for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
create policy customers_member_delete on public.customers for delete to authenticated
  using (shop_id in (select public.current_user_shop_ids()));

-- vehicles
create policy vehicles_member_select on public.vehicles for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy vehicles_member_insert on public.vehicles for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy vehicles_member_update on public.vehicles for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
create policy vehicles_member_delete on public.vehicles for delete to authenticated
  using (shop_id in (select public.current_user_shop_ids()));

-- vehicle_ownerships
create policy vehicle_ownerships_member_select on public.vehicle_ownerships for select to authenticated
  using (vehicle_id in (select id from public.vehicles where shop_id in (select public.current_user_shop_ids())));
create policy vehicle_ownerships_member_insert on public.vehicle_ownerships for insert to authenticated
  with check (vehicle_id in (select id from public.vehicles where shop_id in (select public.current_user_shop_ids())));
create policy vehicle_ownerships_member_update on public.vehicle_ownerships for update to authenticated
  using (vehicle_id in (select id from public.vehicles where shop_id in (select public.current_user_shop_ids())));
create policy vehicle_ownerships_member_delete on public.vehicle_ownerships for delete to authenticated
  using (vehicle_id in (select id from public.vehicles where shop_id in (select public.current_user_shop_ids())));

-- repair_orders
create policy repair_orders_member_select on public.repair_orders for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy repair_orders_member_insert on public.repair_orders for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy repair_orders_member_update on public.repair_orders for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
create policy repair_orders_member_delete on public.repair_orders for delete to authenticated
  using (shop_id in (select public.current_user_shop_ids()));

-- line_items
create policy line_items_member_select on public.line_items for select to authenticated
  using (repair_order_id in (select id from public.repair_orders where shop_id in (select public.current_user_shop_ids())));
create policy line_items_member_insert on public.line_items for insert to authenticated
  with check (repair_order_id in (select id from public.repair_orders where shop_id in (select public.current_user_shop_ids())));
create policy line_items_member_update on public.line_items for update to authenticated
  using (repair_order_id in (select id from public.repair_orders where shop_id in (select public.current_user_shop_ids())));
create policy line_items_member_delete on public.line_items for delete to authenticated
  using (repair_order_id in (select id from public.repair_orders where shop_id in (select public.current_user_shop_ids())));

-- invoices
create policy invoices_member_select on public.invoices for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy invoices_member_insert on public.invoices for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy invoices_member_update on public.invoices for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
create policy invoices_member_delete on public.invoices for delete to authenticated
  using (shop_id in (select public.current_user_shop_ids()));

-- payments (no delete — refunds are status changes)
create policy payments_member_select on public.payments for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy payments_member_insert on public.payments for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy payments_member_update on public.payments for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
