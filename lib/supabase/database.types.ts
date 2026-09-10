export type UserRole = "member" | "moderator" | "admin";
export type AuthorType = "user" | "character" | "legacy";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at" | "role"> & Partial<Pick<Profile, "created_at" | "updated_at" | "role">>; Update: Partial<Pick<Profile, "display_name" | "avatar_url" | "bio" | "updated_at">>; Relationships: [] };
      forum_threads: { Row: { id:string; title:string; body:string; category:string; chapter_slug:string|null; spoiler_through:string|null; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_locked:boolean; is_pinned:boolean; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; title:string; body:string; category?:string; chapter_slug?:string|null; spoiler_through?:string|null; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_locked?:boolean; is_pinned?:boolean; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_threads"]["Insert"]>; Relationships: [] };
      forum_posts: { Row: { id:string; thread_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; thread_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["forum_posts"]["Insert"]>; Relationships: [] };
      raven_comments: { Row: { id:string; entry_id:string; parent_id:string|null; body:string; author_type:AuthorType; user_author_id:string|null; character_id:string|null; legacy_author_id:string|null; is_visible:boolean; created_at:string; updated_at:string }; Insert: { id?:string; entry_id:string; parent_id?:string|null; body:string; author_type?:AuthorType; user_author_id?:string|null; character_id?:string|null; legacy_author_id?:string|null; is_visible?:boolean; created_at?:string; updated_at?:string }; Update: Partial<Database["public"]["Tables"]["raven_comments"]["Insert"]>; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { user_role: UserRole; content_author_type: AuthorType };
    CompositeTypes: Record<string, never>;
  };
}
