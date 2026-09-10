// Pure publication boundary. Only the server imports the private source data.
import { communityFriendships } from './communityRelationships.mjs';
import { publishForum } from './forumPublication.mjs';
/**
 * @param {import('./communityTypes').ForumSource} [forum]
 * @param {Array<{slug:string,title:string}>} [chapters]
 */
export function publishCommunity(data, updates, now = Date.now(), forum = {threads:[],comments:[]}, chapters = []) {
  const publishedForum = publishForum(forum, chapters, now);
  const friendships = communityFriendships(data, now);
  const due = (item) => Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt) <= now;
  const roots = new Set(data.comments.filter((comment) => comment.parentId === null && due(comment)).map((comment) => comment.id));
  const comments = data.comments.filter((comment) => due(comment) && (comment.parentId === null || roots.has(comment.parentId) || (comment.parentSource === 'supabase' && comment.parentId)));
  const users = data.users.map(({ id, username, kind, bio, avatar, color, displayName, pronouns, location, current, account }) => ({
    id, username, kind, bio, avatar, color, displayName, pronouns, location, current, account, friendIds: friendships.get(id) ?? [], friendCount: friendships.get(id)?.length ?? 0,
  }));
  return {
    users,
    comments: [...comments.map(({ id, entryId, authorId, parentId, body, publishedAt, parentSource }) => ({ id, entryId, authorId, parentId, body, publishedAt, parentSource })),...publishedForum.comments],
    forumThreads: publishedForum.threads,
    updates: updates.map(({ date, items }) => ({
      id: `site-updates-${date}`,
      publishedAt: `${date}T00:00:00+03:00`,
      dateOnly: true,
      title: 'Site updates',
      body: '',
      items,
    })).filter(due).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
    serverTime: new Date(now).toISOString(),
  };
}
