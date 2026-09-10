import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";

export const getCurrentUser = cache(async () => (await (await createClient()).auth.getUser()).data.user ?? null);
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser(); if (!user) return null;
  const { data } = await (await createClient()).from("profiles").select("*").eq("id", user.id).single();
  return data;
});
export const isAdmin = (role?: UserRole | null) => role === "admin";
export const isModerator = (role?: UserRole | null) => role === "moderator";
export const canModerate = (role?: UserRole | null) => isAdmin(role) || isModerator(role);
