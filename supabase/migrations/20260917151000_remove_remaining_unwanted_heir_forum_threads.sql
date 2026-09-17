begin;

-- Follow-up cleanup for two generated heir discussions that remained after
-- the first Chapter XVIII forum cleanup had already been deployed.
with retired(thread_id) as (
  values
    ('community-jace-heir-celebration-delay'),
    ('meta-heir-pressure-cooker')
), targets as (
  select crt.target_kind, crt.target_id
  from public.community_reaction_targets crt
  join retired r on r.thread_id = crt.thread_id
)
delete from public.member_likes ml
using targets t
where ml.target_kind = t.target_kind
  and ml.target_id = t.target_id;

with retired(thread_id) as (
  values
    ('community-jace-heir-celebration-delay'),
    ('meta-heir-pressure-cooker')
)
delete from public.community_reaction_targets crt
using retired r
where crt.thread_id = r.thread_id
   or (crt.target_kind = 'thread' and crt.target_id = r.thread_id);

with retired(thread_id) as (
  values
    ('community-jace-heir-celebration-delay'),
    ('meta-heir-pressure-cooker')
)
delete from public.forum_posts fp
using retired r
where fp.thread_id = r.thread_id;

commit;
