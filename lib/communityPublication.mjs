// Pure publication boundary. Only the server imports the private source data.
export function publishCommunity(data, updates, now = Date.now()) {
  const due = (item) => Number.isFinite(Date.parse(item.publishedAt)) && Date.parse(item.publishedAt) <= now;
  const roots = new Set(data.comments.filter((comment) => comment.parentId === null && due(comment)).map((comment) => comment.id));
  const comments = data.comments.filter((comment) => due(comment) && (comment.parentId === null || roots.has(comment.parentId)));
  const users = data.users.map(({ id, username, kind, bio, avatar, color, displayName, pronouns, location, current, account, friendIds = [] }) => ({
    id, username, kind, bio, avatar, color, displayName, pronouns, location, current, account, friendCount: friendIds.length,
  }));
  return {
    users,
    comments: comments.map(({ id, entryId, authorId, parentId, body, publishedAt }) => ({ id, entryId, authorId, parentId, body, publishedAt })),
    updates: updates.filter(due).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)),
    serverTime: new Date(now).toISOString(),
  };
}
