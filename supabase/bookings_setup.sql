-- Run this script in Supabase SQL Editor after admin_cars_setup.sql.
-- It creates bookings, availability helpers, and RLS policies.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  car_id text references public.cars(id) on delete set null,
  car_display_name text not null default '',
  start_date date not null,
  end_date date not null,
  total_price numeric(10, 2) not null check (total_price >= 0),
  base_price numeric(10, 2) not null default 0 check (base_price >= 0),
  dropoff_fee numeric(10, 2) not null default 0 check (dropoff_fee >= 0),
  status text not null check (status in ('pending', 'upcoming', 'active', 'completed', 'cancel_requested', 'canceled')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  pickup_location text not null,
  dropoff_location text not null,
  driver_license_number text,
  driver_notes text,
  payment_provider text not null default 'xendit',
  payment_reference text,
  payment_status text not null default 'unpaid',
  payment_metadata jsonb not null default '{}'::jsonb,
  canceled_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_date_range_check check (end_date >= start_date)
);

create index if not exists bookings_car_date_idx
  on public.bookings (car_id, start_date, end_date);

create index if not exists bookings_user_created_idx
  on public.bookings (user_id, created_at desc);

create unique index if not exists bookings_payment_reference_unique_idx
  on public.bookings (payment_reference)
  where payment_reference is not null;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

create or replace function public.has_booking_overlap(
  p_car_id text,
  p_start_date date,
  p_end_date date,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.bookings b
    where b.car_id = p_car_id
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and b.status in ('pending', 'upcoming', 'active', 'cancel_requested')
      and daterange(b.start_date, b.end_date + 1, '[)') && daterange(p_start_date, p_end_date + 1, '[)')
  );
$$;

alter table public.bookings enable row level security;

drop policy if exists "Users can read own bookings" on public.bookings;
create policy "Users can read own bookings"
on public.bookings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own bookings" on public.bookings;
create policy "Users can create own bookings"
on public.bookings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage bookings" on public.bookings;
create policy "Admins can manage bookings"
on public.bookings
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings"
on public.bookings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
