create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  name          text not null,
  email         citext,
  phone         text,
  tax_id        text,
  tax_id_type   text,
  address_line1 text,
  address_line2 text,
  city          text,
  region        text,
  postal_code   text,
  notes         text,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on column public.customers.tax_id is 'Required for fiscal invoicing in MX/CL; common for B2B in CO. Optional in US.';

create table public.vehicles (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null references public.shops(id) on delete cascade,
  current_customer_id  uuid references public.customers(id) on delete set null,
  vin                  text,
  year                 int  check (year between 1900 and 2100),
  make                 text,
  model                text,
  trim                 text,
  color                text,
  license_plate        text,
  notes                text,
  soat_expires_at      timestamptz,
  tecnicomecanica_expires_at timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint vin_format check (vin is null or char_length(vin) between 11 and 17)
);
comment on column public.vehicles.soat_expires_at is 'CO only. SOAT expiry date for customer notification feature.';
comment on column public.vehicles.tecnicomecanica_expires_at is 'CO only. Tecnomecánica expiry date for customer notification feature.';

create table public.vehicle_ownerships (
  id           uuid primary key default gen_random_uuid(),
  vehicle_id   uuid not null references public.vehicles(id) on delete cascade,
  customer_id  uuid not null references public.customers(id) on delete restrict,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
create unique index vehicle_ownerships_one_open_per_vehicle
  on public.vehicle_ownerships (vehicle_id) where ended_at is null;
