-- Run in Supabase SQL Editor if you already applied bookings_setup.sql without this policy.
-- Authenticated users need UPDATE on their own rows for cancel / cancel-request flows.

drop policy if exists "Users can update own bookings" on public.bookings;
create policy "Users can update own bookings"
on public.bookings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
