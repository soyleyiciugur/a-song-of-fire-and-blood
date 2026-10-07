import { createClient } from "@/lib/supabase/server";
import type { GreatGameLeaderboardRow } from "@/lib/supabase/database.types";
import RanksView from "./RanksView";

export default async function GreatGameRanksPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("great_game_leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(100);

  return <RanksView leaders={(data ?? []) as GreatGameLeaderboardRow[]} />;
}
