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
  const visibleCommentIds = new Set();
  const comments = data.comments.filter((comment) => {
    if (!due(comment)) return false;
    const visible = comment.parentId === null
      || (comment.parentSource === 'supabase' && comment.parentId)
      || visibleCommentIds.has(comment.parentId);
    if (visible) visibleCommentIds.add(comment.id);
    return visible;
  });
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
