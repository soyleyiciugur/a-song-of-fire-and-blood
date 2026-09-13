create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  mascot_mode text not null default 'balanced' check (mascot_mode in ('balanced','mara','aldren')),
  preferences jsonb not null default '{
    "tavern_answers": true,
    "tavern_favor": true,
    "ravens_eye_answers": true,
    "ravens_eye_likes": true,
    "direct_ravens": true,
    "guild_parley": true,
    "ravens_eye_images": true,
    "gutter_memes": true,
    "gutter_reels": true,
    "new_chapters": true,
    "realm_notices": true
  }'::jsonb,
  last_mascot text check (last_mascot is null or last_mascot in ('mara','aldren')),
  mascot_streak integer not null default 0 check (mascot_streak >= 0),
  mara_count integer not null default 0 check (mara_count >= 0),
  aldren_count integer not null default 0 check (aldren_count >= 0),
  last_variants jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

update public.notification_preferences set mascot_mode = 'balanced' where mascot_mode <> 'balanced';

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can read own notification preferences" on public.notification_preferences;
create policy "Users can read own notification preferences"
on public.notification_preferences for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
on public.notification_preferences for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
on public.notification_preferences for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create table if not exists public.site_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in (
    'tavern_answer','tavern_favor','ravens_eye_answer','ravens_eye_like',
    'direct_raven','guild_parley','ravens_eye_image','gutter_meme','gutter_reel',
    'new_chapter','realm_notice'
  )),
  source text not null check (source in ('tavern','ravens-eye','direct-raven','guild-parley','chronicle','realm')),
  mascot text not null check (mascot in ('mara','aldren')),
  title text not null,
  body text not null,
  href text not null default '/notifications',
  source_label text,
  context jsonb not null default '{}'::jsonb,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists site_notifications_user_created_idx
  on public.site_notifications(user_id, created_at desc);
create index if not exists site_notifications_user_unread_idx
  on public.site_notifications(user_id, created_at desc)
  where read_at is null;

alter table public.site_notifications enable row level security;

drop policy if exists "Users can read own site notifications" on public.site_notifications;
create policy "Users can read own site notifications"
on public.site_notifications for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can mark own site notifications read" on public.site_notifications;
create policy "Users can mark own site notifications read"
on public.site_notifications for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Site notifications are authored by trusted server code using the service-role key.
-- No authenticated INSERT policy is intentionally provided.
