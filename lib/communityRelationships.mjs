// Relationship history is private authoring data. Only mutual friendships are public.
export function communityFriendships(data, now = Date.now()) {
  const friends = new Map(data.users.map(user => [user.id, new Set()]));
  for (const relationship of data.relationships ?? []) {
    const current = relationship.history.filter(event => Date.parse(event.at) <= now)
      .sort((a,b) => Date.parse(b.at)-Date.parse(a.at))[0];
    if (!current || !['friends','friendly-banter'].includes(current.kind)) continue;
    const [a,b] = relationship.users;
    if (a !== b && friends.has(a) && friends.has(b)) {
      friends.get(a).add(b);
      friends.get(b).add(a);
    }
  }
  return new Map([...friends].map(([id, ids]) => [id, [...ids].sort()]));
}
