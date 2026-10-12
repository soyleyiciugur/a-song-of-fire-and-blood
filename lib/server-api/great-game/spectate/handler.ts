import { NextResponse } from "next/server";
import { authorizeTableViewer } from "@/lib/the-great-game/table-access";
import { spectatorSnapshot } from "@/lib/the-great-game/spectator";
import type { GameState } from "@/lib/the-great-game/types";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(request: Request) {
  if (!new URL(request.url).searchParams.has("match")) {
    const client = await createClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return NextResponse.json({error:"Sign in to watch a table."},{status:401});
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({error:"Tables are unavailable."},{status:503});
    const [tables, blocks] = await Promise.all([
      admin.from("great_game_matches").select("id,match_type,host_id,guest_id,updated_at").eq("status","active").not("guest_id","is",null).order("updated_at",{ascending:false}).limit(100),
      admin.from("direct_raven_blocks").select("blocker_id,blocked_id").or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`),
    ]);
    if (tables.error || blocks.error) return NextResponse.json({error:"Open tables could not be loaded."},{status:503});
    const blocked = new Set((blocks.data ?? []).map(row => row.blocker_id === user.id ? row.blocked_id : row.blocker_id));
    const visible = (tables.data ?? []).filter(row => row.host_id !== user.id && row.guest_id !== user.id && !blocked.has(row.host_id) && !blocked.has(row.guest_id!));
    const ids = [...new Set(visible.flatMap(row => [row.host_id,row.guest_id!]))];
    const profiles = ids.length ? await admin.from("profiles").select("id,username").in("id",ids) : {data:[],error:null};
    if (profiles.error) return NextResponse.json({error:"The players could not be loaded."},{status:503});
    const name = (id:string) => profiles.data?.find(profile => profile.id === id)?.username || "Player";
    return NextResponse.json({tables:visible.map(row => ({id:row.id,matchType:row.match_type,host:name(row.host_id),guest:name(row.guest_id!)}))},{headers:{"Cache-Control":"private, no-store"}});
  }
  const access = await authorizeTableViewer(new URL(request.url).searchParams.get("match") ?? "");
  if (access instanceof NextResponse) return access;
  const {client, match, user, participants} = access;
  const { data: profiles, error } = await client.from("profiles").select("id,username,display_name,avatar_url").in("id", [...participants, user.id]);
  if (error) return NextResponse.json({error:"The players could not be loaded."},{status:503});
  const identity = (id: string) => { const p = profiles?.find(p => p.id === id); return {id, username:p?.username || "player", displayName:p?.display_name || p?.username || "Player", avatarUrl:p?.avatar_url ?? null}; };
  return NextResponse.json({viewer:identity(user.id), match:{serverNow:new Date().toISOString(),id:match.id,code:match.code,matchType:match.match_type,status:match.status,version:match.version,host:identity(match.host_id),guest:identity(match.guest_id!),opponent:identity(match.guest_id!),playerId:"player1",state:spectatorSnapshot(match.state as GameState),createdAt:match.created_at,updatedAt:match.updated_at,completedAt:match.completed_at}}, {headers:{"Cache-Control":"private, no-store"}});
}
