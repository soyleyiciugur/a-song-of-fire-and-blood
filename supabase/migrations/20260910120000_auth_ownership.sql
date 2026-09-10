begin;

create type public.user_role as enum ('member', 'moderator', 'admin');
create type public.content_author_type as enum ('user', 'character', 'legacy');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  avatar_url text,
  role public.user_role not null default 'member',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username = lower(username) and username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 60),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 500)
);
create unique index profiles_username_ci_unique on public.profiles (lower(username));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
declare normalized_username text;
begin
  normalized_username := lower(trim(new.raw_user_meta_data ->> 'username'));
  if normalized_username is null or normalized_username !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then raise exception 'invalid_username'; end if;
  insert into public.profiles (id, username, display_name)
  values (new.id, normalized_username, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), normalized_username), 60));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();

create table public.forum_threads (
 id uuid primary key default gen_random_uuid(), title text not null check (char_length(title) between 3 and 140), body text not null check (char_length(body) between 1 and 10000),
 category text not null default 'Community', chapter_slug text, spoiler_through text,
 author_type public.content_author_type not null default 'user', user_author_id uuid references public.profiles(id) on delete set null, character_id text, legacy_author_id text,
 is_locked boolean not null default false, is_pinned boolean not null default false, is_visible boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint forum_threads_author_valid check ((author_type='user' and user_author_id is not null and character_id is null and legacy_author_id is null) or (author_type='character' and user_author_id is null and character_id is not null and legacy_author_id is null) or (author_type='legacy' and user_author_id is null and character_id is null and legacy_author_id is not null))
);
create table public.forum_posts (
 id uuid primary key default gen_random_uuid(), thread_id text not null, parent_id text,
 body text not null check (char_length(body) between 1 and 10000), author_type public.content_author_type not null default 'user', user_author_id uuid references public.profiles(id) on delete set null, character_id text, legacy_author_id text,
 is_visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint forum_posts_author_valid check ((author_type='user' and user_author_id is not null and character_id is null and legacy_author_id is null) or (author_type='character' and user_author_id is null and character_id is not null and legacy_author_id is null) or (author_type='legacy' and user_author_id is null and character_id is null and legacy_author_id is not null))
);
create table public.raven_comments (
 id uuid primary key default gen_random_uuid(), entry_id text not null, parent_id text,
 body text not null check (char_length(body) between 1 and 4000), author_type public.content_author_type not null default 'user', user_author_id uuid references public.profiles(id) on delete set null, character_id text, legacy_author_id text,
 is_visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint raven_comments_author_valid check ((author_type='user' and user_author_id is not null and character_id is null and legacy_author_id is null) or (author_type='character' and user_author_id is null and character_id is not null and legacy_author_id is null) or (author_type='legacy' and user_author_id is null and character_id is null and legacy_author_id is not null))
);
create trigger forum_threads_updated before update on public.forum_threads for each row execute function public.touch_updated_at();
create trigger forum_posts_updated before update on public.forum_posts for each row execute function public.touch_updated_at();
create trigger raven_comments_updated before update on public.raven_comments for each row execute function public.touch_updated_at();
create index forum_threads_created_idx on public.forum_threads(created_at desc);
create index forum_posts_thread_idx on public.forum_posts(thread_id, created_at);
create index raven_comments_entry_idx on public.raven_comments(entry_id, created_at);

alter table public.profiles enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.raven_comments enable row level security;
create or replace function public.can_moderate() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('moderator','admin')); $$;
revoke all on function public.can_moderate() from public; grant execute on function public.can_moderate() to anon, authenticated;
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (id=auth.uid()) with check (id=auth.uid());
create policy forum_threads_read on public.forum_threads for select using (is_visible or public.can_moderate());
create policy forum_threads_insert_member on public.forum_threads for insert to authenticated with check (author_type='user' and user_author_id=auth.uid() and character_id is null and legacy_author_id is null and not is_locked and not is_pinned and is_visible);
create policy forum_threads_update_owner on public.forum_threads for update to authenticated using (user_author_id=auth.uid() or public.can_moderate()) with check ((author_type='user' and user_author_id=auth.uid()) or public.can_moderate());
create policy forum_threads_delete_owner on public.forum_threads for delete to authenticated using (user_author_id=auth.uid() or public.can_moderate());
create policy forum_posts_read on public.forum_posts for select using (is_visible or public.can_moderate());
create policy forum_posts_insert_member on public.forum_posts for insert to authenticated with check (author_type='user' and user_author_id=auth.uid() and character_id is null and legacy_author_id is null and is_visible);
create policy forum_posts_update_owner on public.forum_posts for update to authenticated using (user_author_id=auth.uid() or public.can_moderate()) with check ((author_type='user' and user_author_id=auth.uid()) or public.can_moderate());
create policy forum_posts_delete_owner on public.forum_posts for delete to authenticated using (user_author_id=auth.uid() or public.can_moderate());
create policy raven_comments_read on public.raven_comments for select using (is_visible or public.can_moderate());
create policy raven_comments_insert_member on public.raven_comments for insert to authenticated with check (author_type='user' and user_author_id=auth.uid() and character_id is null and legacy_author_id is null and is_visible);
create policy raven_comments_update_owner on public.raven_comments for update to authenticated using (user_author_id=auth.uid() or public.can_moderate()) with check ((author_type='user' and user_author_id=auth.uid()) or public.can_moderate());
create policy raven_comments_delete_owner on public.raven_comments for delete to authenticated using (user_author_id=auth.uid() or public.can_moderate());

create or replace function public.protect_content_fields() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.author_type <> old.author_type or new.user_author_id is distinct from old.user_author_id or new.character_id is distinct from old.character_id or new.legacy_author_id is distinct from old.legacy_author_id then raise exception 'protected_author_fields'; end if;
 if tg_table_name='forum_threads' and not public.can_moderate() and (new.is_locked <> old.is_locked or new.is_pinned <> old.is_pinned or new.is_visible <> old.is_visible) then raise exception 'moderator_only_fields'; end if;
 if tg_table_name<>'forum_threads' and not public.can_moderate() and new.is_visible <> old.is_visible then raise exception 'moderator_only_fields'; end if;
 return new;
end; $$;
create trigger protect_forum_thread_fields before update on public.forum_threads for each row execute function public.protect_content_fields();
create trigger protect_forum_post_fields before update on public.forum_posts for each row execute function public.protect_content_fields();
create trigger protect_raven_comment_fields before update on public.raven_comments for each row execute function public.protect_content_fields();
create or replace function public.delete_thread_posts() returns trigger language plpgsql security definer set search_path='' as $$ begin delete from public.forum_posts where thread_id=old.id::text; return old; end; $$;
create trigger delete_forum_thread_posts after delete on public.forum_threads for each row execute function public.delete_thread_posts();

-- Role and username are immutable through the public API. A trusted migration/admin SQL workflow may change them.
create or replace function public.protect_profile_fields() returns trigger language plpgsql set search_path='' as $$ begin
 if new.id <> old.id or new.username <> old.username or new.role <> old.role then raise exception 'protected_profile_field'; end if;
 if new.avatar_url is distinct from old.avatar_url and new.avatar_url is not null and position('/avatars/' || new.id::text || '/' in new.avatar_url)=0 then raise exception 'invalid_avatar_path'; end if;
 return new;
end; $$;
create trigger protect_profile_fields before update on public.profiles for each row execute function public.protect_profile_fields();

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('avatars','avatars',true,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy avatar_read on storage.objects for select using (bucket_id='avatars');
create policy avatar_insert_own on storage.objects for insert to authenticated with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_update_own on storage.objects for update to authenticated using (bucket_id='avatars' and owner_id=auth.uid()::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy avatar_delete_own on storage.objects for delete to authenticated using (bucket_id='avatars' and owner_id=auth.uid()::text);

commit;
