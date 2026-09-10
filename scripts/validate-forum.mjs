import fs from 'node:fs';
import assert from 'node:assert/strict';
import { publishForum } from '../lib/forumPublication.mjs';
const read=name=>JSON.parse(fs.readFileSync(new URL(`../data/${name}`,import.meta.url),'utf8'));
const forum=read('forum.json'), chapters=read('chapters.json'), community=read('flea-bottom.json');
const users=new Map(community.users.map(u=>[u.id,u]));
const threads=new Map(forum.threads.map(t=>[t.id,t]));
const comments=new Map(forum.comments.map(c=>[c.id,c]));
assert.equal(threads.size,forum.threads.length);assert.equal(comments.size,forum.comments.length);
assert.equal(new Set([...community.comments.map(c=>c.id),...comments.keys()]).size,community.comments.length+comments.size);
const slugs=new Set(chapters.map(c=>c.slug));
for(const chapter of chapters)assert.equal(forum.threads.filter(t=>t.chapterSlug===chapter.slug).length,1,`One discussion for ${chapter.slug}`);
assert(forum.threads.filter(t=>!t.chapterSlug).length>=3, 'Preserve community discussions; expansion has no fixed thread cap');
for(const t of forum.threads){
  assert(users.has(t.authorId));assert(t.body.trim());assert(Number.isFinite(Date.parse(t.publishedAt)));
  assert(slugs.has(t.spoilerThrough));
  if(t.chapterSlug){assert(slugs.has(t.chapterSlug));assert.equal(t.spoilerThrough,t.chapterSlug);}
  else assert(t.title.trim());
  const participants=new Set(forum.comments.filter(c=>c.entryId===t.id&&!users.get(c.authorId)?.account).map(c=>c.authorId));
  if(t.chapterSlug)assert(participants.size>=5 && participants.size<=10,`${t.id} needs 5–10 regular participants`);
}
for(const [index,c] of forum.comments.entries()){
  assert(threads.has(c.entryId));assert(users.has(c.authorId));assert(c.body.trim()&&c.body.length<=6000);
  assert(Number.isFinite(Date.parse(c.publishedAt)));assert(Date.parse(c.publishedAt)>=Date.parse(threads.get(c.entryId).publishedAt));
  if(c.parentId){const p=comments.get(c.parentId);assert(p&&p.entryId===c.entryId);assert(forum.comments.indexOf(p)<index);assert(Date.parse(p.publishedAt)<=Date.parse(c.publishedAt));assert(p.authorId!==c.authorId);}
  assert.equal(new Set(c.upvoterIds).size,c.upvoterIds.length);
  assert(c.upvoterIds.every(id=>users.has(id)&&id!==c.authorId));
  assert(c.awards.every(a=>users.has(a.fromUserId)&&a.fromUserId!==c.authorId&&Number.isInteger(a.amount)&&a.amount>0));
  if(c.moderation){assert.equal(c.authorId,'cast-jacaelon-targaryen');assert.equal(c.moderation.targetCommentId,c.parentId);assert(c.moderation.rule);}
}
const now=Math.max(...forum.comments.map(c=>Date.parse(c.publishedAt)));
const output=publishForum(forum,chapters,now);
assert.equal(output.comments.length,forum.comments.length);
assert(output.comments.every(c=>!('upvoterIds'in c)&&!('awards'in c)));
assert(output.threads.filter(t=>t.chapterSlug).every(t=>t.title.includes(chapters.find(c=>c.slug===t.chapterSlug).title)));
const fixture={threads:[{id:'test',publishedAt:'2026-09-12T10:00:00Z'}],comments:[
  {id:'root',entryId:'test',parentId:null,publishedAt:'2026-09-12T11:00:00Z',upvoterIds:[],awards:[]},
  {id:'reply',entryId:'test',parentId:'root',publishedAt:'2026-09-12T10:00:00Z',upvoterIds:[],awards:[]},
  {id:'nested',entryId:'test',parentId:'reply',publishedAt:'2026-09-12T10:00:00Z',upvoterIds:[],awards:[]},
]};
assert.equal(publishForum(fixture,[],Date.parse('2026-09-12T10:30:00Z')).comments.length,0,'No descendant before parent');
assert.equal(publishForum(fixture,[],Date.parse('2026-09-12T11:00:00Z')).comments.length,3,'Nested discussion unfolds with parent');
assert.equal(publishForum(fixture,[],Date.parse('2026-09-12T09:00:00Z')).threads.length,0,'No future thread');
const schedule=read('community-schedule.json');
const scheduledThreadIds=schedule.slots.flatMap(slot=>slot.forumThreadIds ?? []);
const scheduledCommentIds=schedule.slots.flatMap(slot=>slot.forumCommentIds ?? []);
assert.equal(new Set(scheduledThreadIds).size,scheduledThreadIds.length);
assert.equal(new Set(scheduledCommentIds).size,scheduledCommentIds.length);
for(const slot of schedule.slots){
  const threadIds=slot.forumThreadIds ?? [], commentIds=slot.forumCommentIds ?? [];
  if(threadIds.length || commentIds.length)assert(slot.commentIds.length,'Forum activity uses the same three selected publication windows');
  const time=Date.parse(slot.publishedAt);
  const before=publishForum(forum,chapters,time-1), at=publishForum(forum,chapters,time);
  for(const id of threadIds){
    const thread=threads.get(id);
    assert.equal(thread?.publishedAt,slot.publishedAt,`Scheduled thread time: ${id}`);
    assert(!before.threads.some(t=>t.id===id),'Future thread hidden');
    assert(!before.comments.some(c=>c.entryId===id),'Future thread replies hidden');
    assert(!JSON.stringify(before).includes(thread.body),'Future thread body private');
    assert(at.threads.some(t=>t.id===id),'Thread appears at exact publication time');
  }
  for(const id of commentIds){
    const comment=comments.get(id);
    assert.equal(comment?.publishedAt,slot.publishedAt,`Scheduled reply time: ${id}`);
    assert(!before.comments.some(c=>c.id===id),'Future reply hidden');
    assert(!JSON.stringify(before).includes(comment.body),'Future reply body private');
    assert(at.comments.some(c=>c.id===id),'Reply appears at exact publication time');
  }
}
console.log(`Forum valid: ${threads.size} threads, ${comments.size} comments, complete chapter coverage, valid replies/votes/awards, publication boundaries.`);
