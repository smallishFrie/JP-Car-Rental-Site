-- Run this script in Supabase SQL Editor.
-- It creates admin-managed car inventory and image storage policies.

create table if not exists public.cars (
  id text primary key,
  name text not null,
  category text not null default 'Sedan',
  tagline text not null,
  description text not null,
  day_rate numeric(10, 2) not null check (day_rate >= 0),
  card_image_url text not null,
  gallery_image_urls text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cars
add column if not exists category text not null default 'Sedan';

alter table public.cars
add column if not exists passenger_capacity integer
check (passenger_capacity is null or (passenger_capacity between 1 and 55));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cars_set_updated_at on public.cars;
create trigger cars_set_updated_at
before update on public.cars
for each row
execute function public.set_updated_at();

alter table public.cars enable row level security;

drop policy if exists "Public can read active cars" on public.cars;
create policy "Public can read active cars"
on public.cars
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can manage cars" on public.cars;
create policy "Admins can manage cars"
on public.cars
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Public can view car images" on storage.objects;
create policy "Public can view car images"
on storage.objects
for select
to public
using (bucket_id = 'car-images');

drop policy if exists "Admins can upload car images" on storage.objects;
create policy "Admins can upload car images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'car-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

drop policy if exists "Admins can update car images" on storage.objects;
create policy "Admins can update car images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'car-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
)
with check (
  bucket_id = 'car-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

drop policy if exists "Admins can delete car images" on storage.objects;
create policy "Admins can delete car images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'car-images'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);
