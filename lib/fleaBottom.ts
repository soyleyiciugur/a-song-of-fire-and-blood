import community from "@/data/flea-bottom.json";

export interface GutterUser {
  id: string;
  username: string;
  kind: "fictional" | "member";
  bio: string;
  avatar: string;
  color: string;
  voice: string;
  continuity: string[];
  fandoms?: string[];
  displayName?: string;
  pronouns?: string;
  location?: string;
  current?: { label: "Reading" | "Watching" | "Playing" | "On repeat" | "Making"; value: string };
}

export interface GutterComment {
  id: string;
  entryId: string;
  authorId: string;
  parentId: string | null;
  body: string;
}

export const gutterUsers = community.users as GutterUser[];
export const gutterComments = community.comments as GutterComment[];
export const gutterUserMap = new Map(gutterUsers.map((user) => [user.id, user]));
const threads = new Map<string, GutterComment[]>();
const authorStats = new Map<string, { comments: number; entries: Set<string> }>();
for (const comment of gutterComments) {
  const thread = threads.get(comment.entryId) ?? [];
  thread.push(comment);
  threads.set(comment.entryId, thread);
  const stats = authorStats.get(comment.authorId) ?? { comments: 0, entries: new Set<string>() };
  stats.comments += 1;
  stats.entries.add(comment.entryId);
  authorStats.set(comment.authorId, stats);
}

export function getGutterUserStats(authorId: string) {
  const stats = authorStats.get(authorId);
  return { comments: stats?.comments ?? 0, posts: stats?.entries.size ?? 0 };
}

export function getGutterComments(entryId: string): GutterComment[] {
  return threads.get(entryId) ?? [];
}

export function isGutterEntry(entry: { category?: string; src: string }) {
  return entry.category === "fleabottom" || /\.(mp4|webm|mov)$/i.test(entry.src.split(/[?#]/)[0]);
}
