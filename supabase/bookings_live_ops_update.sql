-- Run this after bookings_setup.sql if your bookings table already exists.

alter table public.bookings
  drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'upcoming', 'active', 'completed', 'cancel_requested', 'canceled'));

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
