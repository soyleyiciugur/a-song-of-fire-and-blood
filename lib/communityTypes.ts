export interface GutterUser {
  id: string;
  username: string;
  kind: "fictional" | "member";
  bio: string;
  avatar: string;
  color: string;
  displayName?: string;
  pronouns?: string;
  location?: string;
  friendCount?: number;
  current?: { label: "Reading" | "Watching" | "Playing" | "On repeat" | "Making"; value: string };
  account?: { type: "character"; characterId: string } | { type: "institution"; institutionId: string };
}

export interface GutterComment {
  id: string;
  entryId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  publishedAt: string;
}

export interface CommunityUpdate {
  id: string;
  publishedAt: string;
  title: string;
  body: string;
}

export interface CommunitySnapshot {
  users: GutterUser[];
  comments: GutterComment[];
  updates: CommunityUpdate[];
  serverTime: string;
}
