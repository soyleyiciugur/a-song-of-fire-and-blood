import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your rank history." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const date = params.get("before");
  const id = params.get("match");
  if ((date || id) && (!date || !/^\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:\d\d)$/.test(date) || !Number.isFinite(Date.parse(date)) || !id || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))) {
    return NextResponse.json({ error: "Invalid history cursor." }, { status: 400 });
  }
  let query = client.from("great_game_match_history").select("season_id,season_display_name,match_type,match_id,opponent_username,opponent_display_name,result,rating_before,rating_after,completed_at")
    .eq("user_id", user.id).eq("match_type","ranked").order("completed_at", { ascending: false }).order("match_id", { ascending: false }).limit(21);
  if (date && id) query = query.or(`completed_at.lt.${date},and(completed_at.eq.${date},match_id.lt.${id})`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Your rank history could not be loaded." }, { status: 503 });
  const rows = (data ?? []).slice(0, 20);
  const last = rows.at(-1);
  return NextResponse.json({ rows, next: data && data.length > 20 && last ? { before: last.completed_at, match: last.match_id } : null }, { headers: { "Cache-Control": "private, no-store" } });
}
