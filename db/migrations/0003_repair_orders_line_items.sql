create type public.repair_order_status as enum (
  'draft','pending','approved','in_progress','completed','declined','cancelled'
);

create table public.repair_orders (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete restrict,
  vehicle_id      uuid not null references public.vehicles(id) on delete restrict,
  ro_number       int  not null,
  status          public.repair_order_status not null default 'draft',
  public_token    text not null default encode(gen_random_bytes(24),'hex'),
  complaint       text,
  internal_notes  text,
  decline_reason  text,
  odometer_in     int  check (odometer_in  >= 0),
  odometer_out    int  check (odometer_out >= 0),
  currency        char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  country_code    public.country_code,
  tax_rate        numeric(6,4) check (tax_rate is null or (tax_rate >= 0 and tax_rate < 1)),
  subtotal_minor  bigint not null default 0 check (subtotal_minor >= 0),
  tax_minor       bigint not null default 0 check (tax_minor      >= 0),
  total_minor     bigint not null default 0 check (total_minor    >= 0),
  approved_at     timestamptz,
  declined_at     timestamptz,
  completed_at    timestamptz,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (shop_id, ro_number),
  unique (public_token)
);
comment on column public.repair_orders.tax_rate is
  'VAT/sales-tax rate snapshot. NULL on insert => inherit shops.default_tax_rate in trigger; explicit 0 => exempt.';
comment on column public.repair_orders.subtotal_minor is
  'Amount in currency minor units. Currency comes from the snapshotted currency column.';

create type public.line_item_type as enum ('labor','part');

create table public.line_items (
  id                uuid primary key default gen_random_uuid(),
  repair_order_id   uuid not null references public.repair_orders(id) on delete cascade,
  type              public.line_item_type not null,
  description       text not null,
  qty               numeric(10,2) not null default 1.00 check (qty > 0),
  unit_price_minor  bigint not null check (unit_price_minor >= 0),
  taxable           boolean not null default true,
  position          int     not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
