-- Run once in Supabase SQL Editor on existing projects (after bookings exist).
--
-- 1) Adds car_display_name (backfilled from cars.name) so history still shows a vehicle label after delete.
-- 2) Makes car_id nullable and sets ON DELETE SET NULL so removing a car clears car_id on those rows.
-- 3) App logic only blocks car delete while there are pending/upcoming/active/cancel_requested bookings.
--
-- After this, re-apply supabase/create_booking_safely.sql if you use that RPC (so inserts set car_display_name).

alter table public.bookings add column if not exists car_display_name text;

update public.bookings b
set car_display_name = nullif(trim(c.name), '')
from public.cars c
where b.car_id = c.id
  and (b.car_display_name is null or trim(b.car_display_name) = '');

update public.bookings
set car_display_name = 'Unknown vehicle'
where car_display_name is null or trim(car_display_name) = '';

alter table public.bookings alter column car_display_name set not null;

alter table public.bookings alter column car_id drop not null;

alter table public.bookings drop constraint if exists bookings_car_id_fkey;

alter table public.bookings
  add constraint bookings_car_id_fkey
  foreign key (car_id) references public.cars(id) on delete set null;
