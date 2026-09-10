import assert from 'node:assert/strict';
import fs from 'node:fs';
import { publishCommunity } from '../lib/communityPublication.mjs';
const data = JSON.parse(fs.readFileSync(new URL('../data/flea-bottom.json', import.meta.url), 'utf8'));
const updates = JSON.parse(fs.readFileSync(new URL('../data/community-updates.json', import.meta.url), 'utf8'));
const scheduled = data.comments.filter(c => c.id.includes('-scheduled-'));
assert.equal(scheduled.length, 3);
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
assert.equal(publicData.comments.length, data.comments.length - 3);
assert.equal(publicData.updates.length, 1);
for (const user of publicData.users) {
  assert.equal(user.friendCount, data.users.find(u=>u.id===user.id).friendIds.length);
  for (const field of ['friendIds','voice','continuity','fandoms','interests']) assert(!(field in user));
}
console.log('PASS: exact publication boundaries, parent gating, private data projection, friendship counts and initial release note.');
