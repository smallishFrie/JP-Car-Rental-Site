-- Run in Supabase SQL Editor after bookings_setup.sql.
-- Adds refund tracking, admin refund amount, and optional user cancellation reason.

alter table public.bookings
  add column if not exists refund_status text not null default 'none'
    check (refund_status in ('none', 'pending', 'succeeded', 'failed', 'not_applicable')),
  add column if not exists refund_amount_php numeric(10, 2),
  add column if not exists cancellation_reason text;

comment on column public.bookings.refund_status is 'Xendit refund lifecycle: none, pending (awaiting webhook), succeeded, failed, not_applicable';
comment on column public.bookings.refund_amount_php is 'Refund amount in PHP confirmed by admin when approving cancellation';
comment on column public.bookings.cancellation_reason is 'Optional note from the customer when requesting cancellation';
