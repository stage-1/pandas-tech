create table public.property_card_scans (
  id                    uuid primary key default gen_random_uuid(),
  shop_id               uuid not null references public.shops(id),
  created_by            text not null references public.users(id),
  created_at            timestamptz not null default now(),

  image_storage_path    text,

  -- raw AI SDK output with per-field confidence scores
  ai_result             jsonb not null,

  -- flat field values after user review/edit (null until user confirms)
  confirmed_fields      jsonb,

  -- review metadata
  overall_confidence    numeric(5,2),
  fields_flagged        text[],
  fields_user_edited    text[],

  -- outcome
  vehicle_id            uuid references public.vehicles(id),
  status                text not null default 'pending'
                          check (status in ('pending', 'reviewed', 'applied', 'discarded')),

  deleted_at            timestamptz
);

create index on public.property_card_scans (shop_id, created_at desc);
create index on public.property_card_scans (vehicle_id) where vehicle_id is not null;

alter table public.property_card_scans enable row level security;

create policy property_card_scans_member_select on public.property_card_scans for select to authenticated
  using (shop_id in (select public.current_user_shop_ids()));
create policy property_card_scans_member_insert on public.property_card_scans for insert to authenticated
  with check (shop_id in (select public.current_user_shop_ids()));
create policy property_card_scans_member_update on public.property_card_scans for update to authenticated
  using (shop_id in (select public.current_user_shop_ids()))
  with check (shop_id in (select public.current_user_shop_ids()));
