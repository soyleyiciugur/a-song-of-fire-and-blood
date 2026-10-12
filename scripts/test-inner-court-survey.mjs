import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const surveyModule = { exports: {} };
const compiled = ts.transpileModule(readFileSync('data/inner-court-survey.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('exports', compiled)(surveyModule.exports);
const { getSurveyQuestions, answerBody, abstentions } = surveyModule.exports;
const chapterIds = new Set(JSON.parse(readFileSync('data/chapters.json', 'utf8')).map(c => c.slug));
const characterIds = new Set(JSON.parse(readFileSync('data/characters/characters.json', 'utf8')).map(c => c.id));
for (const character of ['jacaelon-targaryen', 'visenor-targaryen', 'gaelor-targaryen', 'hrrm']) {
  const questions = getSurveyQuestions(character);
  assert.equal(questions.length, 12);
  assert.equal(new Set(questions.map(q => q.id)).size, questions.length);
  for (const q of questions) {
    assert.ok(chapterIds.has(q.chapter), `${character}/${q.id}: unknown chapter`);
    q.characters.forEach(id => assert.ok(characterIds.has(id), `${character}/${q.id}: unknown character ${id}`));
    assert.equal(answerBody(q, { choices: [abstentions[0]], note: '' }), null, 'abstentions must not invent thoughts');
    assert.equal(answerBody(q, { choices: [], note: ' My own thought. ' }), 'My own thought.');
  }
}
assert.deepEqual(getSurveyQuestions('unassigned-character'), []);

const chapterModule = { exports: {} };
const chapterData = JSON.parse(readFileSync('data/chapters.json', 'utf8'));
const timeline = JSON.parse(readFileSync('data/timeline.json', 'utf8'));
const chapterCompiled = ts.transpileModule(readFileSync('data/inner-court-chapter-surveys.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('exports', 'require', chapterCompiled)(chapterModule.exports, (path) => path === './timeline.json' ? { default: timeline } : path === './inner-court-survey' ? surveyModule.exports : { getAllChapters: () => chapterData });
const { getChapterSurveyQuestions, chapterSurveyEvents, chapterSurveyScope } = chapterModule.exports;
assert.equal(Object.keys(chapterSurveyEvents).length, chapterData.length, 'every published chapter has an editorial inventory');
for (const chapter of chapterData) {
  const events = chapterSurveyEvents[chapter.slug];
  const sourceScenes = timeline.find(c => c.chapterSlug === chapter.slug).events;
  assert.equal(new Set(events.map(e => e.id)).size, events.length, 'stable event IDs must be unique within a chapter');
  for (const event of events) event.sources.forEach(title => assert.ok(sourceScenes.some(e => e.title === title), `${chapter.slug}: missing source ${title}`));
  for (const scene of sourceScenes) assert.ok(events.some(e => e.sources.includes(scene.title)), `${chapter.slug}: missing scene coverage ${scene.title}`);
  for (const character of ['jacaelon-targaryen', 'visenor-targaryen', 'gaelor-targaryen', 'hrrm']) {
    const questions = getChapterSurveyQuestions(character, chapter.slug);
    assert.ok(questions.length <= 4 || character === 'hrrm', 'player mini-surveys should remain short');
    for (const q of questions) {
      assert.equal(q.chapter, chapter.slug, 'outputs must be filed under their source chapter');
      assert.ok(q.subject.length <= 160, 'entry heading fits the ordinary editor');
      if (character !== 'hrrm') assert.equal(q.subject, q.prompt, 'grouped scene headings must not leak another character\'s knowledge into an entry');
      q.characters.forEach(id => assert.ok(characterIds.has(id), `unknown chapter-question character ${id}`));
      assert.ok(q.options.length >= 3);
    }
  }
}
assert.equal(getChapterSurveyQuestions('jacaelon-targaryen', 'of-ravens-and-bitter-blood').length, 3);
assert.equal(getChapterSurveyQuestions('visenor-targaryen', 'of-ravens-and-bitter-blood').length, 2);
assert.deepEqual(getChapterSurveyQuestions('gaelor-targaryen', 'of-ravens-and-bitter-blood'), [], 'Gaelor must not learn the private mission discussion');
assert.deepEqual(getChapterSurveyQuestions('visenor-targaryen', 'fireflies'), [], 'absent characters do not receive another scene\'s knowledge');
assert.ok(!getChapterSurveyQuestions('visenor-targaryen', 'the-children-pay').some(q => /death|dies|dead|final command/i.test(q.prompt)), 'Visenor must not learn Rhaella\'s fate through his questions');
assert.deepEqual(getChapterSurveyQuestions('unassigned-character', chapterData[0].slug), []);
assert.deepEqual(getChapterSurveyQuestions('jacaelon-targaryen', 'unknown-chapter'), []);
assert.notEqual(chapterSurveyScope(chapterData[0].slug), chapterSurveyScope(chapterData[1].slug));

const db = new PGlite();
const owner = '00000000-0000-4000-8000-000000000001';
const gm = '00000000-0000-4000-8000-000000000002';
const other = '00000000-0000-4000-8000-000000000003';
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table public.profiles(id uuid primary key,username text);
    create table public.character_player_assignments(character_id text primary key,player_username text);
    create table public.character_inner_court(id uuid primary key default gen_random_uuid(),character_id text,chapter_slug text,kind text,subject text,body text,status text default 'active',created_by uuid,created_at timestamptz default now(),updated_at timestamptz default now(),sort_order int default 0);
    alter table public.character_inner_court enable row level security;
    create policy "Inner Court is publicly readable" on public.character_inner_court for select using(true);
    create function public.can_edit_character_inner_court(target_character_id text) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles p join character_player_assignments a on a.player_username=p.username where p.id=auth.uid() and a.character_id=target_character_id) $$;
    insert into profiles values('${owner}','luck'),('${gm}','hrrm'),('${other}','someone');
    insert into character_player_assignments values('jacaelon-targaryen','luck'),('hrrm','hrrm');
  `);
  await db.exec(readFileSync('supabase/migrations/20261012150000_inner_court_survey_privacy.sql','utf8'));
  await db.exec('grant select on character_inner_court, inner_court_surveys to anon, authenticated;');
  const asUser = async (uid, role = 'authenticated') => { await db.exec(`reset role; select set_config('test.uid','${uid}',false); set role ${role};`); };
  const save = async (revision, entries, seal = true, complete = false, scope = 'v1') => (await db.query(`select * from public.save_inner_court_survey('jacaelon-targaryen',$6,$1::jsonb,0,$2,$3,$4,$5::jsonb)`, [JSON.stringify({ father: { choices: ['Trust'], note: '', private: true, hideFromGm: true } }), revision, seal, complete, JSON.stringify(entries), scope])).rows[0];
  const entry = (key, privateValue, hidden) => ({ key,chapter:'chapter-one',kind:'thought',subject:key,body:'A meaningful thought',characters:['baelenys-targaryen'],private:privateValue,hideFromGm:hidden });
  await asUser(owner);
  let saved = await save(0, [], false);
  assert.equal(saved.revision, 1);
  assert.equal((await db.query('select * from character_inner_court')).rows.length,0,'autosave must not publish draft');
  await db.exec('reset role');
  await db.exec(readFileSync('supabase/migrations/20261012160000_inner_court_chapter_surveys.sql','utf8'));
  await asUser(owner);
  assert.equal((await db.query('select revision from inner_court_surveys')).rows[0].revision,1,'scope migration preserves existing onboarding progress');
  saved = await save(1,[entry('public',false,false),entry('private',true,false),entry('hidden',true,true)],true,true);
  assert.ok(saved.completed_at);
  assert.equal((await db.query('select * from character_inner_court')).rows.length,3);
  await save(2,[{...entry('public',false,false),body:'Revised thought'}]);
  assert.equal((await db.query('select * from character_inner_court')).rows.length,3,'repeated sealing updates rather than duplicates');
  await assert.rejects(save(1,[]), /changed in another session/);
  assert.equal((await db.query('select revision from inner_court_surveys')).rows[0].revision,3,'conflicting save must roll back');
  await asUser(gm);
  assert.deepEqual((await db.query('select subject from character_inner_court order by subject')).rows.map(r=>r.subject),['private','public']);
  assert.equal((await db.query('select * from inner_court_surveys')).rows.length,0,'GM must not read survey drafts');
  await assert.rejects(save(3,[]), /Not permitted/);
  await asUser(other);
  assert.equal((await db.query('select * from character_inner_court')).rows.length,1);
  assert.equal((await db.query('select * from inner_court_surveys')).rows.length,0);
  await asUser('', 'anon');
  assert.equal((await db.query('select * from character_inner_court')).rows.length,1,'anonymous reader sees public thoughts only');
  await asUser(owner);
  await assert.rejects(save(3,[entry('invalid',false,true)]),/inner_court_hidden_requires_private/);
  assert.equal((await db.query('select revision from inner_court_surveys')).rows[0].revision,3,'failed sealing is atomic');
  await save(3,[{...entry('public',false,false),body:null}]);
  assert.equal((await db.query('select * from character_inner_court')).rows.length,2,'withdrawn answer removes only its linked survey entry');
  const chapterA = chapterSurveyScope(chapterData[0].slug), chapterB = chapterSurveyScope(chapterData[1].slug);
  await save(0,[entry('public',true,true)],true,true,chapterA);
  await save(0,[entry('public',false,false)],true,false,chapterB);
  assert.equal((await db.query('select * from inner_court_surveys')).rows.length,3,'onboarding and two chapters keep independent drafts');
  assert.equal((await db.query('select * from character_inner_court')).rows.length,4,'same question ID in another scope cannot overwrite an earlier entry');
  assert.ok((await db.query('select completed_at from inner_court_surveys where survey_version=$1',[chapterA])).rows[0].completed_at);
  assert.equal((await db.query('select completed_at from inner_court_surveys where survey_version=$1',[chapterB])).rows[0].completed_at,null);
  await save(1,[{...entry('public',true,true),body:null}],true,false,chapterA);
  assert.equal((await db.query('select * from character_inner_court')).rows.length,3,'withdrawal affects only its own chapter');
  assert.equal((await db.query('select revision from inner_court_surveys where survey_version=$1',[chapterB])).rows[0].revision,1);
  await asUser(gm);
  assert.equal((await db.query('select * from inner_court_surveys')).rows.length,0,'chapter drafts stay hidden from GM');
  console.log('PASS chapter inventory/references/knowledge boundaries, independent chapter drafts and completion, preservation, privacy, atomic sealing, conflicts and withdrawal');
} finally { await db.close(); }
