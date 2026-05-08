-- Run this script in Supabase SQL Editor.
-- It creates admin-managed car reviews tied to inventory cars.

create table if not exists public.car_reviews (
  id uuid primary key default gen_random_uuid(),
  car_id text not null references public.cars(id) on delete cascade,
  reviewer_name text not null,
  country_of_origin text not null,
  review_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists car_reviews_car_id_idx on public.car_reviews (car_id);
create index if not exists car_reviews_created_at_desc_idx on public.car_reviews (created_at desc);

alter table public.car_reviews enable row level security;

drop policy if exists "Public can read car reviews" on public.car_reviews;
create policy "Public can read car reviews"
on public.car_reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Admins can create car reviews" on public.car_reviews;
create policy "Admins can create car reviews"
on public.car_reviews
for insert
to authenticated
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

drop policy if exists "Admins can delete car reviews" on public.car_reviews;
create policy "Admins can delete car reviews"
on public.car_reviews
for delete
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);
