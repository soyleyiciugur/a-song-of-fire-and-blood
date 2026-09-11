begin;

-- Trusted repository-backed Taverns targets. This makes static/NPC posts valid
-- Favor targets without weakening member_likes RLS for arbitrary ids.
create table if not exists public.community_reaction_targets (
  target_kind text not null check (target_kind in ('thread','post')),
  target_id text not null check (char_length(target_id) between 1 and 160),
  href text not null,
  thread_id text,
  thread_title text,
  primary key (target_kind, target_id)
);
alter table public.community_reaction_targets add column if not exists thread_id text;
alter table public.community_reaction_targets add column if not exists thread_title text;
alter table public.community_reaction_targets enable row level security;
drop policy if exists community_reaction_targets_read on public.community_reaction_targets;
create policy community_reaction_targets_read on public.community_reaction_targets for select using (true);

insert into public.community_reaction_targets (target_kind,target_id,href,thread_id,thread_title)
values
  ('thread','chapter-the-poison-beneath-the-crown','/forum?thread=chapter-the-poison-beneath-the-crown','chapter-the-poison-beneath-the-crown',null),
  ('thread','chapter-the-price-of-trust','/forum?thread=chapter-the-price-of-trust','chapter-the-price-of-trust',null),
  ('thread','chapter-the-weight-of-loyalty','/forum?thread=chapter-the-weight-of-loyalty','chapter-the-weight-of-loyalty',null),
  ('thread','chapter-the-broken-knight','/forum?thread=chapter-the-broken-knight','chapter-the-broken-knight',null),
  ('thread','chapter-fathers-and-their-sins','/forum?thread=chapter-fathers-and-their-sins','chapter-fathers-and-their-sins',null),
  ('thread','chapter-a-crown-of-thorns','/forum?thread=chapter-a-crown-of-thorns','chapter-a-crown-of-thorns',null),
  ('thread','chapter-the-climb-and-the-kneel','/forum?thread=chapter-the-climb-and-the-kneel','chapter-the-climb-and-the-kneel',null),
  ('thread','chapter-the-viper-in-silk','/forum?thread=chapter-the-viper-in-silk','chapter-the-viper-in-silk',null),
  ('thread','chapter-the-brothers-tilt','/forum?thread=chapter-the-brothers-tilt','chapter-the-brothers-tilt',null),
  ('thread','chapter-fireflies','/forum?thread=chapter-fireflies','chapter-fireflies',null),
  ('thread','chapter-the-manders-pact','/forum?thread=chapter-the-manders-pact','chapter-the-manders-pact',null),
  ('thread','chapter-the-trial','/forum?thread=chapter-the-trial','chapter-the-trial',null),
  ('thread','chapter-the-broken-oak','/forum?thread=chapter-the-broken-oak','chapter-the-broken-oak',null),
  ('thread','chapter-the-reunion','/forum?thread=chapter-the-reunion','chapter-the-reunion',null),
  ('thread','chapter-the-glass-flower','/forum?thread=chapter-the-glass-flower','chapter-the-glass-flower',null),
  ('thread','chapter-the-mummers-blood','/forum?thread=chapter-the-mummers-blood','chapter-the-mummers-blood',null),
  ('thread','theory-ghost-dragon','/forum?thread=theory-ghost-dragon','theory-ghost-dragon','Ghost dragon theories: camouflage is not invisibility'),
  ('thread','meta-quiet-chapters','/forum?thread=meta-quiet-chapters','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('thread','community-crackship-desk','/forum?thread=community-crackship-desk','community-crackship-desk','The extremely unofficial impossible-pairing desk'),
  ('thread','community-council-break-room','/forum?thread=community-council-break-room','community-council-break-room','Which council meeting should have been a raven?'),
  ('thread','community-reading-snacks','/forum?thread=community-reading-snacks','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('thread','meta-edit-first-impressions','/forum?thread=meta-edit-first-impressions','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('thread','community-modern-day-jobs','/forum?thread=community-modern-day-jobs','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('thread','community-retracted-takes','/forum?thread=community-retracted-takes','community-retracted-takes','A take you have actually changed your mind about'),
  ('thread','community-new-reader-desk','/forum?thread=community-new-reader-desk','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('thread','community-great-game-table','/forum?thread=community-great-game-table','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('thread','community-dragon-ranking-fatigue','/forum?thread=community-dragon-ranking-fatigue','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('thread','meta-one-ordinary-afternoon','/forum?thread=meta-one-ordinary-afternoon','meta-one-ordinary-afternoon','One ordinary afternoon from a side character: who gets the page?'),
  ('post','chapter-the-poison-beneath-the-crown-comment-1','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-1','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-poison-beneath-the-crown-comment-2','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-2','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-poison-beneath-the-crown-comment-3','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-3','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-poison-beneath-the-crown-comment-4','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-4','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-poison-beneath-the-crown-comment-5','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-5','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-poison-beneath-the-crown-comment-6','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-6','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-poison-beneath-the-crown-comment-7','/forum?thread=chapter-the-poison-beneath-the-crown&comment=chapter-the-poison-beneath-the-crown-comment-7','chapter-the-poison-beneath-the-crown',null),
  ('post','chapter-the-price-of-trust-comment-1','/forum?thread=chapter-the-price-of-trust&comment=chapter-the-price-of-trust-comment-1','chapter-the-price-of-trust',null),
  ('post','chapter-the-price-of-trust-comment-2','/forum?thread=chapter-the-price-of-trust&comment=chapter-the-price-of-trust-comment-2','chapter-the-price-of-trust',null),
  ('post','chapter-the-price-of-trust-comment-3','/forum?thread=chapter-the-price-of-trust&comment=chapter-the-price-of-trust-comment-3','chapter-the-price-of-trust',null),
  ('post','chapter-the-price-of-trust-comment-4','/forum?thread=chapter-the-price-of-trust&comment=chapter-the-price-of-trust-comment-4','chapter-the-price-of-trust',null),
  ('post','chapter-the-price-of-trust-comment-5','/forum?thread=chapter-the-price-of-trust&comment=chapter-the-price-of-trust-comment-5','chapter-the-price-of-trust',null),
  ('post','chapter-the-price-of-trust-comment-6','/forum?thread=chapter-the-price-of-trust&comment=chapter-the-price-of-trust-comment-6','chapter-the-price-of-trust',null),
  ('post','chapter-the-weight-of-loyalty-comment-1','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-1','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-2','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-2','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-3','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-3','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-4','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-4','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-5','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-5','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-6','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-6','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-7','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-7','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-8','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-8','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-9','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-9','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-10','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-10','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-11','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-11','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-weight-of-loyalty-comment-12','/forum?thread=chapter-the-weight-of-loyalty&comment=chapter-the-weight-of-loyalty-comment-12','chapter-the-weight-of-loyalty',null),
  ('post','chapter-the-broken-knight-comment-1','/forum?thread=chapter-the-broken-knight&comment=chapter-the-broken-knight-comment-1','chapter-the-broken-knight',null),
  ('post','chapter-the-broken-knight-comment-2','/forum?thread=chapter-the-broken-knight&comment=chapter-the-broken-knight-comment-2','chapter-the-broken-knight',null),
  ('post','chapter-the-broken-knight-comment-3','/forum?thread=chapter-the-broken-knight&comment=chapter-the-broken-knight-comment-3','chapter-the-broken-knight',null),
  ('post','chapter-the-broken-knight-comment-4','/forum?thread=chapter-the-broken-knight&comment=chapter-the-broken-knight-comment-4','chapter-the-broken-knight',null),
  ('post','chapter-the-broken-knight-comment-5','/forum?thread=chapter-the-broken-knight&comment=chapter-the-broken-knight-comment-5','chapter-the-broken-knight',null),
  ('post','chapter-the-broken-knight-comment-6','/forum?thread=chapter-the-broken-knight&comment=chapter-the-broken-knight-comment-6','chapter-the-broken-knight',null),
  ('post','chapter-fathers-and-their-sins-comment-1','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-1','chapter-fathers-and-their-sins',null),
  ('post','chapter-fathers-and-their-sins-comment-2','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-2','chapter-fathers-and-their-sins',null),
  ('post','chapter-fathers-and-their-sins-comment-3','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-3','chapter-fathers-and-their-sins',null),
  ('post','chapter-fathers-and-their-sins-comment-4','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-4','chapter-fathers-and-their-sins',null),
  ('post','chapter-fathers-and-their-sins-comment-5','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-5','chapter-fathers-and-their-sins',null),
  ('post','chapter-fathers-and-their-sins-comment-6','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-6','chapter-fathers-and-their-sins',null),
  ('post','chapter-fathers-and-their-sins-comment-7','/forum?thread=chapter-fathers-and-their-sins&comment=chapter-fathers-and-their-sins-comment-7','chapter-fathers-and-their-sins',null),
  ('post','chapter-a-crown-of-thorns-comment-1','/forum?thread=chapter-a-crown-of-thorns&comment=chapter-a-crown-of-thorns-comment-1','chapter-a-crown-of-thorns',null),
  ('post','chapter-a-crown-of-thorns-comment-2','/forum?thread=chapter-a-crown-of-thorns&comment=chapter-a-crown-of-thorns-comment-2','chapter-a-crown-of-thorns',null),
  ('post','chapter-a-crown-of-thorns-comment-3','/forum?thread=chapter-a-crown-of-thorns&comment=chapter-a-crown-of-thorns-comment-3','chapter-a-crown-of-thorns',null),
  ('post','chapter-a-crown-of-thorns-comment-4','/forum?thread=chapter-a-crown-of-thorns&comment=chapter-a-crown-of-thorns-comment-4','chapter-a-crown-of-thorns',null),
  ('post','chapter-a-crown-of-thorns-comment-5','/forum?thread=chapter-a-crown-of-thorns&comment=chapter-a-crown-of-thorns-comment-5','chapter-a-crown-of-thorns',null),
  ('post','chapter-a-crown-of-thorns-comment-6','/forum?thread=chapter-a-crown-of-thorns&comment=chapter-a-crown-of-thorns-comment-6','chapter-a-crown-of-thorns',null),
  ('post','chapter-the-climb-and-the-kneel-comment-1','/forum?thread=chapter-the-climb-and-the-kneel&comment=chapter-the-climb-and-the-kneel-comment-1','chapter-the-climb-and-the-kneel',null),
  ('post','chapter-the-climb-and-the-kneel-comment-2','/forum?thread=chapter-the-climb-and-the-kneel&comment=chapter-the-climb-and-the-kneel-comment-2','chapter-the-climb-and-the-kneel',null),
  ('post','chapter-the-climb-and-the-kneel-comment-3','/forum?thread=chapter-the-climb-and-the-kneel&comment=chapter-the-climb-and-the-kneel-comment-3','chapter-the-climb-and-the-kneel',null),
  ('post','chapter-the-climb-and-the-kneel-comment-4','/forum?thread=chapter-the-climb-and-the-kneel&comment=chapter-the-climb-and-the-kneel-comment-4','chapter-the-climb-and-the-kneel',null),
  ('post','chapter-the-climb-and-the-kneel-comment-5','/forum?thread=chapter-the-climb-and-the-kneel&comment=chapter-the-climb-and-the-kneel-comment-5','chapter-the-climb-and-the-kneel',null),
  ('post','chapter-the-climb-and-the-kneel-comment-6','/forum?thread=chapter-the-climb-and-the-kneel&comment=chapter-the-climb-and-the-kneel-comment-6','chapter-the-climb-and-the-kneel',null),
  ('post','chapter-the-viper-in-silk-comment-1','/forum?thread=chapter-the-viper-in-silk&comment=chapter-the-viper-in-silk-comment-1','chapter-the-viper-in-silk',null),
  ('post','chapter-the-viper-in-silk-comment-2','/forum?thread=chapter-the-viper-in-silk&comment=chapter-the-viper-in-silk-comment-2','chapter-the-viper-in-silk',null),
  ('post','chapter-the-viper-in-silk-comment-3','/forum?thread=chapter-the-viper-in-silk&comment=chapter-the-viper-in-silk-comment-3','chapter-the-viper-in-silk',null),
  ('post','chapter-the-viper-in-silk-comment-4','/forum?thread=chapter-the-viper-in-silk&comment=chapter-the-viper-in-silk-comment-4','chapter-the-viper-in-silk',null),
  ('post','chapter-the-viper-in-silk-comment-5','/forum?thread=chapter-the-viper-in-silk&comment=chapter-the-viper-in-silk-comment-5','chapter-the-viper-in-silk',null),
  ('post','chapter-the-viper-in-silk-comment-6','/forum?thread=chapter-the-viper-in-silk&comment=chapter-the-viper-in-silk-comment-6','chapter-the-viper-in-silk',null),
  ('post','chapter-the-brothers-tilt-comment-1','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-1','chapter-the-brothers-tilt',null),
  ('post','chapter-the-brothers-tilt-comment-2','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-2','chapter-the-brothers-tilt',null),
  ('post','chapter-the-brothers-tilt-comment-3','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-3','chapter-the-brothers-tilt',null),
  ('post','chapter-the-brothers-tilt-comment-4','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-4','chapter-the-brothers-tilt',null),
  ('post','chapter-the-brothers-tilt-comment-5','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-5','chapter-the-brothers-tilt',null),
  ('post','chapter-the-brothers-tilt-comment-6','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-6','chapter-the-brothers-tilt',null),
  ('post','chapter-the-brothers-tilt-comment-7','/forum?thread=chapter-the-brothers-tilt&comment=chapter-the-brothers-tilt-comment-7','chapter-the-brothers-tilt',null),
  ('post','chapter-fireflies-comment-1','/forum?thread=chapter-fireflies&comment=chapter-fireflies-comment-1','chapter-fireflies',null),
  ('post','chapter-fireflies-comment-2','/forum?thread=chapter-fireflies&comment=chapter-fireflies-comment-2','chapter-fireflies',null),
  ('post','chapter-fireflies-comment-3','/forum?thread=chapter-fireflies&comment=chapter-fireflies-comment-3','chapter-fireflies',null),
  ('post','chapter-fireflies-comment-4','/forum?thread=chapter-fireflies&comment=chapter-fireflies-comment-4','chapter-fireflies',null),
  ('post','chapter-fireflies-comment-5','/forum?thread=chapter-fireflies&comment=chapter-fireflies-comment-5','chapter-fireflies',null),
  ('post','chapter-fireflies-comment-6','/forum?thread=chapter-fireflies&comment=chapter-fireflies-comment-6','chapter-fireflies',null),
  ('post','chapter-the-manders-pact-comment-1','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-1','chapter-the-manders-pact',null),
  ('post','chapter-the-manders-pact-comment-2','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-2','chapter-the-manders-pact',null),
  ('post','chapter-the-manders-pact-comment-3','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-3','chapter-the-manders-pact',null),
  ('post','chapter-the-manders-pact-comment-4','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-4','chapter-the-manders-pact',null),
  ('post','chapter-the-manders-pact-comment-5','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-5','chapter-the-manders-pact',null),
  ('post','chapter-the-manders-pact-comment-6','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-6','chapter-the-manders-pact',null),
  ('post','chapter-the-manders-pact-comment-7','/forum?thread=chapter-the-manders-pact&comment=chapter-the-manders-pact-comment-7','chapter-the-manders-pact',null),
  ('post','chapter-the-trial-comment-1','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-1','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-2','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-2','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-3','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-3','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-4','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-4','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-5','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-5','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-6','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-6','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-7','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-7','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-8','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-8','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-9','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-9','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-10','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-10','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-11','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-11','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-12','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-12','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-13','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-13','chapter-the-trial',null),
  ('post','chapter-the-trial-comment-14','/forum?thread=chapter-the-trial&comment=chapter-the-trial-comment-14','chapter-the-trial',null),
  ('post','chapter-the-broken-oak-comment-1','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-1','chapter-the-broken-oak',null),
  ('post','chapter-the-broken-oak-comment-2','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-2','chapter-the-broken-oak',null),
  ('post','chapter-the-broken-oak-comment-3','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-3','chapter-the-broken-oak',null),
  ('post','chapter-the-broken-oak-comment-4','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-4','chapter-the-broken-oak',null),
  ('post','chapter-the-broken-oak-comment-5','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-5','chapter-the-broken-oak',null),
  ('post','chapter-the-broken-oak-comment-6','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-6','chapter-the-broken-oak',null),
  ('post','chapter-the-broken-oak-comment-7','/forum?thread=chapter-the-broken-oak&comment=chapter-the-broken-oak-comment-7','chapter-the-broken-oak',null),
  ('post','chapter-the-reunion-comment-1','/forum?thread=chapter-the-reunion&comment=chapter-the-reunion-comment-1','chapter-the-reunion',null),
  ('post','chapter-the-reunion-comment-2','/forum?thread=chapter-the-reunion&comment=chapter-the-reunion-comment-2','chapter-the-reunion',null),
  ('post','chapter-the-reunion-comment-3','/forum?thread=chapter-the-reunion&comment=chapter-the-reunion-comment-3','chapter-the-reunion',null),
  ('post','chapter-the-reunion-comment-4','/forum?thread=chapter-the-reunion&comment=chapter-the-reunion-comment-4','chapter-the-reunion',null),
  ('post','chapter-the-reunion-comment-5','/forum?thread=chapter-the-reunion&comment=chapter-the-reunion-comment-5','chapter-the-reunion',null),
  ('post','chapter-the-reunion-comment-6','/forum?thread=chapter-the-reunion&comment=chapter-the-reunion-comment-6','chapter-the-reunion',null),
  ('post','chapter-the-glass-flower-comment-1','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-1','chapter-the-glass-flower',null),
  ('post','chapter-the-glass-flower-comment-2','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-2','chapter-the-glass-flower',null),
  ('post','chapter-the-glass-flower-comment-3','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-3','chapter-the-glass-flower',null),
  ('post','chapter-the-glass-flower-comment-4','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-4','chapter-the-glass-flower',null),
  ('post','chapter-the-glass-flower-comment-5','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-5','chapter-the-glass-flower',null),
  ('post','chapter-the-glass-flower-comment-6','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-6','chapter-the-glass-flower',null),
  ('post','chapter-the-glass-flower-comment-7','/forum?thread=chapter-the-glass-flower&comment=chapter-the-glass-flower-comment-7','chapter-the-glass-flower',null),
  ('post','chapter-the-mummers-blood-comment-1','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-1','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-2','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-2','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-3','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-3','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-4','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-4','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-5','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-5','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-6','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-6','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-7','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-7','chapter-the-mummers-blood',null),
  ('post','chapter-the-mummers-blood-comment-8','/forum?thread=chapter-the-mummers-blood&comment=chapter-the-mummers-blood-comment-8','chapter-the-mummers-blood',null),
  ('post','theory-ghost-dragon-comment-1','/forum?thread=theory-ghost-dragon&comment=theory-ghost-dragon-comment-1','theory-ghost-dragon','Ghost dragon theories: camouflage is not invisibility'),
  ('post','theory-ghost-dragon-comment-2','/forum?thread=theory-ghost-dragon&comment=theory-ghost-dragon-comment-2','theory-ghost-dragon','Ghost dragon theories: camouflage is not invisibility'),
  ('post','theory-ghost-dragon-comment-3','/forum?thread=theory-ghost-dragon&comment=theory-ghost-dragon-comment-3','theory-ghost-dragon','Ghost dragon theories: camouflage is not invisibility'),
  ('post','theory-ghost-dragon-comment-4','/forum?thread=theory-ghost-dragon&comment=theory-ghost-dragon-comment-4','theory-ghost-dragon','Ghost dragon theories: camouflage is not invisibility'),
  ('post','meta-quiet-chapters-comment-1','/forum?thread=meta-quiet-chapters&comment=meta-quiet-chapters-comment-1','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('post','meta-quiet-chapters-comment-2','/forum?thread=meta-quiet-chapters&comment=meta-quiet-chapters-comment-2','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('post','meta-quiet-chapters-comment-3','/forum?thread=meta-quiet-chapters&comment=meta-quiet-chapters-comment-3','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('post','meta-quiet-chapters-comment-4','/forum?thread=meta-quiet-chapters&comment=meta-quiet-chapters-comment-4','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('post','meta-quiet-chapters-comment-5','/forum?thread=meta-quiet-chapters&comment=meta-quiet-chapters-comment-5','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('post','community-crackship-desk-comment-1','/forum?thread=community-crackship-desk&comment=community-crackship-desk-comment-1','community-crackship-desk','The extremely unofficial impossible-pairing desk'),
  ('post','community-crackship-desk-comment-2','/forum?thread=community-crackship-desk&comment=community-crackship-desk-comment-2','community-crackship-desk','The extremely unofficial impossible-pairing desk'),
  ('post','community-crackship-desk-comment-3','/forum?thread=community-crackship-desk&comment=community-crackship-desk-comment-3','community-crackship-desk','The extremely unofficial impossible-pairing desk'),
  ('post','community-crackship-desk-comment-4','/forum?thread=community-crackship-desk&comment=community-crackship-desk-comment-4','community-crackship-desk','The extremely unofficial impossible-pairing desk'),
  ('post','community-council-break-room-comment-1','/forum?thread=community-council-break-room&comment=community-council-break-room-comment-1','community-council-break-room','Which council meeting should have been a raven?'),
  ('post','community-council-break-room-comment-2','/forum?thread=community-council-break-room&comment=community-council-break-room-comment-2','community-council-break-room','Which council meeting should have been a raven?'),
  ('post','community-council-break-room-comment-3','/forum?thread=community-council-break-room&comment=community-council-break-room-comment-3','community-council-break-room','Which council meeting should have been a raven?'),
  ('post','community-council-break-room-comment-4','/forum?thread=community-council-break-room&comment=community-council-break-room-comment-4','community-council-break-room','Which council meeting should have been a raven?'),
  ('post','community-reading-snacks-community-cake','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-cake','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-soup','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-soup','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-soup-reply','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-soup-reply','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-tea','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-tea','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-plate','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-plate','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-nothing','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-nothing','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-toast','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-toast','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-crumbs','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-crumbs','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-jace','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-jace','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','community-reading-snacks-community-cake-return','/forum?thread=community-reading-snacks&comment=community-reading-snacks-community-cake-return','community-reading-snacks','What are you eating while reading? Crumbs are already in the book.'),
  ('post','meta-edit-first-impressions-community-intent','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-intent','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','meta-edit-first-impressions-community-mood','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-mood','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','meta-edit-first-impressions-community-receipts','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-receipts','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','meta-edit-first-impressions-community-homework','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-homework','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','meta-edit-first-impressions-community-optional','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-optional','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','meta-edit-first-impressions-community-new','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-new','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','meta-edit-first-impressions-community-caption','/forum?thread=meta-edit-first-impressions&comment=meta-edit-first-impressions-community-caption','meta-edit-first-impressions','Did an edit give you completely the wrong first impression?'),
  ('post','community-modern-day-jobs-community-saathos','/forum?thread=community-modern-day-jobs&comment=community-modern-day-jobs-community-saathos','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('post','community-modern-day-jobs-community-retention','/forum?thread=community-modern-day-jobs&comment=community-modern-day-jobs-community-retention','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('post','community-modern-day-jobs-community-alester','/forum?thread=community-modern-day-jobs&comment=community-modern-day-jobs-community-alester','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('post','community-modern-day-jobs-community-babysit','/forum?thread=community-modern-day-jobs&comment=community-modern-day-jobs-community-babysit','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('post','community-modern-day-jobs-community-rota','/forum?thread=community-modern-day-jobs&comment=community-modern-day-jobs-community-rota','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('post','community-modern-day-jobs-community-reply','/forum?thread=community-modern-day-jobs&comment=community-modern-day-jobs-community-reply','community-modern-day-jobs','Modern AU: give someone an ordinary job they would actually keep'),
  ('post','community-retracted-takes-community-critic','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-critic','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-defender','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-defender','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-critic-again','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-critic-again','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-defender-again','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-defender-again','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-ada','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-ada','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-bait','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-bait','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-no','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-no','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-retracted-takes-community-later','/forum?thread=community-retracted-takes&comment=community-retracted-takes-community-later','community-retracted-takes','A take you have actually changed your mind about'),
  ('post','community-new-reader-desk-community-names','/forum?thread=community-new-reader-desk&comment=community-new-reader-desk-community-names','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','community-new-reader-desk-community-tabs','/forum?thread=community-new-reader-desk&comment=community-new-reader-desk-community-tabs','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','community-new-reader-desk-community-uncle','/forum?thread=community-new-reader-desk&comment=community-new-reader-desk-community-uncle','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','community-new-reader-desk-community-desk','/forum?thread=community-new-reader-desk&comment=community-new-reader-desk-community-desk','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','community-great-game-table-community-favourite','/forum?thread=community-great-game-table&comment=community-great-game-table-community-favourite','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','community-great-game-table-community-support','/forum?thread=community-great-game-table&comment=community-great-game-table-community-support','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','community-great-game-table-community-win','/forum?thread=community-great-game-table&comment=community-great-game-table-community-win','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','community-great-game-table-community-loss','/forum?thread=community-great-game-table&comment=community-great-game-table-community-loss','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','community-great-game-table-community-paper','/forum?thread=community-great-game-table&comment=community-great-game-table-community-paper','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','community-dragon-ranking-fatigue-community-scale','/forum?thread=community-dragon-ranking-fatigue&comment=community-dragon-ranking-fatigue-community-scale','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('post','community-dragon-ranking-fatigue-community-ecology','/forum?thread=community-dragon-ranking-fatigue&comment=community-dragon-ranking-fatigue-community-ecology','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('post','community-dragon-ranking-fatigue-community-art','/forum?thread=community-dragon-ranking-fatigue&comment=community-dragon-ranking-fatigue-community-art','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('post','community-dragon-ranking-fatigue-community-garden','/forum?thread=community-dragon-ranking-fatigue&comment=community-dragon-ranking-fatigue-community-garden','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('post','community-dragon-ranking-fatigue-community-fence','/forum?thread=community-dragon-ranking-fatigue&comment=community-dragon-ranking-fatigue-community-fence','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('post','community-dragon-ranking-fatigue-community-caveat','/forum?thread=community-dragon-ranking-fatigue&comment=community-dragon-ranking-fatigue-community-caveat','community-dragon-ranking-fatigue','Can we have one dragon thread without making a tier list?'),
  ('post','meta-one-ordinary-afternoon-community-servant','/forum?thread=meta-one-ordinary-afternoon&comment=meta-one-ordinary-afternoon-community-servant','meta-one-ordinary-afternoon','One ordinary afternoon from a side character: who gets the page?'),
  ('post','meta-one-ordinary-afternoon-community-craft','/forum?thread=meta-one-ordinary-afternoon&comment=meta-one-ordinary-afternoon-community-craft','meta-one-ordinary-afternoon','One ordinary afternoon from a side character: who gets the page?'),
  ('post','meta-one-ordinary-afternoon-community-quiet','/forum?thread=meta-one-ordinary-afternoon&comment=meta-one-ordinary-afternoon-community-quiet','meta-one-ordinary-afternoon','One ordinary afternoon from a side character: who gets the page?'),
  ('post','meta-one-ordinary-afternoon-community-avoid','/forum?thread=meta-one-ordinary-afternoon&comment=meta-one-ordinary-afternoon-community-avoid','meta-one-ordinary-afternoon','One ordinary afternoon from a side character: who gets the page?'),
  ('post','meta-quiet-chapters-community-breathing','/forum?thread=meta-quiet-chapters&comment=meta-quiet-chapters-community-breathing','meta-quiet-chapters','Hot take: the quiet chapters are doing the heavy lifting'),
  ('post','community-council-break-room-community-agenda','/forum?thread=community-council-break-room&comment=community-council-break-room-community-agenda','community-council-break-room','Which council meeting should have been a raven?'),
  ('post','community-crackship-desk-community-playlist','/forum?thread=community-crackship-desk&comment=community-crackship-desk-community-playlist','community-crackship-desk','The extremely unofficial impossible-pairing desk'),
  ('post','theory-ghost-dragon-community-diagram','/forum?thread=theory-ghost-dragon&comment=theory-ghost-dragon-community-diagram','theory-ghost-dragon','Ghost dragon theories: camouflage is not invisibility'),
  ('post','live-new-reader-luck-why-site-gate','/forum?thread=community-new-reader-desk&comment=live-new-reader-luck-why-site-gate','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','live-new-reader-luck-why-site-newbie','/forum?thread=community-new-reader-desk&comment=live-new-reader-luck-why-site-newbie','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','live-admin-appreciation-room-critic','/forum?thread=4badd542-d627-49e9-9480-0f1fb8de2e4d&comment=live-admin-appreciation-room-critic','4badd542-d627-49e9-9480-0f1fb8de2e4d',null),
  ('post','live-admin-appreciation-jace','/forum?thread=4badd542-d627-49e9-9480-0f1fb8de2e4d&comment=live-admin-appreciation-jace','4badd542-d627-49e9-9480-0f1fb8de2e4d',null),
  ('post','live-admin-appreciation-ada-reply-jace','/forum?thread=4badd542-d627-49e9-9480-0f1fb8de2e4d&comment=live-admin-appreciation-ada-reply-jace','4badd542-d627-49e9-9480-0f1fb8de2e4d',null),
  ('post','live-great-game-luck-fun-mert','/forum?thread=community-great-game-table&comment=live-great-game-luck-fun-mert','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','live-great-game-luck-fun-league','/forum?thread=community-great-game-table&comment=live-great-game-luck-fun-league','community-great-game-table','The Great Game table: are you building to win or refusing to cut your favourite?'),
  ('post','live-new-reader-luck-how-did-you-know-gate','/forum?thread=community-new-reader-desk&comment=live-new-reader-luck-how-did-you-know-gate','community-new-reader-desk','Small questions desk: names, navigation, things you lost track of'),
  ('post','live-admin-appreciation-luck-cooked-jace','/forum?thread=4badd542-d627-49e9-9480-0f1fb8de2e4d&comment=live-admin-appreciation-luck-cooked-jace','4badd542-d627-49e9-9480-0f1fb8de2e4d',null)
on conflict (target_kind,target_id) do update set
 href=excluded.href,
 thread_id=coalesce(excluded.thread_id,public.community_reaction_targets.thread_id),
 thread_title=coalesce(excluded.thread_title,public.community_reaction_targets.thread_title);

-- SECURITY DEFINER is intentional: validation happens inside the function and
-- then the write can safely bypass a stale/overly strict direct-insert policy.
create or replace function public.can_read_like_target(kind text, target text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select case kind
    when 'thread' then
      exists(select 1 from public.forum_threads where id::text=target and is_visible)
      or exists(select 1 from public.community_reaction_targets where target_kind='thread' and target_id=target)
    when 'post' then
      exists(select 1 from public.forum_posts where id::text=target and is_visible)
      or exists(select 1 from public.community_reaction_targets where target_kind='post' and target_id=target)
    when 'raven' then exists(select 1 from public.raven_comments where id::text=target and is_visible)
    when 'message' then exists(select 1 from public.direct_raven_messages where id::text=target and deleted_at is null)
    else false
  end;
$$;
revoke all on function public.can_read_like_target(text,text) from public;
grant execute on function public.can_read_like_target(text,text) to anon,authenticated;

create or replace function public.toggle_member_reaction(kind text, target text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  uid uuid := auth.uid();
  already boolean;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not public.can_read_like_target(kind,target) then raise exception 'invalid_reaction_target'; end if;
  select exists(select 1 from public.member_likes where user_id=uid and target_kind=kind and target_id=target) into already;
  if already then
    delete from public.member_likes where user_id=uid and target_kind=kind and target_id=target;
    return false;
  end if;
  insert into public.member_likes(user_id,target_kind,target_id) values(uid,kind,target)
  on conflict(user_id,target_kind,target_id) do nothing;
  return true;
end;
$$;
revoke all on function public.toggle_member_reaction(text,text) from public;
grant execute on function public.toggle_member_reaction(text,text) to authenticated;

-- Return a useful title for profile reaction activity. Drop first because this
-- adds a return column compared with the older function signature.
drop function if exists public.profile_reactions(uuid);
create function public.profile_reactions(member_id uuid)
returns table(target_kind text,target_id text,direction text,total bigint,latest timestamptz,href text,target_title text)
language sql stable security invoker set search_path='' as $$
 with targets as (
   select 'thread'::text kind,id::text target,user_author_id author,'/forum?thread='||id::text link,title target_title
   from public.forum_threads where is_visible
   union all
   select 'post',p.id::text,p.user_author_id,'/forum?thread='||p.thread_id::text||'&comment='||p.id::text,t.title
   from public.forum_posts p join public.forum_threads t on t.id::text=p.thread_id::text where p.is_visible and t.is_visible
   union all
   select 'raven',id::text,user_author_id,'/ravens-eye?item='||entry_id||'&comment='||id::text,'Raven''s Eye comment'::text
   from public.raven_comments where is_visible
   union all
   select crt.target_kind,crt.target_id,null::uuid,crt.href,
          coalesce(crt.thread_title,ft.title,'Taverns')
   from public.community_reaction_targets crt
   left join public.forum_threads ft on ft.id::text=crt.thread_id
 ), events as (
   select l.target_kind,l.target_id,'received'::text direction,l.created_at,t.link,t.target_title
   from public.member_likes l join targets t on t.kind=l.target_kind and t.target=l.target_id
   where t.author=member_id and l.user_id<>member_id
   union all
   select l.target_kind,l.target_id,'given',l.created_at,t.link,t.target_title
   from public.member_likes l join targets t on t.kind=l.target_kind and t.target=l.target_id
   where l.user_id=member_id
 )
 select target_kind,target_id,direction,count(*),max(created_at),link,max(target_title)
 from events group by target_kind,target_id,direction,link
 order by max(created_at) desc limit 30;
$$;
revoke all on function public.profile_reactions(uuid) from public;
grant execute on function public.profile_reactions(uuid) to anon,authenticated;

notify pgrst,'reload schema';
commit;
