# Mechanic Shop SaaS — Postgres / Supabase Schema Plan

## Context

The repo is a fresh Next.js 15 + Supabase project (no DB layer yet) implementing the MVP scoped in [mechanic-shop-prd-mvp-spec-v1.1.docx](docs/product/mechanic-shop-prd-mvp-spec-v1.1.docx). The MVP covers: kanban (New → Approved → Done) repair-order board, RO builder with labor + parts line items, customer-facing public approval link, downloadable PDF invoices, and a searchable customer + vehicle database. Auth + RLS via Supabase.

**Initial market: Latin America-first launch with Colombia as the lead market, plus Mexico, Chile, and USA.** Each country has different fiscal/regulatory needs (DIAN in CO, CFDI/SAT in MX, DTE/SII in CL, state-level sales tax in US). The schema is country-aware from day one, but country-specific compliance integrations (PSE providers, payment processors) are deliberately deferred so the MVP can ship without provider contracts on day one.

The user explicitly asked: vehicles as their own table with a UUID PK + VIN — yes, and the plan goes further with an ownership-history table so vehicles outlive any single customer (sales, transfers, fleets).

### Confirmed design decisions

| # | Decision | Why |
|---|---|---|
| 1 | Vehicles independent + `vehicle_ownerships` history + denormalized `current_customer_id` | Real-world vehicles change hands; history is essential for service-record continuity. Denormalized FK keeps the kanban / RO-creation hot path single-index. |
| 2 | `shop_memberships` join (users ↔ shops, role per row) | Free now, unlocks multi-location / employee invites in Month 5+ with no migration. |
| 3 | VIN unique per shop, nullable — `UNIQUE(shop_id, vin) WHERE vin IS NOT NULL` | Allow null at intake; prevent dup within a shop; let two shops legitimately service the same vehicle. |
| 4 | RO totals stored on `repair_orders`, recomputed via trigger when `line_items` change | Stable numbers for invoices, payments, reports; one source of truth. |
| 4b | `repair_orders.tax_rate` nullable on insert; `NULL` = inherit from `shops.default_tax_rate`; explicit `0` = zero RO-level rate (e.g. exempt) | Avoids conflating “unset” with a legitimate 0% snapshot. |
| 5 | Mileage on RO (`odometer_in`, `odometer_out`) | Industry standard; cheap now, expensive to backfill. Powers v2 service-interval reminders. |
| 6 | Status timestamps (`approved_at`, `declined_at`, `completed_at`, `decline_reason`) — defer event-stream table | Powers KPI ("avg approval < 2h") with one subtraction. Event table can be added later without backfill. |
| 7 | Soft delete via `deleted_at TIMESTAMPTZ NULL`; partial indexes exclude deleted rows | Trash-can semantics, undo, preserved analytics. |
| 8 | `shops.country_code` enum (`'US','MX','CL','CO'`) drives defaults + downstream compliance behavior | Country-aware pricing, tax rate, timezone, fiscal-doc requirements. |
| 9 | Money as `BIGINT` minor units (columns named `_minor`, not `_cents`) | "Minor unit" is currency-agnostic — works for USD cents, COP/CLP centavos (rarely used in practice), MXN cents. Matches Stripe/Wompi/PayU wire format; avoids JS float drift. |
| 10 | Single currency per shop (snapshotted onto each RO and invoice) | Each shop transacts in one currency. Cross-shop rollups in a reporting currency are a deferred concern. |
| 11 | Compliance fields on `invoices` for DIAN / SAT-CFDI / SII-DTE — schema-ready, integration deferred | A generic compliance model (`compliance_provider`, `compliance_doc_id`, `compliance_status`, XML storage path, QR URL, plus a `compliance_data jsonb` for country-specific extras) lets you ship pilot shops on PDF and add a PSE per country without migrations. |
| 12 | Provider-agnostic `payments` (no Stripe-specific columns) | Stripe Connect is not available for CO/CL merchants. `provider` enum + generic `provider_payment_id` / `provider_charge_id` works for Wompi, PayU, Mercado Pago, Stripe (US/MX), or future processors. |
| 13 | UUID PKs everywhere via `gen_random_uuid()` (pgcrypto) | Client-side IDs (optimistic UI), unguessable URLs, future cross-shop merges. |

### Deliberately out of MVP (with plug-in points — see §9)

Event-stream / audit log · multi-currency conversion · normalized multi-jurisdiction tax lines · per-country PSE provider integrations (Alegra/Siigo/Loggro for CO, Finkok/Edicom for MX, Haulmer/Nubox for CL) · live payment provider integrations (Wompi/PayU/Mercado Pago/Stripe) · vehicle photos & RO attachments · DVI inspections · parts inventory · technician time-tracking · customer portal accounts · outbound webhooks · SaaS-level subscription billing.

---

## §2 Country & Fiscal Model (lead-market overview)

| Country | Currency | Default IVA / sales tax | Tax-ID (shop) | Tax-ID (customer for invoicing) | E-invoicing regulator | Common PSE / providers |
|---|---|---|---|---|---|---|
| **CO** Colombia | COP | 19% | NIT | NIT or CC | DIAN (CUFE, UBL XML, *resoluciones*) | Alegra, Siigo, Loggro |
| **MX** Mexico | MXN | 16% (8% in border) | RFC | RFC | SAT (CFDI 4.0, UUID, XML) | Finkok, Edicom, Facturama |
| **CL** Chile | CLP | 19% | RUT | RUT | SII (DTE, *folio*, XML) | Haulmer, Nubox, OpenFactura |
| **US** USA | USD | Variable by state (0–10.5%) | EIN | (usually n/a) | None federal | (Stripe direct; no PSE) |

The schema captures this with a `country_code` on `shops`, defaults selected at shop-creation time (currency, timezone, IVA), and an opaque `compliance_data jsonb` on `invoices` for country-specific fields not worth normalizing yet (border-zone IVA flag, *régimen fiscal* for MX, *resolución* number for CO, *folio* for CL).

---

## §3 File Layout

```
supabase/
├── config.toml                       (created by `supabase init`)
├── migrations/
│   ├── 0001_init_shops_users.sql
│   ├── 0002_customers_vehicles.sql
│   ├── 0003_repair_orders_line_items.sql
│   ├── 0004_invoices_payments.sql
│   ├── 0005_rls_policies.sql
│   ├── 0006_triggers_functions.sql
│   └── 0007_indexes.sql
└── seed.sql                          (optional local-dev seed)
```

One concern per migration. Order: tables → policies → triggers → indexes.

---

## §4 DDL

### `0001_init_shops_users.sql`

```sql
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive emails

-- supported markets for v1
create type public.country_code as enum ('US','MX','CL','CO');

create table public.shops (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  country_code      public.country_code not null default 'CO',
  address_line1     text,
  address_line2     text,
  city              text,
  region            text,                                -- state / departamento / región / estado
  postal_code       text,
  phone             text,
  email             citext,
  tax_id            text,                                -- NIT / RFC / RUT / EIN
  tax_id_type       text,                                -- 'NIT','RFC','RUT','EIN' (free-text for forward compat)
  logo_url          text,
  timezone          text not null default 'America/Bogota',
  default_tax_rate  numeric(6,4) not null default 0.1900 -- 19% IVA; override at shop create per country
                     check (default_tax_rate >= 0 and default_tax_rate < 1),
  currency          char(3) not null default 'COP'
                     check (currency ~ '^[A-Z]{3}$'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.shops is 'Tenant root. country_code drives fiscal/compliance behavior.';
comment on column public.shops.tax_id is 'NIT (CO), RFC (MX), RUT (CL), EIN (US). No format validation in DB; validate client-side per country.';

create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       citext not null,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create type public.shop_role as enum ('owner', 'tech');

create table public.shop_memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  shop_id     uuid not null references public.shops(id) on delete cascade,
  role        public.shop_role not null default 'tech',
  created_at  timestamptz not null default now(),
  unique (user_id, shop_id)
);
```

### `0002_customers_vehicles.sql`

```sql
create table public.customers (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  name          text not null,
  email         citext,
  phone         text,
  tax_id        text,                                    -- NIT/CC for CO, RFC for MX, RUT for CL, opt. for US
  tax_id_type   text,                                    -- 'NIT','CC','RFC','RUT','EIN'
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
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint vin_format check (vin is null or char_length(vin) between 11 and 17)
);

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
```

### `0003_repair_orders_line_items.sql`

```sql
create type public.repair_order_status as enum (
  'draft','pending','approved','in_progress','completed','declined','cancelled'
);

create table public.repair_orders (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid not null references public.shops(id) on delete cascade,
  customer_id     uuid not null references public.customers(id) on delete restrict,
  vehicle_id      uuid not null references public.vehicles(id) on delete restrict,
  ro_number       int  not null,                                  -- per-shop, set by trigger
  status          public.repair_order_status not null default 'draft',
  public_token    text not null default encode(gen_random_bytes(24),'hex'),
  complaint       text,
  internal_notes  text,                                           -- never exposed to public RPC
  decline_reason  text,                                           -- never exposed to public RPC
  odometer_in     int  check (odometer_in  >= 0),
  odometer_out    int  check (odometer_out >= 0),
  -- Snapshotted at creation so retroactive shop edits don't change historical ROs.
  -- Omit nullable snapshot columns on INSERT; BEFORE INSERT trigger fills NULL from shop (see §6).
  currency        char(3)
                     check (currency is null or currency ~ '^[A-Z]{3}$'),
  country_code    public.country_code,
  tax_rate        numeric(6,4)
                     check (tax_rate is null or (tax_rate >= 0 and tax_rate < 1)),
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
  'VAT/sales-tax rate snapshot for taxable line totals. NULL on insert ⇒ inherit shops.default_tax_rate in trigger; explicit 0 ⇒ no RO-level tax on taxable lines.';
comment on column public.repair_orders.subtotal_minor is
  'Amount in currency minor units (USD cents, COP/CLP/MXN centavos). Currency comes from the snapshotted currency column.';

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
```

### `0004_invoices_payments.sql`

```sql
-- Per-country fiscal compliance state
create type public.compliance_provider as enum (
  'none',                  -- US (no e-invoicing) or pre-integration pilot
  'alegra','siigo','loggro',           -- Colombia (DIAN)
  'finkok','edicom','facturama',       -- Mexico (SAT/CFDI)
  'haulmer','nubox','openfactura'      -- Chile (SII/DTE)
);
create type public.compliance_status as enum (
  'not_required',          -- US
  'pending',               -- created locally, not yet submitted
  'submitted',             -- sent to provider/regulator, awaiting ack
  'accepted',              -- regulator approved (CUFE/UUID/Folio assigned)
  'rejected'               -- regulator rejected; see compliance_data->error
);

create table public.invoices (
  id                       uuid primary key default gen_random_uuid(),
  shop_id                  uuid not null references public.shops(id) on delete cascade,
  repair_order_id          uuid not null references public.repair_orders(id) on delete restrict,
  invoice_number           int  not null,                       -- per-shop, set by trigger; for CO/MX/CL this MUST eventually align with regulator-issued range
  -- snapshotted financials
  currency                 char(3) not null,
  country_code             public.country_code not null,
  subtotal_minor           bigint not null check (subtotal_minor >= 0),
  tax_minor                bigint not null check (tax_minor >= 0),
  total_minor              bigint not null check (total_minor >= 0),
  amount_paid_minor        bigint not null default 0 check (amount_paid_minor >= 0),
  -- artifacts
  pdf_storage_path         text,                                -- supabase storage key
  -- fiscal/compliance
  compliance_provider      public.compliance_provider not null default 'none',
  compliance_status        public.compliance_status   not null default 'not_required',
  compliance_doc_id        text,                                -- CUFE (CO) / UUID (MX-CFDI) / Folio (CL-DTE)
  compliance_xml_storage_path text,                             -- signed XML returned by PSE
  compliance_qr_url        text,                                -- regulator QR (DIAN, SAT)
  compliance_submitted_at  timestamptz,
  compliance_accepted_at   timestamptz,
  compliance_data          jsonb not null default '{}'::jsonb,  -- country-specific extras (resolution_id, regimen_fiscal, etc.)
  -- timestamps
  generated_at             timestamptz not null default now(),
  due_at                   timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (shop_id, invoice_number),
  unique (repair_order_id)
);
comment on column public.invoices.compliance_data is
  'Country-specific fiscal extras: CO {resolution_id, prefix}; MX {usoCFDI, regimenFiscalReceptor, formaPago}; CL {tipoDTE, folio_resolucion}; US {} (empty).';

-- Provider-agnostic payments (Wompi, PayU, Mercado Pago, Stripe, etc.)
create type public.payment_provider as enum (
  'manual','stripe','wompi','payu','mercado_pago','culqi','other'
);
create type public.payment_status as enum (
  'pending','processing','succeeded','failed','refunded','partially_refunded'
);
create type public.payment_method as enum ('card','cash','check','ach','pse','transfer','other');
-- 'pse' here is Colombia's bank-transfer rail (Pagos Seguros en Línea), not the e-invoice acronym.

create table public.payments (
  id                     uuid primary key default gen_random_uuid(),
  shop_id                uuid not null references public.shops(id) on delete cascade,
  invoice_id             uuid not null references public.invoices(id) on delete restrict,
  amount_minor           bigint not null check (amount_minor > 0),
  currency               char(3) not null,
  status                 public.payment_status not null default 'pending',
  method                 public.payment_method not null default 'card',
  provider               public.payment_provider not null default 'manual',
  provider_payment_id    text,                                  -- e.g. Stripe payment_intent, Wompi transaction id
  provider_charge_id     text,
  failure_reason         text,
  refunded_amount_minor  bigint not null default 0 check (refunded_amount_minor >= 0),
  metadata               jsonb not null default '{}'::jsonb,
  paid_at                timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (provider, provider_payment_id)                        -- idempotency across providers
);
```

---

## §5 RLS — `0005_rls_policies.sql`

**RLS:** policies below only scope by **`shop_id` membership**. They intentionally **do not** hide `deleted_at IS NOT NULL` rows — members can recover trashed entities; **queries for live lists default-filter** (`where deleted_at is null`). Add stricter policies later if recovery should be owner-only.

**Completeness:** replicate the **`customers_*` four-policy** pattern for `vehicles_*`, `repair_orders_*`, and `invoices_*`. For **`payments`** use `select`, `insert`, and `update` only (no delete — refunds are status changes on the row).

```sql
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

-- STABLE helper: lets the planner cache the membership lookup per query
create or replace function public.current_user_shop_ids()
returns setof uuid language sql stable security invoker
set search_path = public, pg_temp as $$
  select shop_id from public.shop_memberships where user_id = auth.uid();
$$;

-- users: self
create policy users_self_select on public.users for select to authenticated using (id = auth.uid());
create policy users_self_update on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- shops: members read; owners update; INSERT only via create_shop_for_owner RPC
create policy shops_member_select on public.shops for select to authenticated
  using (id in (select public.current_user_shop_ids()));
create policy shops_owner_update on public.shops for update to authenticated
  using (id in (select shop_id from public.shop_memberships where user_id = auth.uid() and role = 'owner'))
  with check (id in (select shop_id from public.shop_memberships where user_id = auth.uid() and role = 'owner'));

-- shop_memberships: see own + everyone in shops you own; owners manage
create policy memberships_self_select on public.shop_memberships for select to authenticated
  using (
    user_id = auth.uid()
    or shop_id in (select shop_id from public.shop_memberships where user_id = auth.uid() and role = 'owner')
  );
create policy memberships_owner_insert on public.shop_memberships for insert to authenticated
  with check (shop_id in (select shop_id from public.shop_memberships where user_id = auth.uid() and role = 'owner'));
create policy memberships_owner_update on public.shop_memberships for update to authenticated
  using (shop_id in (select shop_id from public.shop_memberships where user_id = auth.uid() and role = 'owner'));
create policy memberships_owner_delete on public.shop_memberships for delete to authenticated
  using (shop_id in (select shop_id from public.shop_memberships where user_id = auth.uid() and role = 'owner'));

-- Generic shop-scoped pattern: IDENTICAL predicates to customers_* below for vehicles, repair_orders, invoices,
-- payments (payments: omit DELETE policy).

-- Example pattern — duplicate for tables above (see prose before this block):

create policy customers_member_select on public.customers for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy customers_member_insert on public.customers for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy customers_member_update on public.customers for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
create policy customers_member_delete on public.customers for delete to authenticated
  using (shop_id in (select public.current_user_shop_ids()));

-- Duplicate the four-policy block for vehicles_, repair_orders_, invoices_, payments_,
-- renaming the prefix (`vehicles_*`, etc.). For `payments_*`, omit the DELETE policy.

create policy vehicle_ownerships_member_select on public.vehicle_ownerships for select to authenticated
  using (vehicle_id in (select id from public.vehicles where shop_id in (select public.current_user_shop_ids())));
-- ... + INSERT/UPDATE/DELETE same pattern

create policy line_items_member_select on public.line_items for select to authenticated
  using (repair_order_id in (select id from public.repair_orders where shop_id in (select public.current_user_shop_ids())));
-- ... + INSERT/UPDATE/DELETE same pattern
```

---

## §6 Triggers & Functions — `0006_triggers_functions.sql`

```sql
-- updated_at on every table
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger trg_shops_updated_at         before update on public.shops         for each row execute function public.set_updated_at();
create trigger trg_users_updated_at         before update on public.users         for each row execute function public.set_updated_at();
create trigger trg_customers_updated_at     before update on public.customers     for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated_at      before update on public.vehicles      for each row execute function public.set_updated_at();
create trigger trg_vehicle_ownerships_updated_at before update on public.vehicle_ownerships for each row execute function public.set_updated_at();
create trigger trg_repair_orders_updated_at before update on public.repair_orders for each row execute function public.set_updated_at();
create trigger trg_line_items_updated_at    before update on public.line_items    for each row execute function public.set_updated_at();
create trigger trg_invoices_updated_at      before update on public.invoices      for each row execute function public.set_updated_at();
create trigger trg_payments_updated_at      before update on public.payments      for each row execute function public.set_updated_at();

-- Mirror auth.users -> public.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (new.id, new.email,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

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
  v_user_id  uuid := auth.uid();
  v_tz       text;
  v_curr     char(3);
  v_rate     numeric;
  v_shop     public.shops;
begin
  if v_user_id is null then raise exception 'not authenticated'; end if;

  -- per-country defaults
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
              when 'CL' then 0.19 when 'US' then 0.00 end);  -- US shops set their state rate manually

  insert into public.shops (name, country_code, timezone, currency, default_tax_rate)
  values (p_name, p_country_code, v_tz, v_curr, v_rate)
  returning * into v_shop;

  insert into public.shop_memberships (user_id, shop_id, role)
  values (v_user_id, v_shop.id, 'owner');

  return v_shop;
end; $$;
revoke execute on function public.create_shop_for_owner(text,public.country_code,text,char,numeric) from public;
grant  execute on function public.create_shop_for_owner(text,public.country_code,text,char,numeric) to authenticated;

-- Snapshot currency + country + tax_rate onto RO at insert (defaults from shop).
-- NULL omits snapshotted value; explicit tax_rate including 0 is preserved (unset vs exempt).
create or replace function public.assign_repair_order_defaults()
returns trigger language plpgsql as $$
declare v_next int; v_shop public.shops%rowtype;
begin
  select * into v_shop from public.shops where id = new.shop_id;
  if new.currency is null     then new.currency     := v_shop.currency; end if;
  if new.country_code is null then new.country_code := v_shop.country_code; end if;
  if new.tax_rate is null      then new.tax_rate     := v_shop.default_tax_rate; end if;

  if new.ro_number is null or new.ro_number = 0 then
    -- Serialize per-shop numbering so concurrent inserts cannot reuse ro_number (see advisory lock pattern).
    perform pg_advisory_xact_lock(hashtext('repair_orders'::text || new.shop_id::text));
    select coalesce(max(ro_number),0)+1 into v_next
      from public.repair_orders where shop_id = new.shop_id;
    new.ro_number := v_next;
  end if;
  return new;
end; $$;
create trigger trg_repair_orders_assign_defaults
  before insert on public.repair_orders for each row execute function public.assign_repair_order_defaults();

-- Same numbering pattern for invoices (with currency/country snapshot from RO)
create or replace function public.assign_invoice_defaults()
returns trigger language plpgsql as $$
declare v_next int; v_ro public.repair_orders%rowtype;
begin
  select * into v_ro from public.repair_orders where id = new.repair_order_id;
  if new.currency is null     then new.currency     := v_ro.currency; end if;
  if new.country_code is null then new.country_code := v_ro.country_code; end if;
  -- compliance_status default per country
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

-- Recompute RO totals when line_items change (line extents in minor units via numeric math; half-to-even Postgres round())
create or replace function public.update_repair_order_totals()
returns trigger language plpgsql as $$
declare
  v_ro_id uuid; v_subtotal_minor bigint; v_taxable_minor bigint;
  v_tax_rate numeric(6,4); v_tax_minor bigint;
begin
  v_ro_id := coalesce(new.repair_order_id, old.repair_order_id);
  select tax_rate into v_tax_rate from public.repair_orders where id = v_ro_id;
  select coalesce(sum(round((qty::numeric * unit_price_minor::numeric))::bigint), 0),
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

-- PUBLIC approval RPC — SECURITY DEFINER, public-safe projection only
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
      -- omitted: internal_notes, decline_reason, customer_id, public_token
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
      'trim', v.trim, 'license_plate', v.license_plate
      -- omitted: vin, notes, customer ids
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
```

---

## §7 Indexes — `0007_indexes.sql`

```sql
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

create index invoices_shop_idx               on public.invoices (shop_id);
create index invoices_ro_idx                 on public.invoices (repair_order_id);
create index invoices_compliance_status_idx  on public.invoices (shop_id, compliance_status)
  where compliance_status in ('pending','submitted','rejected');  -- worklist for retries
create index payments_shop_idx               on public.payments (shop_id);
create index payments_invoice_idx            on public.payments (invoice_id);
create index payments_status_idx             on public.payments (shop_id, status);
```

---

## §8 Setup

```bash
# one-time
npm i -g supabase
supabase init               # creates supabase/ + config.toml
supabase start              # local Postgres + Studio at localhost:54323

# author migrations under supabase/migrations/ in the order above
supabase db reset           # nukes local DB, re-runs all migrations + seed.sql

# generate TS types into the Next.js app
supabase gen types typescript --local > client/src/types/database.ts

# push to cloud when ready
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

**Client wiring (informational):** Use `@supabase/ssr` for App Router. The public approval page uses the **anon** client so the SECURITY DEFINER RPC is the only path in. Authenticated routes use the SSR client; RLS does the rest.

**Currency display rule:** format `*_minor` with `Intl.NumberFormat(locale, { style: 'currency', currency })` using the snapshotted `currency`. This MVP assumes **whole COP / CLP “pesos” as `_minor`** (see §9.4 math); MXN / USD commonly use cents/centavos per ISO‑4217 `digits` — keep shop onboarding aligned with whichever convention you store.

---

## §9 Verification

```sql
-- 9.1 Shape
select table_name from information_schema.tables where table_schema='public' order by 1;
-- expect: customers, invoices, line_items, payments, repair_orders,
--         shop_memberships, shops, users, vehicle_ownerships, vehicles

-- 9.2 Onboarding flow — Colombia shop
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001','owner@test.co');
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001"}';
select * from public.create_shop_for_owner('Taller Bogotá', 'CO');
-- expect: currency='COP', timezone='America/Bogota', default_tax_rate=0.1900

-- 9.2b US shop defaults
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000099','owner@test.us');
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000099"}';
select * from public.create_shop_for_owner('Phoenix Auto', 'US');
-- expect: currency='USD', timezone='America/Los_Angeles', default_tax_rate=0.0000

-- 9.3 Customer + vehicle + ownership sync
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001"}';
insert into public.customers (shop_id, name, phone, tax_id, tax_id_type)
values ((select id from public.shops where country_code='CO' limit 1), 'Juana Conductora', '+57 300 1234567', '1234567890', 'CC');
insert into public.vehicles (shop_id, vin, year, make, model, license_plate)
values ((select id from public.shops where country_code='CO' limit 1), '1HGCM82633A004352', 2003, 'Honda', 'Accord', 'ABC123');
insert into public.vehicle_ownerships (vehicle_id, customer_id)
select v.id, c.id from public.vehicles v, public.customers c
 where v.shop_id = (select id from public.shops where country_code='CO' limit 1) limit 1;
select id, current_customer_id from public.vehicles;   -- populated by trigger

-- 9.4 RO + line items: country/currency/tax_rate snapshot + totals trigger
insert into public.repair_orders (shop_id, customer_id, vehicle_id, complaint, odometer_in)
select s.id, c.id, v.id, 'Ruido en frenos', 87432
from public.shops s, public.customers c, public.vehicles v
where s.country_code='CO' limit 1;
-- expect snapshot after trigger: currency='COP', country_code='CO', tax_rate=0.1900

insert into public.line_items (repair_order_id, type, description, qty, unit_price_minor, taxable) values
  ((select id from public.repair_orders limit 1),'labor','Inspección de frenos y cambio de pastillas',2.50,120000,false),
  ((select id from public.repair_orders limit 1),'part','Pastillas delanteras',1.00,75000,true);
-- COP MVP convention: `_minor` = whole pesos. Labor line 300000 (`taxable=false`); Part 75000 (`taxable=true`) → VAT base 75000.
-- expect: subtotal_minor = 375000 ; tax_minor = round(75000 * 0.19) = 14250 ; total_minor = 389250
select subtotal_minor, tax_minor, total_minor, currency, country_code from public.repair_orders;

-- 9.5 Status timestamps
update public.repair_orders set status='pending';
update public.repair_orders set status='approved';
select status, approved_at from public.repair_orders;

-- 9.6 RLS isolation (cross-shop)
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000099"}';
select count(*) from public.repair_orders;                  -- expect 0 (US owner can't see CO data)

-- 9.7 Public approval RPC payload
set local "request.jwt.claims" to '{"sub":"00000000-0000-0000-0000-000000000001"}';
select public_token from public.repair_orders limit 1;      -- copy
reset role; set local role anon;
select public.get_repair_order_by_token('<paste-public_token>');
-- expect: jsonb with currency, country_code, *_minor; NO decline_reason/internal_notes/vin/customer_id

-- 9.8 Compliance defaults
insert into public.invoices (shop_id, repair_order_id,
  subtotal_minor, tax_minor, total_minor)
select shop_id, id, subtotal_minor, tax_minor, total_minor
from public.repair_orders limit 1;
select country_code, compliance_provider, compliance_status from public.invoices;
-- expect: country_code='CO', compliance_provider='none', compliance_status='pending'
--         (US shop invoice would have compliance_status='not_required')

-- 9.9 VIN uniqueness, ownership exclusivity (unchanged from prior plan — see prior steps)
```

---

## §10 Future Hooks (deferred)

| Feature | When you need it | Plug-in point |
|---|---|---|
| **PSE provider integrations** (Alegra/Siigo/Loggro for CO; Finkok/Edicom for MX; Haulmer/Nubox for CL) | Pilot shops want fiscal invoices | Edge function: `submit_invoice_to_pse(invoice_id)`. Reads `country_code`, picks provider, posts UBL/CFDI/DTE XML, updates `compliance_*` columns. No schema change. |
| **Live payment provider integrations** (Wompi, PayU, Mercado Pago, Stripe) | Shops collect online payments | Edge functions per provider that update `payments.provider_payment_id/charge_id/status/paid_at`. Webhook routes verify + update. Idempotency via `unique(provider, provider_payment_id)`. |
| **Event-stream / audit log** | Insurance disputes, tech-perf metrics, regulatory audit | New `repair_order_events`. Backfill from existing `*_at` columns. Trigger logs new transitions. Timestamp columns remain UI fast path. |
| **Multi-currency (cross-shop reporting)** | Cross-country dashboards | Add `exchange_rates` table + reporting view that converts each RO/invoice into a chosen reporting currency. Per-shop currency stays single. |
| **Normalized tax lines** | US multi-jurisdiction (state+city+special), Avalara/TaxJar; or CO Reteica / Retefuente | New `tax_lines (repair_order_id, jurisdiction, kind, rate, amount_minor)`. Replace simple `tax_rate * taxable_subtotal` with sum over `tax_lines`. Cached `tax_minor` stays. |
| **Vehicle photos / RO attachments** | Damage docs, before/after | Polymorphic `attachments`. Supabase Storage with shop-scoped buckets. |
| **DVI inspections** | Multi-point digital inspections | `inspections` + `inspection_items`. Surfaced in approval RPC as a top-level key. |
| **Parts inventory** | Real-time stock, reorders | `parts` + `part_movements`. `line_items.part_id` becomes nullable FK; decrement on RO completion. |
| **Tech time-tracking** | Labor profitability | `labor_punches`. Sum gives actual vs. quoted. |
| **Customer portal accounts** | Customers logging in to see history | `customer_users` link + new RLS pattern. |
| **Outbound webhooks / integrations** | QuickBooks, Mailchimp, Alegra accounting sync | `webhook_endpoints` + `webhook_deliveries`; pg_net or edge function for delivery. |
| **SaaS subscription billing** | When you charge shops | Separate `subscriptions` table on `shops` with provider IDs. **Don't conflate with `payments`** — those are shops' customer payments, not your revenue. |
| **Per-shop number sequences** | Advisory locks + `max()+1` contends under very high concurrent insert rates per shop | Add per-tenant **`SEQUENCE`** or pooled IDs; preserves `ro_number` / `invoice_number` semantics (swap allocator only). |

**Migration discipline:** continue numbering (`0008_*`, …), one concern per migration, never edit a merged migration. Wrap destructive changes in `BEGIN; ... COMMIT;` with a rollback note.

---

## Critical Files To Create

- [supabase/migrations/0001_init_shops_users.sql](supabase/migrations/0001_init_shops_users.sql)
- [supabase/migrations/0002_customers_vehicles.sql](supabase/migrations/0002_customers_vehicles.sql)
- [supabase/migrations/0003_repair_orders_line_items.sql](supabase/migrations/0003_repair_orders_line_items.sql)
- [supabase/migrations/0004_invoices_payments.sql](supabase/migrations/0004_invoices_payments.sql)
- [supabase/migrations/0005_rls_policies.sql](supabase/migrations/0005_rls_policies.sql)
- [supabase/migrations/0006_triggers_functions.sql](supabase/migrations/0006_triggers_functions.sql)
- [supabase/migrations/0007_indexes.sql](supabase/migrations/0007_indexes.sql)
- [client/src/types/database.ts](client/src/types/database.ts) (generated via `supabase gen types`)