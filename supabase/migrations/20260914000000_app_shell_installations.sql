create table public.app_shell_installations (
  user_id uuid not null references auth.users(id) on delete cascade,
  installation_id uuid not null,
  acknowledged_version integer not null check (acknowledged_version >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, installation_id)
);
alter table public.app_shell_installations enable row level security;
create policy "Read own shell installations" on public.app_shell_installations
  for select to authenticated using (auth.uid() = user_id);
-- Writes go through the authenticated release endpoint; version is server-validated.
create function public.pending_shell_recipients(required_version integer)
returns table (user_id uuid) language sql security definer set search_path = public as $$
  select distinct i.user_id from app_shell_installations i
  where i.acknowledged_version < required_version
  and not exists (select 1 from site_notifications n where n.dedupe_key = 'shell:' || required_version || ':' || i.user_id)
  and not exists (select 1 from notification_preferences p where p.user_id = i.user_id and p.preferences->>'realm_notices' = 'false')
  limit 50;
$$;
revoke all on function public.pending_shell_recipients(integer) from public, anon, authenticated;
grant execute on function public.pending_shell_recipients(integer) to service_role;
