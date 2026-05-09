-- Run once in Supabase SQL Editor.
-- Singleton site-wide visit tally; increments only via server (service role calling RPC).

create table if not exists public.site_visit_stats (
  id text primary key,
  visits bigint not null default 0
);

insert into public.site_visit_stats (id, visits)
values ('global', 0)
on conflict (id) do nothing;

alter table public.site_visit_stats enable row level security;

-- No policies for anon/authenticated. Service role bypasses RLS for server-side reads/increments.

create or replace function public.increment_site_visits()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v bigint;
begin
  update public.site_visit_stats
  set visits = visits + 1
  where id = 'global'
  returning visits into v;

  return coalesce(v, 1);
end;
$$;

grant execute on function public.increment_site_visits() to service_role;
