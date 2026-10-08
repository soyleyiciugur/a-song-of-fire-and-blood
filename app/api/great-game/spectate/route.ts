import { NextResponse } from "next/server";
import { authorizeTableViewer } from "@/lib/the-great-game/table-access";
import { spectatorSnapshot } from "@/lib/the-great-game/spectator";
import type { GameState } from "@/lib/the-great-game/types";
export async function GET(request: Request) {
  const access = await authorizeTableViewer(new URL(request.url).searchParams.get("match") ?? "");
  if (access instanceof NextResponse) return access;
  const {client, match, user, participants} = access;
  const { data: profiles, error } = await client.from("profiles").select("id,username,display_name,avatar_url").in("id", [...participants, user.id]);
  if (error) return NextResponse.json({error:"The players could not be loaded."},{status:503});
  const identity = (id: string) => { const p = profiles?.find(p => p.id === id); return {id, username:p?.username || "player", displayName:p?.display_name || p?.username || "Player", avatarUrl:p?.avatar_url ?? null}; };
  return NextResponse.json({viewer:identity(user.id), match:{id:match.id,code:match.code,status:match.status,version:match.version,host:identity(match.host_id),guest:identity(match.guest_id!),opponent:identity(match.guest_id!),playerId:"player1",state:spectatorSnapshot(match.state as GameState),createdAt:match.created_at,updatedAt:match.updated_at,completedAt:match.completed_at}}, {headers:{"Cache-Control":"private, no-store"}});
}
