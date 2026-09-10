import type { GutterComment } from "./communityTypes";

/** Keep nested replies together, including replies whose parent was removed. */
export function groupCommentThreads(comments: GutterComment[]) {
  const ids = new Set(comments.map(c => c.id));
  const children = new Map<string, GutterComment[]>();
  comments.forEach(c => { if (c.parentId) children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]); });
  const roots = comments.filter(c => !c.parentId || !ids.has(c.parentId));
  const seen = new Set<string>();
  const threads: { comment: GutterComment; replies: GutterComment[] }[] = [];
  for (const root of [...roots, ...comments]) {
    if (seen.has(root.id)) continue;
    seen.add(root.id);
    const replies: GutterComment[] = [], stack = [...(children.get(root.id) ?? [])].reverse();
    while (stack.length) {
      const reply = stack.pop()!;
      if (seen.has(reply.id)) continue;
      seen.add(reply.id); replies.push(reply);
      stack.push(...[...(children.get(reply.id) ?? [])].reverse());
    }
    threads.push({ comment: root, replies });
  }
  return threads;
}
