-- Run this once in Supabase SQL Editor.
-- Admin-managed contact channels for the public site (email, WhatsApp, social, etc.).

-- Requires public.set_updated_at() from admin_cars_setup.sql (or define it first).

create table if not exists public.contact_options (
  id uuid primary key default gen_random_uuid(),
  contact_type text not null
    check (
      contact_type in (
        'email',
        'phone',
        'whatsapp',
        'sms',
        'website',
        'facebook',
        'instagram',
        'telegram',
        'other'
      )
    ),
  label text,
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists contact_options_set_updated_at on public.contact_options;
create trigger contact_options_set_updated_at
before update on public.contact_options
for each row
execute function public.set_updated_at();

alter table public.contact_options enable row level security;

drop policy if exists "Public can read active contact options or admins see all" on public.contact_options;
create policy "Public can read active contact options or admins see all"
on public.contact_options
for select
to anon, authenticated
using (
  is_active = true
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

drop policy if exists "Admins can manage contact options" on public.contact_options;
create policy "Admins can manage contact options"
on public.contact_options
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
)
with check (
  coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() ->> 'role') = 'admin'
);

-- Optional starter rows (comment out if you prefer an empty list):
-- insert into public.contact_options (contact_type, label, value, sort_order)
-- values
--   ('email', 'Bookings', 'bookings@example.com', 0),
--   ('whatsapp', null, '+639171234567', 1);
