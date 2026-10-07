import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { spectatorSnapshot } from "@/lib/the-great-game/spectator";
import type { GameState } from "@/lib/the-great-game/types";

export async function GET(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to watch a friend's table." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("match") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid table." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "The table is unavailable." }, { status: 503 });
  const { data: match, error } = await admin.from("great_game_matches").select("id,host_id,guest_id,status,version,state").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "The table could not be loaded." }, { status: 503 });
  if (!match || !match.guest_id || !match.state || !["active", "finished"].includes(match.status)) return NextResponse.json({ error: "There is no game to watch at this table." }, { status: 404 });
  const participants = [match.host_id, match.guest_id];
  if (!participants.includes(user.id)) {
    const { data: rows, error } = await client.from("member_friendships").select("requester_id,recipient_id").not("accepted_at", "is", null).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    if (error) return NextResponse.json({ error: "The guest list could not be checked." }, { status: 503 });
    const friendIds = (rows ?? []).map(row => row.requester_id === user.id ? row.recipient_id : row.requester_id);
    if (!participants.some(id => friendIds.includes(id))) return NextResponse.json({ error: "Only friends of a seated player may watch this table." }, { status: 403 });
    const { data: blocks, error: blockError } = await admin.from("direct_raven_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${user.id},blocked_id.in.(${participants.join(",")})),and(blocked_id.eq.${user.id},blocker_id.in.(${participants.join(",")}))`);
    if (blockError || blocks?.length) return NextResponse.json({ error: "This table is closed to spectators." }, { status: 403 });
  }
  const { data: profiles, error: profileError } = await client.from("profiles").select("id,username,display_name").in("id", participants);
  if (profileError) return NextResponse.json({ error: "The players could not be loaded." }, { status: 503 });
  const name = (id: string) => { const p = profiles?.find(profile => profile.id === id); return p?.display_name || p?.username || "Player"; };
  return NextResponse.json({ id: match.id, status: match.status, version: match.version, host: name(match.host_id), guest: name(match.guest_id), state: spectatorSnapshot(match.state as GameState) }, { headers: { "Cache-Control": "private, no-store" } });
}
