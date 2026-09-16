begin;

alter table public.site_notifications drop constraint if exists site_notifications_kind_check;
alter table public.site_notifications add constraint site_notifications_kind_check check (kind in (
  'tavern_answer','tavern_favor','ravens_eye_answer','ravens_eye_like',
  'direct_raven','guild_parley','ravens_eye_image','gutter_meme','gutter_reel',
  'new_chapter','realm_notice','guestbook_entry','guestbook_reply',
  'friend_request','friend_accept',
  'new_tavern_thread','tavern_participant_activity','ravens_eye_root_comment'
));

alter table public.site_notifications drop constraint if exists site_notifications_source_check;
alter table public.site_notifications add constraint site_notifications_source_check check (source in (
  'tavern','ravens-eye','direct-raven','guild-parley','chronicle','guestbook','profile','realm'
));

alter table public.notification_preferences alter column preferences set default '{
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
  "guestbook_entries": true,
  "guestbook_replies": true,
  "friend_requests": true,
  "friend_accepts": true,
  "new_tavern_threads": false,
  "tavern_participant_activity": false,
  "ravens_eye_root_comments": false,
  "realm_notices": true
}'::jsonb;

update public.notification_preferences
set preferences = '{"friend_requests":true,"friend_accepts":true}'::jsonb || preferences
where not (preferences ? 'friend_requests') or not (preferences ? 'friend_accepts');

notify pgrst,'reload schema';
commit;
