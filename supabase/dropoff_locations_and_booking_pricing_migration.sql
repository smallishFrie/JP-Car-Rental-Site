-- Run this once in Supabase SQL Editor if your schema already exists.
-- Adds admin-managed drop-off locations and booking pricing breakdown fields.

create table if not exists public.dropoff_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  extra_fee numeric(10, 2) not null default 0 check (extra_fee >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists dropoff_locations_set_updated_at on public.dropoff_locations;
create trigger dropoff_locations_set_updated_at
before update on public.dropoff_locations
for each row
execute function public.set_updated_at();

alter table public.dropoff_locations enable row level security;

drop policy if exists "Public can read dropoff locations" on public.dropoff_locations;
create policy "Public can read dropoff locations"
on public.dropoff_locations
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can manage dropoff locations" on public.dropoff_locations;
create policy "Admins can manage dropoff locations"
on public.dropoff_locations
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

insert into public.dropoff_locations (name, extra_fee)
values
  ('JP Main Office', 0),
  ('Airport Terminal', 0),
  ('City Drop Point', 0)
on conflict (name) do nothing;

alter table public.bookings
  add column if not exists base_price numeric(10, 2) not null default 0 check (base_price >= 0),
  add column if not exists dropoff_fee numeric(10, 2) not null default 0 check (dropoff_fee >= 0),
  add column if not exists dropoff_location text not null default 'JP Main Office';

update public.bookings
set
  base_price = total_price,
  dropoff_fee = 0
where base_price = 0 and dropoff_fee = 0;
