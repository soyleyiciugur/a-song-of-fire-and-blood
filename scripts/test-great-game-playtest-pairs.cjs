const fs=require('node:fs'),assert=require('node:assert/strict');
const {PGlite}=require('@electric-sql/pglite');
(async()=>{
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;create table public.profiles(id uuid primary key,username text,display_name text,avatar_url text);create publication supabase_realtime;`);
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003';
for(const [id,name] of [[a,'luck'],[b,'luck_ii'],[c,'other']]){await db.query('insert into auth.users values($1)',[id]);await db.query('insert into profiles values($1,$2,$2,null)',[id,name]);}
for(const file of ['20260915143000_great_game_online.sql','20260922203000_great_game_player_stats.sql','20261008005500_great_game_social_standing.sql','20261009160000_great_game_match_types_collection.sql','20261009200000_great_game_alpha_season.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
let seq=0;
async function match(host,guest,type='ranked',status='finished'){return (await db.query(`insert into great_game_matches(code,host_id,guest_id,match_type,status,winner_user_id,abandoned_by,completed_at) values($1,$2,$3,$4,$5,$2,$2,$6) returning id`,['T'+String(++seq).padStart(5,'0'),host,guest,type,status,new Date(Date.UTC(2026,9,10,seq)).toISOString()])).rows[0].id;}
await match(a,b);await match(b,a,'custom');const real=await match(a,c);
await db.exec(fs.readFileSync('supabase/migrations/20261011090000_great_game_playtest_pairs.sql','utf8'));
assert.equal((await db.query('select count(*)::int n from great_game_match_results')).rows[0].n,2);
assert.equal((await db.query('select rating from great_game_ratings where user_id=$1',[a])).rows[0].rating,1016);
assert.equal((await db.query('select count(*)::int n from great_game_leaderboard where user_id=$1',[b])).rows[0].n,0);
const ratings=(await db.query('select * from great_game_ratings order by user_id')).rows;
for(const [host,guest,type,status] of [[a,b,'ranked','finished'],[b,a,'ranked','abandoned'],[a,b,'custom','finished']])await match(host,guest,type,status);
assert.deepEqual((await db.query('select * from great_game_ratings order by user_id')).rows,ratings);
for(const view of ['great_game_match_history','great_game_head_to_head','great_game_deck_stats','great_game_player_stats','great_game_type_stats','great_game_ranked_stats'])assert.equal((await db.query(`select count(*)::int n from ${view} where user_id=$1`,[b])).rows[0].n,0,view);
await db.query("update profiles set username='renamed' where id=$1",[a]);await match(b,a);
assert.equal((await db.query('select count(*)::int n from great_game_match_results')).rows[0].n,2);
await match(b,c);assert.equal((await db.query('select count(*)::int n from great_game_match_results')).rows[0].n,4,'Other opponents still count');
assert.equal((await db.query('select count(*)::int n from great_game_matches')).rows[0].n,8,'Table records preserved');
await db.close();console.log('PASS historical cleanup, Elo replay, both seat orders, Ranked/Friendly, abandonment, account renaming, all shared stats and other opponents');
})().catch(e=>{console.error(e);process.exitCode=1});
