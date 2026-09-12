import fs from "node:fs";
import assert from "node:assert/strict";
import { communityFriendships } from '../lib/communityRelationships.mjs';

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const gallery = read("gallery.json");
const { version, users, comments, relationships } = read("flea-bottom.json");
const fandoms = read("flea-bottom-fandoms.json");
const characters = read("characters/characters.json");
const institutions = read("gutter-institutions.json");
const characterIds = new Set(characters.map((character) => character.id));
const institutionIds = new Set(institutions.map((institution) => institution.id));
const representedAccounts = new Set();
const fandomIds = new Set(fandoms.map((fandom) => fandom.id));
assert.equal(fandomIds.size, fandoms.length, "Duplicate fandom IDs");
const eligible = gallery;

if (process.argv.includes("--pending")) {
  console.log(JSON.stringify(eligible.filter((entry) => !comments.some((comment) => comment.entryId === entry.id)), null, 2));
  process.exit(0);
}

assert.equal(version, 1, "Unsupported community data version");
assert(Array.isArray(users) && Array.isArray(comments), "Community users and comments must be arrays");
const userMap = new Map(users.map((user) => [user.id, user]));
const relationshipPairs = new Set();
assert(Array.isArray(relationships), 'Missing relationship histories');
for(const relationship of relationships){
  assert.equal(relationship.users.length,2);
  const [a,b]=relationship.users;
  assert(a!==b && userMap.has(a) && userMap.has(b),'Relationship requires two existing distinct accounts');
  const pair=[a,b].sort().join(':');
  assert(!relationshipPairs.has(pair),`Duplicate relationship: ${pair}`);
  relationshipPairs.add(pair);
  assert(relationship.history.length>0,`Empty relationship history: ${pair}`);
  let previous=-Infinity;
  for(const event of relationship.history){
    assert(['friends','friendly-banter','strained','rivals','acquaintances'].includes(event.kind),`Unknown dynamic: ${pair}`);
    assert(Number.isFinite(Date.parse(event.at)) && Date.parse(event.at)>previous,`History must be dated and chronological: ${pair}`);
    assert(typeof event.note==='string' && event.note.trim(),`Missing continuity note: ${pair}`);
    previous=Date.parse(event.at);
  }
}
const friendships=communityFriendships({users,relationships});
const commentMap = new Map(comments.map((comment) => [comment.id, comment]));
const schedule = read('community-schedule.json');
assert.equal(schedule.timeZone, 'Europe/Istanbul');
const { validateCommunitySchedule } = await import('./lib/validate-community-schedule.mjs');
validateCommunitySchedule(schedule);
const plannedIds = schedule.slots.flatMap(slot=>slot.commentIds);
assert.equal(new Set(plannedIds).size, plannedIds.length, 'A comment belongs to one window');
for (const slot of schedule.slots) {
  assert(Number.isFinite(Date.parse(slot.publishedAt)), `Invalid window: ${slot.id}`);
  for (const id of slot.commentIds) assert.equal(commentMap.get(id)?.publishedAt, slot.publishedAt, `Publication plan mismatch: ${id}`);
}
assert.deepEqual([...plannedIds].sort(), comments.filter(c=>c.id.includes('-scheduled-')).map(c=>c.id).sort());
const entryIds = new Set(eligible.map((entry) => entry.id));
assert.equal(userMap.size, users.length, "Duplicate user IDs");
assert.equal(new Set(users.map((user) => user.username.toLowerCase())).size, users.length, "Duplicate usernames");
assert.equal(commentMap.size, comments.length, "Duplicate comment IDs");
for (const user of users) {
  assert(!('friendIds' in user), `Friendships derive from history, not duplicate user fields: ${user.id}`);
  const friendIds=friendships.get(user.id);
  assert.equal(new Set(friendIds).size, friendIds.length, `Duplicate friends: ${user.id}`);
  for (const friend of friendIds) {
    assert(friend !== user.id && userMap.has(friend), `Invalid friend: ${user.id}/${friend}`);
    assert(friendships.get(friend)?.includes(user.id), `Friendship must be mutual: ${user.id}/${friend}`);
  }
  assert(["fictional", "member"].includes(user.kind), `Invalid user kind: ${user.id}`);
  assert(/^[a-zA-Z0-9_.]{3,30}$/.test(user.username), `Invalid handle: ${user.id}`);
  assert(/^#[0-9a-f]{6}$/i.test(user.color), `Invalid avatar color: ${user.id}`);
  assert(user.avatar && user.bio && user.voice && user.continuity?.length, `Incomplete profile: ${user.id}`);
  if (user.account !== undefined) {
    assert.equal(user.kind, "fictional", `Only fictional accounts may represent RP identities: ${user.id}`);
    assert(["character", "institution"].includes(user.account.type), `Invalid account type: ${user.id}`);
    const id = user.account.type === "character" ? user.account.characterId : user.account.institutionId;
    assert((user.account.type === "character" ? characterIds : institutionIds).has(id), `Unknown represented identity: ${user.id}`);
    const key = `${user.account.type}:${id}`;
    assert(!representedAccounts.has(key), `Duplicate represented identity: ${key}`);
    representedAccounts.add(key);
  }
  for (const field of ["displayName", "pronouns", "location"]) {
    if (user[field] !== undefined) assert(typeof user[field] === "string" && user[field].trim().length > 0 && user[field].length <= 80, `Invalid ${field}: ${user.id}`);
  }
  if (user.current !== undefined) {
    assert(["Reading", "Watching", "Playing", "On repeat", "Making"].includes(user.current.label), `Invalid profile detail label: ${user.id}`);
    assert(typeof user.current.value === "string" && user.current.value.trim().length > 0 && user.current.value.length <= 120, `Invalid profile detail: ${user.id}`);
  }
  if (user.fandoms !== undefined) {
    assert(Array.isArray(user.fandoms) && new Set(user.fandoms).size === user.fandoms.length, `Invalid fandom list: ${user.id}`);
    assert(user.fandoms.every((id) => fandomIds.has(id)), `Unknown fandom: ${user.id}`);
  }
}
for (const fandom of fandoms) {
  assert(users.some((user) => user.fandoms?.includes(fandom.id)), `No profile for fandom: ${fandom.label}`);
}
for (const comment of comments) {
  assert(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(comment.publishedAt) && Number.isFinite(Date.parse(comment.publishedAt)), `Invalid publication timestamp: ${comment.id}`);
  assert(entryIds.has(comment.entryId), `Comment on missing or non-gutter entry: ${comment.id}`);
  assert(userMap.has(comment.authorId), `Unknown author: ${comment.id}`);
  assert(typeof comment.body === "string" && comment.body.trim().length > 0 && comment.body.length <= 1000, `Invalid body: ${comment.id}`);
  if (comment.parentId !== null) {
    if (comment.parentSource === "supabase") {
      assert(/^[0-9a-f-]{36}$/i.test(comment.parentId), `Live reply parent must be a Supabase UUID: ${comment.id}`);
    } else {
      const parent = commentMap.get(comment.parentId);
      assert(parent && parent.entryId === comment.entryId, `Reply must stay in the same thread: ${comment.id}`);
      assert.equal(parent.parentId, null, `Reply must target a root comment: ${comment.id}`);
      assert(Date.parse(parent.publishedAt) <= Date.parse(comment.publishedAt), `Reply publishes before parent: ${comment.id}`);
      assert.notEqual(parent.authorId, comment.authorId, `Self reply: ${comment.id}`);
      assert(comments.indexOf(parent) < comments.indexOf(comment), `Reply precedes parent: ${comment.id}`);
    }
  }
}
for (const entry of eligible) {
  const thread = comments.filter((comment) => comment.entryId === entry.id);
  const regulars = new Set(thread.filter((comment) => {
    const user = userMap.get(comment.authorId);
    return user.kind === "fictional" && !user.account;
  }).map((comment) => comment.authorId));
  assert(regulars.size >= 1, `${entry.id}: missing reader conversation`);
  assert.equal(new Set(thread.map((comment) => comment.body.trim().toLowerCase())).size, thread.length, `Duplicate body in ${entry.id}`);
}
console.log(`Gutter data valid: ${eligible.length} posts, ${users.length} profiles, ${comments.length} comments.`);
console.log(`All ${fandoms.length} fandom areas represented. Quiet profiles do not need a forced comment.`);
