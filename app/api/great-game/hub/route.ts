import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to take your seat." }, { status: 401 });
  const [profile, friendships, ranking, history] = await Promise.all([
    client.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single(),
    client.from("member_friendships").select("requester_id,recipient_id").not("accepted_at", "is", null).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`),
    client.from("great_game_leaderboard").select("*").eq("user_id", user.id).maybeSingle(),
    client.from("great_game_match_history").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (profile.error || friendships.error) return NextResponse.json({ error: "The inn's ledger could not be opened. Try again." }, { status: 503 });
  const ids = (friendships.data ?? []).map(row => row.requester_id === user.id ? row.recipient_id : row.requester_id);
  const friends = ids.length ? await client.from("profiles").select("id,username,display_name,avatar_url").in("id", ids) : { data: [], error: null };
  if (friends.error) return NextResponse.json({ error: "Friends could not be loaded." }, { status: 503 });
  const admin = createAdminClient();
  // Only reveal a table ID for accepted friends, never its join code or private zones.
  const matches = ids.length && admin ? await admin.from("great_game_matches").select("id,host_id,guest_id").eq("status", "active").or(`host_id.in.(${ids.join(",")}),guest_id.in.(${ids.join(",")})`).order("updated_at", { ascending: false }).limit(100) : { data: [], error: null };
  // Optional table/rank services must not hide the member's accepted friends.
  return NextResponse.json({ profile: profile.data, ranking: ranking.data, lastMatch: history.data,
    friends: (friends.data ?? []).map(friend => ({ ...friend, matchId: matches.data?.find(match => match.host_id === friend.id || match.guest_id === friend.id)?.id ?? null })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
