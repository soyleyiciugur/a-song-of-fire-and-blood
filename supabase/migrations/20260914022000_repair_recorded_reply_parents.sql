-- Repair historical replies only where the notification ledger recorded an explicit
-- commentId -> parentId relationship. No heuristic guessing is used.
update public.forum_posts as post
set parent_id = notification.context ->> 'parentId'
from public.site_notifications as notification
where notification.kind = 'tavern_answer'
  and post.parent_id is null
  and post.id::text = notification.context ->> 'commentId'
  and nullif(notification.context ->> 'parentId', '') is not null
  and exists (
    select 1 from public.forum_posts parent
    where parent.id::text = notification.context ->> 'parentId'
      and parent.thread_id = post.thread_id
  );

update public.raven_comments as comment
set parent_id = notification.context ->> 'parentId'
from public.site_notifications as notification
where notification.kind = 'ravens_eye_answer'
  and comment.parent_id is null
  and comment.id::text = notification.context ->> 'commentId'
  and nullif(notification.context ->> 'parentId', '') is not null
  and exists (
    select 1 from public.raven_comments parent
    where parent.id::text = notification.context ->> 'parentId'
      and parent.entry_id = comment.entry_id
  );
