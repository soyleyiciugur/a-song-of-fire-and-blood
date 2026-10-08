import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function authorizeTableViewer(id: string) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to watch a friend's table." }, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Invalid table." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "The table is unavailable." }, { status: 503 });
  const { data: match, error } = await admin.from("great_game_matches").select("id,code,host_id,guest_id,status,version,state,created_at,updated_at,completed_at").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "The table could not be loaded." }, { status: 503 });
  if (!match || !match.guest_id || !match.state || !["active", "finished", "abandoned"].includes(match.status)) return NextResponse.json({ error: "There is no game to watch at this table." }, { status: 404 });
  const participants = [match.host_id, match.guest_id];
  if (!participants.includes(user.id)) {
    const { data: rows, error } = await client.from("member_friendships").select("requester_id,recipient_id").not("accepted_at", "is", null).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);
    if (error) return NextResponse.json({ error: "The guest list could not be checked." }, { status: 503 });
    const friendIds = (rows ?? []).map(row => row.requester_id === user.id ? row.recipient_id : row.requester_id);
    if (!participants.some(id => friendIds.includes(id))) return NextResponse.json({ error: "Only friends of a seated player may watch this table." }, { status: 403 });
    const { data: blocks, error: blockError } = await admin.from("direct_raven_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${user.id},blocked_id.in.(${participants.join(",")})),and(blocked_id.eq.${user.id},blocker_id.in.(${participants.join(",")}))`);
    if (blockError || blocks?.length) return NextResponse.json({ error: "This table is closed to spectators." }, { status: 403 });
  }

return {client,admin,match,user,participants};
}