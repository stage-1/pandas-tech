create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type public.country_code as enum ('US','MX','CL','CO');

create table public.shops (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  country_code      public.country_code not null default 'CO',
  address_line1     text,
  address_line2     text,
  city              text,
  region            text,
  postal_code       text,
  phone             text,
  email             citext,
  tax_id            text,
  tax_id_type       text,
  logo_url          text,
  timezone          text not null default 'America/Bogota',
  default_tax_rate  numeric(6,4) not null default 0.1900
                     check (default_tax_rate >= 0 and default_tax_rate < 1),
  currency          char(3) not null default 'COP'
                     check (currency ~ '^[A-Z]{3}$'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.shops is 'Tenant root. country_code drives fiscal/compliance behavior.';
comment on column public.shops.tax_id is 'NIT (CO), RFC (MX), RUT (CL), EIN (US). No format validation in DB; validate client-side per country.';

create table public.users (
  id          text primary key,
  email       citext not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create type public.shop_role as enum ('owner', 'tech');

create table public.shop_memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null references public.users(id) on delete cascade,
  shop_id     uuid not null references public.shops(id) on delete cascade,
  role        public.shop_role not null default 'tech',
  created_at  timestamptz not null default now(),
  unique (user_id, shop_id)
);
