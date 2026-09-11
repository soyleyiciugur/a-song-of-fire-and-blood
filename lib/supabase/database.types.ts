export type UserRole = "member" | "moderator" | "admin";
export type AuthorType = "user" | "character" | "legacy";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  affinity?: Record<string,string>;
  profile_theme?: string;
  banner_url?: string | null;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}


export interface DirectRavenConversation {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  updated_at: string;
}

export interface DirectRavenMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  gif?: {id:string;url:string;title:string}|null;
  attachment_path?: string | null;
  reply_to?: string | null;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface DirectRavenRead {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
}

export interface DirectRavenBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at" | "role"> & Partial<Pick<Profile, "created_at" | "updated_at" | "role">>; Update: Partial<Pick<Profile, "affinity" | "profile_theme" | "display_name" | "avatar_url" | "banner_url" | "bio" | "updated_at">>; Relationships: [] };
      forum_threads: { Row: { id:string; title:string; body:string; category:string; chapter_slug:string|null; spoiler_through:string|null; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_locked:boolean; is_pinned:boolean; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; title:string; body:string; category?:string; chapter_slug?:string|null; spoiler_through?:string|null; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_locked?:boolean; is_pinned?:boolean; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_threads"]["Insert"]>; Relationships: [] };
      forum_posts: { Row: { id:string; thread_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; thread_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_posts"]["Insert"]>; Relationships: [] };
      raven_comments: { Row: { id:string; entry_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; entry_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["raven_comments"]["Insert"]>; Relationships: [] };
      direct_raven_conversations: { Row: DirectRavenConversation; Insert: Omit<DirectRavenConversation, "id" | "created_at" | "updated_at"> & Partial<Pick<DirectRavenConversation, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<DirectRavenConversation, "updated_at">>; Relationships: [] };
      direct_raven_messages: { Row: DirectRavenMessage; Insert: Pick<DirectRavenMessage, "conversation_id" | "sender_id" | "body"> & Partial<Pick<DirectRavenMessage, "id" | "created_at" | "edited_at" | "deleted_at" | "attachment_path" | "reply_to" | "gif">>; Update: Partial<Pick<DirectRavenMessage, "body" | "edited_at" | "deleted_at">>; Relationships: [] };
      direct_raven_reads: { Row: DirectRavenRead; Insert: DirectRavenRead; Update: Pick<DirectRavenRead, "last_read_at">; Relationships: [] };
      direct_raven_blocks: { Row: DirectRavenBlock; Insert: Omit<DirectRavenBlock, "created_at"> & Partial<Pick<DirectRavenBlock, "created_at">>; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_own_profile: { Args: Record<string, never>; Returns: Profile };
      start_direct_raven: { Args: { target_username: string }; Returns: string };
      direct_raven_summaries: { Args: Record<string, never>; Returns: { conversation_id: string; last_message: DirectRavenMessage | null; unread: number }[] };
      member_like_counts: { Args: { kind: string; targets: string[] }; Returns: { target_id: string; total: number; liked: boolean }[] };
      direct_raven_unread_count: { Args: Record<string, never>; Returns: number };
      is_direct_raven_participant: { Args: { conversation_uuid: string }; Returns: boolean };
      can_send_direct_raven: { Args: { conversation_uuid: string }; Returns: boolean };
    };
    Enums: { user_role: UserRole; content_author_type: AuthorType };
    CompositeTypes: Record<string, never>;
  };
}
