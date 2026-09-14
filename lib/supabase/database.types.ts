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
  notification_last_seen_at?: string | null;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}


export type DirectRavenConversationKind = "raven" | "guild";

export interface DirectRavenConversation {
  id: string;
  user_a: string | null;
  user_b: string | null;
  kind: DirectRavenConversationKind;
  title: string | null;
  description: string | null;
  avatar_path: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectRavenMember {
  conversation_id: string;
  user_id: string;
  role: "guildmaster" | "member";
  joined_at: string;
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


export interface DirectRavenSystemEvent {
  id: string;
  conversation_id: string;
  event_type: "member_added" | "member_removed" | "details_changed";
  actor_id: string | null;
  target_user_id: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface DirectRavenRead {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}


export interface NotificationPreferencesRow {
  user_id: string;
  mascot_mode: "balanced" | "mara" | "aldren";
  preferences: Record<string, boolean>;
  last_mascot: "mara" | "aldren" | null;
  mascot_streak: number;
  mara_count: number;
  aldren_count: number;
  last_variants: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface SiteNotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: string;
  source: string;
  mascot: "mara" | "aldren";
  title: string;
  body: string;
  href: string;
  source_label: string | null;
  context: Record<string, unknown>;
  dedupe_key: string | null;
  created_at: string;
  read_at: string | null;
}


export interface LedgerChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface PrivateLedgerEntry {
  id: string;
  user_id: string;
  heading: string;
  matter: string;
  checklist: LedgerChecklistItem[];
  pinned: boolean;
  status: "open" | "settled";
  archived: boolean;
  character_ids: string[];
  chapter_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface DirectRavenBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at" | "role"> & Partial<Pick<Profile, "created_at" | "updated_at" | "role">>; Update: Partial<Pick<Profile, "affinity" | "profile_theme" | "display_name" | "avatar_url" | "banner_url" | "bio" | "notification_last_seen_at" | "updated_at">>; Relationships: [] };
      forum_threads: { Row: { id:string; title:string; body:string; category:string; chapter_slug:string|null; spoiler_through:string|null; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_locked:boolean; is_pinned:boolean; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; title:string; body:string; category?:string; chapter_slug?:string|null; spoiler_through?:string|null; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_locked?:boolean; is_pinned?:boolean; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_threads"]["Insert"]>; Relationships: [] };
      forum_posts: { Row: { id:string; thread_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; thread_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_posts"]["Insert"]>; Relationships: [] };
      raven_comments: { Row: { id:string; entry_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; entry_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["raven_comments"]["Insert"]>; Relationships: [] };
      direct_raven_conversations: { Row: DirectRavenConversation; Insert: Omit<DirectRavenConversation, "id" | "created_at" | "updated_at"> & Partial<Pick<DirectRavenConversation, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<DirectRavenConversation, "title" | "description" | "avatar_path" | "owner_id" | "updated_at">>; Relationships: [] };
      direct_raven_members: { Row: DirectRavenMember; Insert: Omit<DirectRavenMember, "joined_at"> & Partial<Pick<DirectRavenMember, "joined_at">>; Update: Partial<Pick<DirectRavenMember, "role">>; Relationships: [] };
      direct_raven_messages: { Row: DirectRavenMessage; Insert: Pick<DirectRavenMessage, "conversation_id" | "sender_id" | "body"> & Partial<Pick<DirectRavenMessage, "id" | "created_at" | "edited_at" | "deleted_at" | "attachment_path" | "reply_to" | "gif">>; Update: Partial<Pick<DirectRavenMessage, "body" | "edited_at" | "deleted_at">>; Relationships: [] };
      direct_raven_system_events: { Row: DirectRavenSystemEvent; Insert: Omit<DirectRavenSystemEvent, "id" | "created_at"> & Partial<Pick<DirectRavenSystemEvent, "id" | "created_at">>; Update: never; Relationships: [] };
      direct_raven_reads: { Row: DirectRavenRead; Insert: DirectRavenRead; Update: Pick<DirectRavenRead, "last_read_at">; Relationships: [] };
      direct_raven_blocks: { Row: DirectRavenBlock; Insert: Omit<DirectRavenBlock, "created_at"> & Partial<Pick<DirectRavenBlock, "created_at">>; Update: never; Relationships: [] };
      push_subscriptions: { Row: PushSubscription; Insert: Omit<PushSubscription, "id" | "created_at" | "updated_at"> & Partial<Pick<PushSubscription, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<PushSubscription, "p256dh" | "auth" | "user_agent" | "updated_at">>; Relationships: [] };
      notification_preferences: { Row: NotificationPreferencesRow; Insert: Pick<NotificationPreferencesRow, "user_id"> & Partial<Omit<NotificationPreferencesRow, "user_id">>; Update: Partial<Pick<NotificationPreferencesRow, "mascot_mode" | "preferences" | "last_mascot" | "mascot_streak" | "mara_count" | "aldren_count" | "last_variants" | "updated_at">>; Relationships: [] };
      site_notifications: { Row: SiteNotificationRow; Insert: Omit<SiteNotificationRow, "id" | "created_at" | "read_at"> & Partial<Pick<SiteNotificationRow, "id" | "created_at" | "read_at" | "dedupe_key">>; Update: Partial<Pick<SiteNotificationRow, "read_at">>; Relationships: [] };
      private_ledger_entries: { Row: PrivateLedgerEntry; Insert: Omit<PrivateLedgerEntry, "id" | "created_at" | "updated_at"> & Partial<Pick<PrivateLedgerEntry, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<PrivateLedgerEntry, "heading" | "matter" | "checklist" | "pinned" | "status" | "archived" | "character_ids" | "chapter_slug" | "updated_at">>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_own_profile: { Args: Record<string, never>; Returns: Profile };
      start_direct_raven: { Args: { target_username: string }; Returns: string };
      create_guild_parley: { Args: { guild_name: string; guild_description: string; member_ids: string[] }; Returns: string };
      update_guild_parley: { Args: { conversation_uuid: string; guild_name: string; guild_description: string; guild_avatar_path: string }; Returns: undefined };
      add_guild_member: { Args: { conversation_uuid: string; target_username: string }; Returns: string };
      remove_guild_member: { Args: { conversation_uuid: string; target_user: string }; Returns: undefined };
      leave_guild_parley: { Args: { conversation_uuid: string }; Returns: undefined };
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
