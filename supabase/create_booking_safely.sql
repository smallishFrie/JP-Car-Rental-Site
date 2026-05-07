-- This function ensures atomic booking creation with availability check.
-- Run this in your Supabase SQL Editor.

create or replace function public.create_booking_safely(
  p_car_id text,
  p_user_id uuid,
  p_start_date date,
  p_end_date date,
  p_total_price numeric,
  p_base_price numeric,
  p_dropoff_fee numeric,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_pickup_location text,
  p_dropoff_location text,
  p_driver_license_number text,
  p_driver_notes text,
  p_payment_provider text default 'xendit',
  p_payment_status text default 'unpaid'
)
returns public.bookings
language plpgsql
security definer
as $$
declare
  v_booking public.bookings;
begin
  -- Perform overlap check within the transaction
  -- We use the existing has_booking_overlap function
  if public.has_booking_overlap(p_car_id, p_start_date, p_end_date) then
    raise exception 'The selected dates are no longer available for this car.';
  end if;

  insert into public.bookings (
    user_id, 
    car_id, 
    car_display_name,
    start_date, 
    end_date, 
    total_price, 
    base_price,
    dropoff_fee,
    status,
    customer_name, 
    customer_phone, 
    customer_email, 
    pickup_location,
    dropoff_location,
    driver_license_number, 
    driver_notes, 
    payment_provider, 
    payment_status
  )
  values (
    p_user_id, 
    p_car_id, 
    coalesce((select c.name from public.cars c where c.id = p_car_id limit 1), ''),
    p_start_date, 
    p_end_date, 
    p_total_price, 
    p_base_price,
    p_dropoff_fee,
    'pending',
    p_customer_name, 
    p_customer_phone, 
    p_customer_email, 
    p_pickup_location,
    p_dropoff_location,
    p_driver_license_number, 
    p_driver_notes, 
    p_payment_provider, 
    p_payment_status
  )
  returning * into v_booking;

  return v_booking;
end;
$$;
