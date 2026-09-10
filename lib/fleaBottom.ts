import { getCommunitySnapshot } from "@/lib/communityStore";
import type { GutterUser, GutterComment } from "@/lib/communityTypes";
export type { GutterUser, GutterComment } from "@/lib/communityTypes";
import characters from "@/data/characters/characters.json";
import worldDate from "@/data/worldDate.json";
import institutions from "@/data/gutter-institutions.json";
import { computeAge } from "@/lib/age";
import { groupCommentThreads } from "@/lib/commentThreads";

export const gutterUserMap = { get: (id: string) => getCommunitySnapshot().users.find((user) => user.id === id) };
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
  return groupCommentThreads(comments).map(({ comment, replies }) => {
    return { comment, replies, pinned: isCharacterComment(comment) || replies.some(isCharacterComment) };
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned));
}
export function getGutterUserStats(authorId: string) {
  const comments = getCommunitySnapshot().comments.filter((comment) => comment.authorId === authorId);
  return { comments: comments.length, posts: new Set(comments.map((comment) => comment.entryId)).size };
}

export function getGutterComments(entryId: string): GutterComment[] {
  return getCommunitySnapshot().comments.filter((comment) => comment.entryId === entryId);
}

export function isGutterEntry(entry: { category?: string; src: string }) {
  return Boolean(entry.src);
}
