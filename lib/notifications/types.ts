export type NotificationMascot = "mara" | "aldren";

export type NotificationSource =
  | "tavern"
  | "ravens-eye"
  | "direct-raven"
  | "guild-parley"
  | "chronicle"
  | "realm";

export type NotificationPreferenceKey =
  | "tavern_answers"
  | "tavern_favor"
  | "ravens_eye_answers"
  | "ravens_eye_likes"
  | "direct_ravens"
  | "guild_parley"
  | "ravens_eye_images"
  | "gutter_memes"
  | "gutter_reels"
  | "new_chapters"
  | "realm_notices";

export type NotificationKind =
  | "tavern_answer"
  | "tavern_favor"
  | "ravens_eye_answer"
  | "ravens_eye_like"
  | "direct_raven"
  | "guild_parley"
  | "ravens_eye_image"
  | "gutter_meme"
  | "gutter_reel"
  | "new_chapter"
  | "realm_notice";

export type MascotMode = "balanced" | "mara" | "aldren";

export type NotificationCopy = {
  title: string;
  body: string;
};

export type NotificationPreferenceFlags = Record<NotificationPreferenceKey, boolean>;

export type NotificationPreferences = {
  user_id: string;
  mascot_mode: MascotMode;
  preferences: NotificationPreferenceFlags;
  last_mascot: NotificationMascot | null;
  mascot_streak: number;
  mara_count: number;
  aldren_count: number;
  last_variants: Record<string, number>;
  created_at?: string;
  updated_at?: string;
};

export type SiteNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: NotificationKind;
  source: NotificationSource;
  mascot: NotificationMascot;
  title: string;
  body: string;
  href: string;
  source_label: string | null;
  context: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
};

export const DEFAULT_NOTIFICATION_FLAGS: NotificationPreferenceFlags = {
  tavern_answers: true,
  tavern_favor: true,
  ravens_eye_answers: true,
  ravens_eye_likes: true,
  direct_ravens: true,
  guild_parley: true,
  ravens_eye_images: true,
  gutter_memes: true,
  gutter_reels: true,
  new_chapters: true,
  realm_notices: true,
};

export const NOTIFICATION_KIND_META: Record<NotificationKind, {
  source: NotificationSource;
  preference: NotificationPreferenceKey;
  label: string;
}> = {
  tavern_answer: { source: "tavern", preference: "tavern_answers", label: "Tavern answer" },
  tavern_favor: { source: "tavern", preference: "tavern_favor", label: "Tavern Favor" },
  ravens_eye_answer: { source: "ravens-eye", preference: "ravens_eye_answers", label: "Raven's Eye answer" },
  ravens_eye_like: { source: "ravens-eye", preference: "ravens_eye_likes", label: "Raven's Eye favor" },
  direct_raven: { source: "direct-raven", preference: "direct_ravens", label: "Direct Raven" },
  guild_parley: { source: "guild-parley", preference: "guild_parley", label: "Guild Parley" },
  ravens_eye_image: { source: "ravens-eye", preference: "ravens_eye_images", label: "Raven's Eye image" },
  gutter_meme: { source: "ravens-eye", preference: "gutter_memes", label: "Gutter Meme" },
  gutter_reel: { source: "ravens-eye", preference: "gutter_reels", label: "Gutter Reel" },
  new_chapter: { source: "chronicle", preference: "new_chapters", label: "Chronicle" },
  realm_notice: { source: "realm", preference: "realm_notices", label: "Realm notice" },
};

export const MASCOT_META = {
  mara: {
    name: "Mara",
    role: "The Stoic Tapster",
    portrait: "/images/miniportraits/MaraMiniPortrait.webp",
  },
  aldren: {
    name: "Aldren",
    role: "The Courtly Innkeeper",
    portrait: "/images/miniportraits/AldrenMiniPortrait.webp",
  },
} as const;
