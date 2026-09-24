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
  played_character_id?: string | null;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReadingProgressRow {
  user_id: string;
  chapter_slug: string;
  page_index: number;
  updated_at: string;
}

export interface CharacterInnerCourtRow {
  id: string;
  character_id: string;
  chapter_slug: string;
  kind: "thought" | "suspicion" | "preference" | "belief" | "theory" | "question";
  subject: string | null;
  body: string;
  status: "active" | "changed" | "resolved";
  supersedes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

export interface CharacterPlayerAssignmentRow {
  character_id: string;
  player_username: string;
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

export interface DirectRavenPresence {
  conversation_id: string;
  user_id: string;
  active_until: string;
  updated_at: string;
}

export interface DirectRavenPagePresence {
  user_id: string;
  active_until: string;
  updated_at: string;
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

export type PrivateLedgerReplacement = Omit<PrivateLedgerEntry, "id" | "user_id" | "created_at" | "updated_at"> & Partial<Pick<PrivateLedgerEntry, "created_at" | "updated_at">>;

export interface DirectRavenBlock {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface GreatGameMatchRow {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  host_deck: unknown;
  guest_deck: unknown | null;
  state: unknown | null;
  status: "waiting" | "active" | "finished" | "abandoned";
  version: number;
  winner_user_id: string | null;
  abandoned_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface GreatGameEventRow {
  id: number;
  match_id: string;
  version: number;
  event_type: "joined" | "state" | "left";
  detail: Record<string, unknown>;
  created_at: string;
}

export interface GreatGamePlayerStatsRow {
  user_id: string;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  abandons: number;
  win_rate: number;
  current_win_streak: number;
  longest_win_streak: number;
  average_duration_seconds: number;
  average_turns: number;
  last_played_at: string | null;
}

export interface GreatGameDeckStatsRow { user_id:string; deck_name:string; faction:string; games_played:number; wins:number; losses:number; abandons:number; win_rate:number }
export interface GreatGameHeadToHeadRow { user_id:string; opponent_id:string; opponent_username:string; opponent_display_name:string; games_played:number; wins:number; losses:number; abandons:number; last_played_at:string }
export interface GreatGameHistoryRow { match_id:string; user_id:string; opponent_id:string; opponent_username:string; opponent_display_name:string; opponent_avatar_url:string|null; result:"win"|"loss"|"draw"|"abandon"; deck_name:string; faction:string; duration_seconds:number; turns:number; rating_before:number; rating_after:number; completed_at:string }
export interface GreatGameLeaderboardRow { rank:number; user_id:string; username:string; display_name:string; avatar_url:string|null; rating:number; peak_rating:number; rated_games:number; games_played:number; wins:number; losses:number; abandons:number; win_rate:number; current_win_streak:number }

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at" | "role"> & Partial<Pick<Profile, "created_at" | "updated_at" | "role">>; Update: Partial<Pick<Profile, "affinity" | "profile_theme" | "display_name" | "avatar_url" | "banner_url" | "bio" | "notification_last_seen_at" | "played_character_id" | "updated_at">>; Relationships: [] };
      character_inner_court: { Row: CharacterInnerCourtRow; Insert: Pick<CharacterInnerCourtRow, "character_id" | "chapter_slug" | "kind" | "body"> & Partial<Omit<CharacterInnerCourtRow, "character_id" | "chapter_slug" | "kind" | "body">>; Update: Partial<Pick<CharacterInnerCourtRow, "chapter_slug" | "kind" | "subject" | "body" | "status" | "supersedes" | "sort_order" | "updated_at">>; Relationships: [] };
      character_player_assignments: { Row: CharacterPlayerAssignmentRow; Insert: Pick<CharacterPlayerAssignmentRow, "character_id" | "player_username"> & Partial<Pick<CharacterPlayerAssignmentRow, "updated_at">>; Update: Partial<Pick<CharacterPlayerAssignmentRow, "player_username" | "updated_at">>; Relationships: [] };
      forum_threads: { Row: { id:string; title:string; body:string; category:string; chapter_slug:string|null; spoiler_through:string|null; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_locked:boolean; is_pinned:boolean; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; title:string; body:string; category?:string; chapter_slug?:string|null; spoiler_through?:string|null; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_locked?:boolean; is_pinned?:boolean; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_threads"]["Insert"]>; Relationships: [] };
      forum_posts: { Row: { id:string; thread_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; thread_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_posts"]["Insert"]>; Relationships: [] };
      raven_comments: { Row: { id:string; entry_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; entry_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["raven_comments"]["Insert"]>; Relationships: [] };
      direct_raven_conversations: { Row: DirectRavenConversation; Insert: Omit<DirectRavenConversation, "id" | "created_at" | "updated_at"> & Partial<Pick<DirectRavenConversation, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<DirectRavenConversation, "title" | "description" | "avatar_path" | "owner_id" | "updated_at">>; Relationships: [] };
      direct_raven_members: { Row: DirectRavenMember; Insert: Omit<DirectRavenMember, "joined_at"> & Partial<Pick<DirectRavenMember, "joined_at">>; Update: Partial<Pick<DirectRavenMember, "role">>; Relationships: [] };
      direct_raven_messages: { Row: DirectRavenMessage; Insert: Pick<DirectRavenMessage, "conversation_id" | "sender_id" | "body"> & Partial<Pick<DirectRavenMessage, "id" | "created_at" | "edited_at" | "deleted_at" | "attachment_path" | "reply_to" | "gif">>; Update: Partial<Pick<DirectRavenMessage, "body" | "edited_at" | "deleted_at">>; Relationships: [] };
      direct_raven_system_events: { Row: DirectRavenSystemEvent; Insert: Omit<DirectRavenSystemEvent, "id" | "created_at"> & Partial<Pick<DirectRavenSystemEvent, "id" | "created_at">>; Update: never; Relationships: [] };
      direct_raven_reads: { Row: DirectRavenRead; Insert: DirectRavenRead; Update: Pick<DirectRavenRead, "last_read_at">; Relationships: [] };
      direct_raven_presence: { Row: DirectRavenPresence; Insert: DirectRavenPresence; Update: Partial<Pick<DirectRavenPresence, "active_until" | "updated_at">>; Relationships: [] };
      direct_raven_page_presence: { Row: DirectRavenPagePresence; Insert: DirectRavenPagePresence; Update: Partial<Pick<DirectRavenPagePresence, "active_until" | "updated_at">>; Relationships: [] };
      direct_raven_blocks: { Row: DirectRavenBlock; Insert: Omit<DirectRavenBlock, "created_at"> & Partial<Pick<DirectRavenBlock, "created_at">>; Update: never; Relationships: [] };
      push_subscriptions: { Row: PushSubscription; Insert: Omit<PushSubscription, "id" | "created_at" | "updated_at"> & Partial<Pick<PushSubscription, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<PushSubscription, "p256dh" | "auth" | "user_agent" | "updated_at">>; Relationships: [] };
      notification_preferences: { Row: NotificationPreferencesRow; Insert: Pick<NotificationPreferencesRow, "user_id"> & Partial<Omit<NotificationPreferencesRow, "user_id">>; Update: Partial<Pick<NotificationPreferencesRow, "mascot_mode" | "preferences" | "last_mascot" | "mascot_streak" | "mara_count" | "aldren_count" | "last_variants" | "updated_at">>; Relationships: [] };
      site_notifications: { Row: SiteNotificationRow; Insert: Omit<SiteNotificationRow, "id" | "created_at" | "read_at"> & Partial<Pick<SiteNotificationRow, "id" | "created_at" | "read_at" | "dedupe_key">>; Update: Partial<Pick<SiteNotificationRow, "read_at">>; Relationships: [] };
      private_ledger_entries: { Row: PrivateLedgerEntry; Insert: Omit<PrivateLedgerEntry, "id" | "created_at" | "updated_at"> & Partial<Pick<PrivateLedgerEntry, "id" | "created_at" | "updated_at">>; Update: Partial<Pick<PrivateLedgerEntry, "heading" | "matter" | "checklist" | "pinned" | "status" | "archived" | "character_ids" | "chapter_slug" | "updated_at">>; Relationships: [] };
      great_game_matches: { Row: GreatGameMatchRow; Insert: Partial<GreatGameMatchRow> & Pick<GreatGameMatchRow, "code" | "host_id" | "host_deck">; Update: Partial<GreatGameMatchRow>; Relationships: [] };
      great_game_events: { Row: GreatGameEventRow; Insert: Omit<GreatGameEventRow, "id" | "created_at"> & Partial<Pick<GreatGameEventRow, "id" | "created_at">>; Update: never; Relationships: [] };
    };
    Views: {
      great_game_player_stats: { Row: GreatGamePlayerStatsRow; Relationships: [] };
      great_game_deck_stats: { Row: GreatGameDeckStatsRow; Relationships: [] };
      great_game_head_to_head: { Row: GreatGameHeadToHeadRow; Relationships: [] };
      great_game_match_history: { Row: GreatGameHistoryRow; Relationships: [] };
      great_game_leaderboard: { Row: GreatGameLeaderboardRow; Relationships: [] };
    };
    Functions: {
      ensure_own_profile: { Args: Record<string, never>; Returns: Profile };
      replace_private_ledger_entries: { Args: { replacement: PrivateLedgerReplacement[] }; Returns: number };
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
      set_message_reaction: { Args: { target: string; reaction: string }; Returns: string | null };
      is_great_game_participant: { Args: { match_uuid: string }; Returns: boolean };
    };
    Enums: { user_role: UserRole; content_author_type: AuthorType };
    CompositeTypes: Record<string, never>;
  };
}
