import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDeckResult, type DeckRecord } from "@/lib/the-great-game/deck-records";

export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your deck record." }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Deck records are unavailable." }, { status: 503 });
  const records = new Map<string, DeckRecord>();
  const byType = {custom:new Map<string,DeckRecord>(),ranked:new Map<string,DeckRecord>()};
  let unlinkedGames = 0;
  for (let offset = 0; ; offset += 200) {
    const { data: history, error } = await client.from("great_game_match_history")
      .select("match_id,result,match_type").eq("user_id", user.id).order("completed_at").order("match_id").range(offset, offset + 199);
    if (error) return NextResponse.json({ error: "Your deck record could not be loaded." }, { status: 503 });
    if (!history?.length) break;
    const { data: matches, error: matchError } = await admin.from("great_game_matches")
      .select("id,host_id,guest_id,host_deck,guest_deck").in("id", history.map(row => row.match_id))
      .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`);
    if (matchError) return NextResponse.json({ error: "Your deck record could not be loaded." }, { status: 503 });
    for (const row of history) {
      const match = matches?.find(match => match.id === row.match_id);
      const cards = match?.host_id === user.id ? match.host_deck : match?.guest_id === user.id ? match.guest_deck : null;
      if (!Array.isArray(cards) || !cards.length || !cards.every(id => typeof id === "string")) { unlinkedGames++; continue; }
      addDeckResult(records, cards, row.result);
      addDeckResult(byType[row.match_type === "custom" ? "custom" : "ranked"],cards,row.result);
    }
    if (history.length < 200) break;
  }
  return NextResponse.json({ records: [...records.values()], unlinkedGames, byType:{custom:[...byType.custom.values()],ranked:[...byType.ranked.values()]} }, { headers: { "Cache-Control": "private, no-store" } });
}
