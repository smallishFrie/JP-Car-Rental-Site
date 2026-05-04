-- Run in Supabase SQL Editor after admin_cars_setup / bookings migrations.
-- 1) Hides cars from public listing until an admin confirms post-rental turnover.
-- 2) Stores optional fraud/dispute reports from customer email actions.

alter table public.cars
  add column if not exists pending_turnover boolean not null default false;

comment on column public.cars.pending_turnover is
  'When true, car is hidden from public browse until an admin confirms turnover after a completed rental.';

alter table public.bookings
  add column if not exists dispute_reported_at timestamptz;

comment on column public.bookings.dispute_reported_at is
  'Set when the customer uses the “This wasn’t me” link from email; triggers admin review.';

-- Public read: only cars that are active AND not awaiting turnover confirmation.
drop policy if exists "Public can read active cars" on public.cars;
create policy "Public can read active cars"
on public.cars
for select
to anon, authenticated
using (
  is_active = true
  and coalesce(pending_turnover, false) = false
);
