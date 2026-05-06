create type public.compliance_provider as enum (
  'none',
  'alegra','siigo','loggro',
  'finkok','edicom','facturama',
  'haulmer','nubox','openfactura'
);
create type public.compliance_status as enum (
  'not_required','pending','submitted','accepted','rejected'
);

create table public.invoices (
  id                          uuid primary key default gen_random_uuid(),
  shop_id                     uuid not null references public.shops(id) on delete cascade,
  repair_order_id             uuid not null references public.repair_orders(id) on delete restrict,
  invoice_number              int  not null,
  currency                    char(3) not null,
  country_code                public.country_code not null,
  subtotal_minor              bigint not null check (subtotal_minor >= 0),
  tax_minor                   bigint not null check (tax_minor >= 0),
  total_minor                 bigint not null check (total_minor >= 0),
  amount_paid_minor           bigint not null default 0 check (amount_paid_minor >= 0),
  pdf_storage_path            text,
  compliance_provider         public.compliance_provider not null default 'none',
  compliance_status           public.compliance_status   not null default 'not_required',
  compliance_doc_id           text,
  compliance_xml_storage_path text,
  compliance_qr_url           text,
  compliance_submitted_at     timestamptz,
  compliance_accepted_at      timestamptz,
  compliance_data             jsonb not null default '{}'::jsonb,
  generated_at                timestamptz not null default now(),
  due_at                      timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (shop_id, invoice_number),
  unique (repair_order_id)
);
comment on column public.invoices.compliance_data is
  'Country-specific fiscal extras: CO {resolution_id, prefix}; MX {usoCFDI, regimenFiscalReceptor, formaPago}; CL {tipoDTE, folio_resolucion}; US {} (empty).';

create type public.payment_provider as enum (
  'manual','stripe','wompi','payu','mercado_pago','culqi','other'
);
create type public.payment_status as enum (
  'pending','processing','succeeded','failed','refunded','partially_refunded'
);
create type public.payment_method as enum ('card','cash','check','ach','pse','transfer','other');

create table public.payments (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references public.shops(id) on delete cascade,
  invoice_id            uuid not null references public.invoices(id) on delete restrict,
  amount_minor          bigint not null check (amount_minor > 0),
  currency              char(3) not null,
  status                public.payment_status   not null default 'pending',
  method                public.payment_method   not null default 'card',
  provider              public.payment_provider not null default 'manual',
  provider_payment_id   text,
  provider_charge_id    text,
  failure_reason        text,
  refunded_amount_minor bigint not null default 0 check (refunded_amount_minor >= 0),
  metadata              jsonb not null default '{}'::jsonb,
  paid_at               timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (provider, provider_payment_id)
);
