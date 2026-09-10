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
  friendIds?: string[];
  current?: { label: "Reading" | "Watching" | "Playing" | "On repeat" | "Making"; value: string };
  account?: { type: "character"; characterId: string } | { type: "institution"; institutionId: string };
}

export interface GutterComment {
  surface?: 'forum';
  upvotes?: number;
  hasocash?: number;
  moderation?: {rule:string; targetCommentId:string};
  id: string;
  entryId: string;
  authorId: string;
  parentId: string | null;
  body: string;
  publishedAt: string;
}

export interface CommunityUpdate {
  dateOnly?: boolean;
  items?: string[];
  id: string;
  publishedAt: string;
  title: string;
  body: string;
}

export interface CommunitySnapshot {
  forumThreads: ForumThread[];
  users: GutterUser[];
  comments: GutterComment[];
  updates: CommunityUpdate[];
  serverTime: string;
}

export interface ForumThread {
  id: string;
  chapterSlug: string | null;
  chapterTitle: string | null;
  spoilerThrough: string;
  title: string;
  category: string;
  authorId: string;
  body: string;
  publishedAt: string;
}

export interface ForumSource {
  threads: Array<Omit<ForumThread, 'title' | 'chapterTitle'> & {title:string|null}>;
  comments: Array<GutterComment & {upvoterIds:string[]; awards:Array<{fromUserId:string;amount:number}>}>;
}
