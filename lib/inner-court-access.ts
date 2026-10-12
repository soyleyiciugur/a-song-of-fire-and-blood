import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";

export async function getInnerCourtAccess(characterId: string) {
  const [profile, supabase] = await Promise.all([getCurrentProfile(), createClient()]);
  const { data: assignment } = await supabase.from("character_player_assignments").select("player_username").eq("character_id", characterId).maybeSingle();
  const canEdit = Boolean(profile && assignment && profile.username.toLowerCase() === assignment.player_username.toLowerCase());
  return { profile, supabase, assignment, canEdit };
}
