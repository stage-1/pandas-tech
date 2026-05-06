create index shop_memberships_user_idx on public.shop_memberships (user_id);
create index shop_memberships_shop_idx on public.shop_memberships (shop_id);
create index shops_country_idx         on public.shops (country_code);

create index customers_shop_name_idx
  on public.customers (shop_id, name) where deleted_at is null;
create index customers_shop_phone_idx
  on public.customers (shop_id, phone) where deleted_at is null and phone is not null;
create index customers_shop_email_idx
  on public.customers (shop_id, email) where deleted_at is null and email is not null;
create index customers_shop_taxid_idx
  on public.customers (shop_id, tax_id) where deleted_at is null and tax_id is not null;

create unique index vehicles_shop_vin_uniq
  on public.vehicles (shop_id, vin) where vin is not null and deleted_at is null;
create index vehicles_shop_plate_idx
  on public.vehicles (shop_id, license_plate) where license_plate is not null and deleted_at is null;
create index vehicles_current_customer_idx
  on public.vehicles (current_customer_id) where deleted_at is null;
create index vehicles_shop_idx on public.vehicles (shop_id) where deleted_at is null;

create index vehicle_ownerships_vehicle_idx  on public.vehicle_ownerships (vehicle_id);
create index vehicle_ownerships_customer_idx on public.vehicle_ownerships (customer_id);

create index repair_orders_shop_status_idx
  on public.repair_orders (shop_id, status) where deleted_at is null;
create index repair_orders_customer_idx
  on public.repair_orders (customer_id) where deleted_at is null;
create index repair_orders_vehicle_idx
  on public.repair_orders (vehicle_id) where deleted_at is null;

create index line_items_ro_idx on public.line_items (repair_order_id);

create index invoices_shop_idx              on public.invoices (shop_id);
create index invoices_ro_idx               on public.invoices (repair_order_id);
create index invoices_compliance_status_idx on public.invoices (shop_id, compliance_status)
  where compliance_status in ('pending','submitted','rejected');

create index payments_shop_idx    on public.payments (shop_id);
create index payments_invoice_idx on public.payments (invoice_id);
create index payments_status_idx  on public.payments (shop_id, status);
