import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Run the actual migrations against PostgreSQL, with minimal Supabase auth/storage scaffolding.
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated;
  create schema auth; create schema storage;
  create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text);
  alter table storage.objects enable row level security;
  create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  create publication supabase_realtime;
`);
for (const file of ['20260910120000_auth_ownership.sql', '20260910143000_repair_missing_profiles.sql', '20260910203000_direct_raven.sql', '20260910220000_member_social.sql']) {
  await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), 'utf8'));
}
await db.exec(`grant usage on schema public,auth,storage to anon,authenticated; grant select,insert,update,delete on all tables in schema public,storage to authenticated; grant select on all tables in schema public,storage to anon;`);
const a = '00000000-0000-4000-8000-000000000001', b = '00000000-0000-4000-8000-000000000002', outsider = '00000000-0000-4000-8000-000000000003';
for (const [id, name] of [[a,'alice'],[b,'brandon'],[outsider,'outsider']]) await db.query(`insert into auth.users values($1,$2,$3)`, [id, `${name}@example.test`, JSON.stringify({ username:name })]);
async function as(id) { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub',$1,false)`,[id]); await db.exec('set role authenticated'); }
async function rejects(sql, args, pattern) { await assert.rejects(db.query(sql,args), pattern); }
await as(a);
const conversation = (await db.query(`select public.start_direct_raven('brandon') id`)).rows[0].id;
const m = (await db.query(`insert into public.direct_raven_messages(conversation_id,sender_id,body) values($1,$2,'Hello') returning id`,[conversation,a])).rows[0].id;
const path = `${conversation}/${a}/photo.png`;
await db.query(`insert into storage.objects(bucket_id,name,owner_id) values('raven-media',$1,$2)`,[path,a]);
await db.query(`insert into public.direct_raven_messages(conversation_id,sender_id,body,attachment_path,reply_to) values($1,$2,'',$3,$4)`,[conversation,a,path,m]);
await rejects(`insert into public.direct_raven_messages(conversation_id,sender_id,body,attachment_path) values($1,$2,'',$3)`,[conversation,a,`${conversation}/${b}/stolen.png`],/invalid_attachment/);
await as(b);
assert.equal((await db.query(`select * from storage.objects`)).rows.length,1);
assert.equal(Number((await db.query(`select unread from public.direct_raven_summaries()`)).rows[0].unread),2);
await db.query(`insert into public.member_likes(user_id,target_kind,target_id) values($1,'message',$2)`,[b,m]);
assert.equal(Number((await db.query(`select total from public.member_like_counts('message',array[$1])`,[m])).rows[0].total),1);
await rejects(`insert into public.member_likes(user_id,target_kind,target_id) values($1,'message',$2)`,[b,m],/duplicate key/);
await db.query(`insert into public.direct_raven_reads values($1,$2,now())`,[conversation,b]);
await as(a);
assert.equal((await db.query(`select * from public.member_likes`)).rows.length,1);
assert.equal((await db.query(`select * from public.direct_raven_reads`)).rows.length,1);
const request = (await db.query(`insert into public.member_friendships(requester_id,recipient_id) values($1,$2) returning id`,[a,b])).rows[0].id;
assert.equal((await db.query(`update public.member_friendships set accepted_at=now() where id=$1 returning id`,[request])).rows.length,0,'Requester cannot accept own request');
await as(outsider);
assert.equal((await db.query(`select * from public.direct_raven_messages`)).rows.length,0);
assert.equal((await db.query(`select * from storage.objects`)).rows.length,0);
assert.equal((await db.query(`select * from public.member_likes`)).rows.length,0,'Private reactions stay private');
assert.equal((await db.query(`select * from public.member_like_counts('message',array[$1])`,[m])).rows.length,0);
assert.equal((await db.query(`select * from public.direct_raven_summaries()`)).rows.length,0);
assert.equal((await db.query(`select * from public.direct_raven_reads`)).rows.length,0);
assert.equal((await db.query(`select * from public.member_friendships`)).rows.length,0,'Pending requests stay private');
await rejects(`insert into public.direct_raven_messages(conversation_id,sender_id,body) values($1,$2,'Intruder')`,[conversation,outsider],/row-level security/);
await rejects(`insert into public.member_likes(user_id,target_kind,target_id) values($1,'message',$2)`,[outsider,m],/row-level security/);
await as(b);
await rejects(`update public.member_friendships set requester_id=$1,accepted_at=now() where id=$2`,[outsider,request],/protected_friendship/);
await db.query(`update public.member_friendships set accepted_at=now() where id=$1`,[request]);
await db.query(`insert into public.direct_raven_blocks(blocker_id,blocked_id) values($1,$2)`,[b,a]);
await as(a);
await rejects(`insert into public.direct_raven_messages(conversation_id,sender_id,body) values($1,$2,'Blocked')`,[conversation,a],/row-level security/);
await rejects(`update public.direct_raven_messages set body='Blocked edit' where id=$1`,[m],/direct_raven_blocked/);
await db.query(`update public.direct_raven_messages set deleted_at=now() where id=$1`,[m]);
await rejects(`update public.direct_raven_messages set deleted_at=null where id=$1`,[m],/raven_already_withdrawn/);
await rejects(`insert into storage.objects(bucket_id,name,owner_id) values('raven-media',$1,$2)`,[`${conversation}/${a}/blocked.png`,a],/row-level security/);
await db.query(`update public.profiles set banner_url=$1 where id=$2`,[`https://example.test/storage/v1/object/public/avatars/${a}/banner.png`,a]);
await rejects(`update public.profiles set banner_url=$1 where id=$2`,[`https://example.test/storage/v1/object/public/avatars/${b}/banner.png`,a],/invalid_banner/);
await db.close();
console.log('Member social: migrations, private media, message ownership, read receipts, likes, friend acceptance and blocks passed.');
