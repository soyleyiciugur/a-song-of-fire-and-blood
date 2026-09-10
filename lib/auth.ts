import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";

export const getCurrentUser = cache(async () => (await (await createClient()).auth.getUser()).data.user ?? null);
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser(); if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (data) return data;
  const { data: repaired } = await supabase.rpc("ensure_own_profile");
  return repaired ?? null;
});
export const isAdmin = (role?: UserRole | null) => role === "admin";
export const isModerator = (role?: UserRole | null) => role === "moderator";
export const canModerate = (role?: UserRole | null) => isAdmin(role) || isModerator(role);
