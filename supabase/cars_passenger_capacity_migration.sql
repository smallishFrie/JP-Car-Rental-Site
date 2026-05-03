-- Run once in Supabase SQL Editor if `cars` already exists without passenger_capacity.
alter table public.cars
add column if not exists passenger_capacity integer
check (passenger_capacity is null or (passenger_capacity between 1 and 55));
