import type { Profile, GreatGameHistoryRow, GreatGameLeaderboardRow } from "@/lib/supabase/database.types";

export type HubFriend = Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> & { matchId: string | null };
export type HubData = {
  profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
  ranking: GreatGameLeaderboardRow | null;
  friends: HubFriend[];
  lastMatch: GreatGameHistoryRow | null;
};
