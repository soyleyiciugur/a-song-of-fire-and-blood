import assert from 'node:assert/strict';
import fs from 'node:fs';
import { publishCommunity } from '../lib/communityPublication.mjs';
import { communityFriendships } from '../lib/communityRelationships.mjs';
import { notificationTimeGroup, groupNotifications } from '../lib/notificationTime.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../data/flea-bottom.json', import.meta.url), 'utf8'));
const updates = JSON.parse(fs.readFileSync(new URL('../data/update-notes.json', import.meta.url), 'utf8'));
const scheduled = data.comments.filter(c => c.id.includes('-scheduled-'));
const schedule = JSON.parse(fs.readFileSync(new URL('../data/community-schedule.json', import.meta.url), 'utf8'));
const { validateCommunitySchedule } = await import('./lib/validate-community-schedule.mjs');
validateCommunitySchedule(schedule);
assert.deepEqual(scheduled.map(c => c.id).sort(), schedule.slots.flatMap(slot => slot.commentIds).sort());
for (const c of scheduled) {
  const time = Date.parse(c.publishedAt);
  const before = publishCommunity(data, updates, time - 1);
  assert(!before.comments.some(item => item.id === c.id));
  assert(!JSON.stringify(before).includes(c.body), 'Future body must not reach clients');
  assert(publishCommunity(data, updates, time).comments.some(item => item.id === c.id), 'Publishes at exact timestamp');
  assert(publishCommunity(data, updates, time + 1).comments.some(item => item.id === c.id));
}
const root = { id:'root', parentId:null, body:'future root', publishedAt:'2026-09-12T00:00:00.000Z' };
const reply = { id:'reply', parentId:'root', body:'reply', publishedAt:'2026-09-11T00:00:00.000Z' };
assert.equal(publishCommunity({users:[],comments:[root,reply]},[],Date.parse(reply.publishedAt)).comments.length,0,'Even malformed early replies stay hidden');
const publicData = publishCommunity(data, updates, Date.parse('2026-09-10T12:00:00.000Z'));
assert.equal(publicData.comments.length, data.comments.filter(c => Date.parse(c.publishedAt) <= Date.parse(publicData.serverTime)).length);
assert.equal(publicData.updates.length, updates.filter(u=>Date.parse(`${u.date}T00:00:00+03:00`)<=Date.parse(publicData.serverTime)).length);
for (const user of publicData.users) {
  const expected = communityFriendships(data, Date.parse(publicData.serverTime)).get(user.id);
  assert.deepEqual(user.friendIds, expected);
  assert.equal(user.friendCount, expected.length);
  for (const field of ['history','voice','continuity','fandoms','interests']) assert(!(field in user));
}
assert(!('relationships' in publicData));
assert.equal(new Set(updates.map(u=>u.date)).size,updates.length, 'One record per day');
assert(updates.every(u=>/^\d{4}-\d{2}-\d{2}$/.test(u.date) && u.items?.length),'Daily canonical schema');
assert.deepEqual(updates.map(u=>u.date),updates.map(u=>u.date).sort().reverse());
assert(updates.some(u=>u.items.some(item=>item.includes('Hasocash'))),'Preserve community release notes');
assert(updates.find(u=>u.date==='2026-09-09').items.some(item=>item.includes('Added comments')),'Keep the designated comment launch date');
const midnight = Date.parse('2026-09-10T00:00:00+03:00');
assert(!publishCommunity(data, updates, midnight - 1).updates.some(u=>u.id==='site-updates-2026-09-10'));
assert(publishCommunity(data, updates, midnight).updates.some(u=>u.id==='site-updates-2026-09-10'));
assert.equal(notificationTimeGroup('2026-09-10T00:00:00+03:00',Date.parse('2026-09-10T01:00:00+03:00'),true),'Today','Day-only entries must not claim elapsed-hour precision');
const graph=communityFriendships(data,Date.parse(publicData.serverTime));
assert(!graph.get('regular-g').includes('regular-u'),'Real antagonism is not friendship');
assert(graph.get('regular-s').includes('regular-j'),'Friendly rivalry can be friendship');
assert(graph.get('regular-u').includes('regular-k'),'Political disagreement can coexist with affection');
const evolution={users:[{id:'a'},{id:'b'}],relationships:[{users:['a','b'],history:[
  {at:'2026-09-10T12:00:00Z',kind:'friends'},
  {at:'2026-09-11T12:00:00Z',kind:'rivals'},
  {at:'2026-09-12T12:00:00Z',kind:'friendly-banter'},
]}]};
for(const [time,expected] of [['2026-09-10T11:59:59Z',[]],['2026-09-10T12:00:00Z',['b']],['2026-09-11T12:00:00Z',[]],['2026-09-12T12:00:00Z',['b']]])assert.deepEqual(communityFriendships(evolution,Date.parse(time)).get('a'),expected);
console.log('PASS: exact publication boundaries, parent gating, private data projection, friendship counts and initial release note.');
const now=Date.parse('2026-09-11T20:00:00+03:00');
for(const [date,label] of [
  ['2026-09-11T19:58:00+03:00','Now'],
  ['2026-09-11T19:40:00+03:00','Earlier this hour'],
  ['2026-09-11T19:00:00+03:00','1 hour ago'],
  ['2026-09-11T17:00:00+03:00','3 hours ago'],
  ['2026-09-11T10:00:00+03:00','10 hours ago'],
  ['2026-09-11T08:00:00+03:00','Today'],
  ['2026-09-10T23:55:00+03:00','Yesterday'],
  ['2026-09-09T12:00:00+03:00','9 September 2026'],
]) assert.equal(notificationTimeGroup(date,now),label);
assert.equal(notificationTimeGroup('2026-09-10T23:59:00+03:00',Date.parse('2026-09-11T00:01:00+03:00')),'Yesterday','Istanbul midnight takes precedence over elapsed hours');
const sample=[{id:'a',publishedAt:'2026-09-11T19:59:00+03:00'},{id:'b',publishedAt:'2026-09-11T19:58:00+03:00'},{id:'c',publishedAt:'2026-09-10T23:00:00+03:00'}];
assert.deepEqual(groupNotifications(sample,now).map(g=>[g.label,g.entries.map(e=>e.id)]),[['Now',['a','b']],['Yesterday',['c']]]);
console.log('PASS: time sections, elapsed hour labels, calendar midnight, grouping without loss or duplication.');
