import fs from "node:fs";
import assert from "node:assert/strict";

const read = (name) => JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
const gallery = read("gallery.json");
const { version, users, comments } = read("flea-bottom.json");
const eligible = gallery.filter((entry) => entry.category === "fleabottom" || /\.(mp4|webm|mov)$/i.test(entry.src.split(/[?#]/)[0]));

if (process.argv.includes("--pending")) {
  console.log(JSON.stringify(eligible.filter((entry) => !comments.some((comment) => comment.entryId === entry.id)), null, 2));
  process.exit(0);
}

assert.equal(version, 1, "Unsupported community data version");
assert(Array.isArray(users) && Array.isArray(comments), "Community users and comments must be arrays");
const userMap = new Map(users.map((user) => [user.id, user]));
const commentMap = new Map(comments.map((comment) => [comment.id, comment]));
const entryIds = new Set(eligible.map((entry) => entry.id));
assert.equal(userMap.size, users.length, "Duplicate user IDs");
assert.equal(new Set(users.map((user) => user.username.toLowerCase())).size, users.length, "Duplicate usernames");
assert.equal(commentMap.size, comments.length, "Duplicate comment IDs");
for (const user of users) {
  assert(["fictional", "member"].includes(user.kind), `Invalid user kind: ${user.id}`);
  assert(/^[a-zA-Z0-9_.]{3,30}$/.test(user.username), `Invalid handle: ${user.id}`);
  assert(/^#[0-9a-f]{6}$/i.test(user.color), `Invalid avatar color: ${user.id}`);
  assert(user.avatar && user.bio && user.voice && user.continuity?.length, `Incomplete profile: ${user.id}`);
}
for (const comment of comments) {
  assert(entryIds.has(comment.entryId), `Comment on missing or non-gutter entry: ${comment.id}`);
  assert(userMap.has(comment.authorId), `Unknown author: ${comment.id}`);
  assert(typeof comment.body === "string" && comment.body.trim().length > 0 && comment.body.length <= 1000, `Invalid body: ${comment.id}`);
  if (comment.parentId !== null) {
    const parent = commentMap.get(comment.parentId);
    assert(parent && parent.entryId === comment.entryId, `Reply must stay in the same thread: ${comment.id}`);
    assert.equal(parent.parentId, null, `Reply must target a root comment: ${comment.id}`);
    assert.notEqual(parent.authorId, comment.authorId, `Self reply: ${comment.id}`);
    assert(comments.indexOf(parent) < comments.indexOf(comment), `Reply precedes parent: ${comment.id}`);
  }
}
for (const entry of eligible) {
  const thread = comments.filter((comment) => comment.entryId === entry.id);
  const regulars = new Set(thread.filter((comment) => userMap.get(comment.authorId).kind === "fictional").map((comment) => comment.authorId));
  assert(regulars.size >= 5 && regulars.size <= 10, `${entry.id}: expected 5–10 distinct fictional regulars, found ${regulars.size}`);
  assert.equal(new Set(thread.map((comment) => comment.body.trim().toLowerCase())).size, thread.length, `Duplicate body in ${entry.id}`);
}
console.log(`Gutter data valid: ${eligible.length} posts, ${users.length} profiles, ${comments.length} comments.`);
