import { NextResponse } from "next/server";
import { authorizeTableViewer } from "@/lib/the-great-game/table-access";
import { decodeGreatGameEmote } from "@/lib/the-great-game/emotes";
export async function GET(request: Request) {
  const access = await authorizeTableViewer(new URL(request.url).searchParams.get("match") ?? "");
  if (access instanceof NextResponse) return access;
  const {admin, match, participants} = access;
  const {data, error} = await admin.from("great_game_chat_messages").select("id,match_id,user_id,body,created_at").eq("match_id",match.id).order("created_at",{ascending:false}).limit(100);
  if (error) return NextResponse.json({error:"Table whispers could not be read."},{status:503});
  const ids = [...new Set((data ?? []).map(m=>m.user_id))];
  const {data:profiles} = ids.length ? await admin.from("profiles").select("id,username,display_name,avatar_url").in("id",ids) : {data:[]};
  return NextResponse.json({messages:(data ?? []).reverse().filter(m=>!decodeGreatGameEmote(m.body)).map(m=>({...m,spectator:!participants.includes(m.user_id),sender:profiles?.find(p=>p.id===m.user_id)}))},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request: Request) {
  let payload;
  try {payload=await request.json();} catch {return NextResponse.json({error:"Invalid message."},{status:400});}
  if(!payload || typeof payload.matchId!=="string" || typeof payload.body!=="string" || !payload.body.trim() || payload.body.trim().length>500 || decodeGreatGameEmote(payload.body)) return NextResponse.json({error:"Invalid message."},{status:400});
  const access=await authorizeTableViewer(payload.matchId);
  if(access instanceof NextResponse) return access;
  const {admin,user,match,participants}=access;
  const {data,error}=await admin.from("great_game_chat_messages").insert({match_id:match.id,user_id:user.id,body:payload.body.trim()}).select("id,match_id,user_id,body,created_at").single();
  if(error) return NextResponse.json({error:"That whisper did not cross the table."},{status:503});
  return NextResponse.json({...data,spectator:!participants.includes(user.id)});
}
