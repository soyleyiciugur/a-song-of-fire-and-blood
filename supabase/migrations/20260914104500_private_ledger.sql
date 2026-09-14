-- Private, account-synced ledger. RLS intentionally exposes each row only to its owner.
create table if not exists public.private_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  heading text not null default 'Untitled entry',
  matter text not null default '',
  checklist jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  status text not null default 'open' check (status in ('open','settled')),
  archived boolean not null default false,
  character_ids text[] not null default '{}'::text[],
  chapter_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_ledger_heading_length check (char_length(heading) <= 140),
  constraint private_ledger_matter_length check (char_length(matter) <= 4000)
);

create index if not exists private_ledger_entries_owner_updated_idx on public.private_ledger_entries(user_id, archived, pinned desc, updated_at desc);

alter table public.private_ledger_entries enable row level security;

revoke all on table public.private_ledger_entries from anon;
grant select, insert, update, delete on table public.private_ledger_entries to authenticated;

drop policy if exists "ledger_owner_select" on public.private_ledger_entries;
create policy "ledger_owner_select" on public.private_ledger_entries for select to authenticated using (auth.uid() = user_id);

drop policy if exists "ledger_owner_insert" on public.private_ledger_entries;
create policy "ledger_owner_insert" on public.private_ledger_entries for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "ledger_owner_update" on public.private_ledger_entries;
create policy "ledger_owner_update" on public.private_ledger_entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ledger_owner_delete" on public.private_ledger_entries;
create policy "ledger_owner_delete" on public.private_ledger_entries for delete to authenticated using (auth.uid() = user_id);
