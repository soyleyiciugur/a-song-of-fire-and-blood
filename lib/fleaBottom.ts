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
for (const comment of gutterComments) {
  const thread = threads.get(comment.entryId) ?? [];
  thread.push(comment);
  threads.set(comment.entryId, thread);
}

export function getGutterComments(entryId: string): GutterComment[] {
  return threads.get(entryId) ?? [];
}

export function isGutterEntry(entry: { category?: string; src: string }) {
  return entry.category === "fleabottom" || /\.(mp4|webm|mov)$/i.test(entry.src.split(/[?#]/)[0]);
}
