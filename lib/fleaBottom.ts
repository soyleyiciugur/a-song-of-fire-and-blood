import community from "@/data/flea-bottom.json";
import characters from "@/data/characters/characters.json";
import worldDate from "@/data/worldDate.json";
import institutions from "@/data/gutter-institutions.json";
import { computeAge } from "@/lib/age";

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
  account?: { type: "character"; characterId: string } | { type: "institution"; institutionId: string };
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
const characterMap = new Map(characters.map((character) => [character.id, character]));
const institutionMap = new Map(institutions.map((institution) => [institution.id, institution]));

export function getGutterIdentity(user: GutterUser) {
  if (user.kind !== "fictional" || !user.account) return null;
  if (user.account.type === "character") {
    const character = characterMap.get(user.account.characterId);
    if (!character) return null;
    return {
      type: "character" as const,
      name: character.name,
      href: `/characters/${character.id}`,
      age: character.nameday ? computeAge(character.nameday, worldDate) : null,
    };
  }
  const institution = institutionMap.get(user.account.institutionId);
  return institution ? { type: "institution" as const, name: institution.name, href: null, age: null } : null;
}

export function isCharacterComment(comment: GutterComment) {
  const user = gutterUserMap.get(comment.authorId);
  return !!user && getGutterIdentity(user)?.type === "character";
}

export function getGutterThreads(entryId: string) {
  const comments = getGutterComments(entryId);
  return comments.filter((comment) => comment.parentId === null).map((comment) => {
    const replies = comments.filter((reply) => reply.parentId === comment.id);
    return { comment, replies, pinned: isCharacterComment(comment) || replies.some(isCharacterComment) };
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned));
}
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
