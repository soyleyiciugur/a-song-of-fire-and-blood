import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { GreatGameHistoryRow, Profile } from "@/lib/supabase/database.types";

type SocialReply = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type SocialReaction = {
  match_id: string;
  user_id: string;
};

type PublicProfile = Pick<Profile, "id" | "username" | "display_name" | "avatar_url">;
type SocialHistoryRow = Pick<GreatGameHistoryRow,
  "match_id" | "user_id" | "opponent_id" | "opponent_username" | "opponent_display_name" | "opponent_avatar_url" |
  "result" | "duration_seconds" | "turns" | "completed_at" | "standing_after" | "opponent_standing_after"
>;

type SocialPerson = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

function pairKey(userId: string, opponentId: string) {
  return `${userId}:${opponentId}`;
}

function profileMap(profiles: PublicProfile[]) {
  return new Map(profiles.map(profile => [profile.id, profile]));
}

function personFromRow(row: SocialHistoryRow, profiles: Map<string, PublicProfile>, side: "user" | "opponent"): SocialPerson {
  if (side === "user") {
    const profile = profiles.get(row.user_id);
    return {
      id: row.user_id,
      username: profile?.username ?? row.user_id,
      displayName: profile?.display_name || profile?.username || "A Ruler",
      avatarUrl: profile?.avatar_url ?? null,
    };
  }

  const profile = profiles.get(row.opponent_id);
  return {
    id: row.opponent_id,
    username: profile?.username ?? row.opponent_username,
    displayName: profile?.display_name || row.opponent_display_name || row.opponent_username,
    avatarUrl: profile?.avatar_url ?? row.opponent_avatar_url,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const historyWithStanding = await supabase
    .from("great_game_match_history")
    .select("match_id,user_id,opponent_id,opponent_username,opponent_display_name,opponent_avatar_url,result,duration_seconds,turns,completed_at,standing_after,opponent_standing_after")
    .order("completed_at", { ascending: false })
    .limit(240);

  let history: SocialHistoryRow[];
  if (!historyWithStanding.error) {
    history = (historyWithStanding.data ?? []) as SocialHistoryRow[];
  } else {
    const legacyHistory = await supabase
      .from("great_game_match_history")
      .select("match_id,user_id,opponent_id,opponent_username,opponent_display_name,opponent_avatar_url,result,duration_seconds,turns,completed_at")
      .order("completed_at", { ascending: false })
      .limit(240);

    if (legacyHistory.error) {
      return NextResponse.json({ error: "The match ledger could not be opened." }, { status: 503 });
    }

    history = (legacyHistory.data ?? []).map(row => ({
      ...row,
      standing_after: null,
      opponent_standing_after: null,
    })) as SocialHistoryRow[];
  }

  const userIds = Array.from(new Set(history.flatMap(row => [row.user_id, row.opponent_id])));
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", userIds)
    : { data: [], error: null };

  const profiles = profileMap((profilesResult.data ?? []) as PublicProfile[]);
  const chronological = [...history].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());
  const currentStreak = new Map<string, number>();
  const versusStreak = new Map<string, number>();
  const streakAtResult = new Map<string, { streak: number; versus: number }>();
  const latestRowByUser = new Map<string, SocialHistoryRow>();

  for (const row of chronological) {
    const nextStreak = row.result === "win" ? (currentStreak.get(row.user_id) ?? 0) + 1 : 0;
    currentStreak.set(row.user_id, nextStreak);

    const key = pairKey(row.user_id, row.opponent_id);
    const nextVersus = row.result === "win" ? (versusStreak.get(key) ?? 0) + 1 : 0;
    versusStreak.set(key, nextVersus);
    streakAtResult.set(`${row.match_id}:${row.user_id}`, { streak: nextStreak, versus: nextVersus });
    latestRowByUser.set(row.user_id, row);
  }

  const runs = Array.from(latestRowByUser.entries())
    .map(([userId, latestRow]) => {
      let bestVersus = 0;
      let bestOpponentId: string | null = null;
      for (const [key, value] of versusStreak) {
        if (!key.startsWith(`${userId}:`) || value <= bestVersus) continue;
        bestVersus = value;
        bestOpponentId = key.slice(userId.length + 1);
      }

      const player = personFromRow(latestRow, profiles, "user");
      const opponentRow = bestOpponentId
        ? history.find(row => row.user_id === userId && row.opponent_id === bestOpponentId)
        : null;
      const opponent = opponentRow ? personFromRow(opponentRow, profiles, "opponent") : null;
      const streak = currentStreak.get(userId) ?? 0;

      return {
        player,
        streak,
        versusStreak: bestVersus,
        opponent,
        lastPlayedAt: latestRow.completed_at,
      };
    })
    .filter(run => run.streak >= 3 || run.versusStreak >= 3)
    .sort((a, b) => {
      const runDifference = Math.max(b.streak, b.versusStreak) - Math.max(a.streak, a.versusStreak);
      if (runDifference) return runDifference;
      return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
    })
    .slice(0, 6);

  const byMatch = new Map<string, SocialHistoryRow[]>();
  for (const row of history) {
    const bucket = byMatch.get(row.match_id) ?? [];
    bucket.push(row);
    byMatch.set(row.match_id, bucket);
  }

  const matches = [...byMatch.values()]
    .map(rows => {
      const canonical = rows.find(row => row.result === "win")
        ?? [...rows].sort((a, b) => a.user_id.localeCompare(b.user_id))[0];
      const streak = streakAtResult.get(`${canonical.match_id}:${canonical.user_id}`) ?? { streak: 0, versus: 0 };
      return {
        matchId: canonical.match_id,
        completedAt: canonical.completed_at,
        result: canonical.result === "draw" ? "draw" as const : "win" as const,
        actor: personFromRow(canonical, profiles, "user"),
        opponent: personFromRow(canonical, profiles, "opponent"),
        standingDelta: canonical.standing_after !== null && canonical.opponent_standing_after !== null
          ? canonical.standing_after - canonical.opponent_standing_after
          : null,
        turns: canonical.turns,
        durationSeconds: canonical.duration_seconds,
        streak: streak.streak,
        versusStreak: streak.versus,
      };
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 40);

  const matchIds = matches.map(match => match.matchId);
  let reactions: SocialReaction[] = [];
  let replies: SocialReply[] = [];
  let interactionsReady = true;

  if (matchIds.length) {
    const [reactionResult, replyResult] = await Promise.all([
      supabase.from("great_game_social_reactions").select("match_id,user_id").in("match_id", matchIds),
      supabase.from("great_game_social_replies").select("id,match_id,user_id,body,created_at").in("match_id", matchIds).order("created_at", { ascending: true }),
    ]);
    if (reactionResult.error || replyResult.error) interactionsReady = false;
    reactions = (reactionResult.data ?? []) as SocialReaction[];
    replies = (replyResult.data ?? []) as SocialReply[];
  }

  const replyAuthorIds = Array.from(new Set(replies.map(reply => reply.user_id).filter(id => !profiles.has(id))));
  if (replyAuthorIds.length) {
    const replyProfiles = await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", replyAuthorIds);
    for (const profile of (replyProfiles.data ?? []) as PublicProfile[]) profiles.set(profile.id, profile);
  }

  const reactionCount = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const reaction of reactions) {
    reactionCount.set(reaction.match_id, (reactionCount.get(reaction.match_id) ?? 0) + 1);
    if (reaction.user_id === user?.id) likedByViewer.add(reaction.match_id);
  }

  const repliesByMatch = new Map<string, SocialReply[]>();
  for (const reply of replies) {
    const bucket = repliesByMatch.get(reply.match_id) ?? [];
    bucket.push(reply);
    repliesByMatch.set(reply.match_id, bucket);
  }

  return NextResponse.json({
    viewerId: user?.id ?? null,
    interactionsReady,
    runs,
    posts: matches.map(match => ({
      ...match,
      likes: reactionCount.get(match.matchId) ?? 0,
      liked: likedByViewer.has(match.matchId),
      replies: (repliesByMatch.get(match.matchId) ?? []).slice(-4).map(reply => {
        const author = profiles.get(reply.user_id);
        return {
          id: reply.id,
          body: reply.body,
          createdAt: reply.created_at,
          author: {
            id: reply.user_id,
            username: author?.username ?? reply.user_id,
            displayName: author?.display_name || author?.username || "A Ruler",
            avatarUrl: author?.avatar_url ?? null,
          },
        };
      }),
      replyCount: repliesByMatch.get(match.matchId)?.length ?? 0,
    })),
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in before joining the table talk." }, { status: 401 });

  const input = await request.json().catch(() => null) as { action?: unknown; matchId?: unknown; body?: unknown } | null;
  const action = input?.action;
  const matchId = typeof input?.matchId === "string" ? input.matchId : "";
  if (!matchId || (action !== "like" && action !== "reply")) {
    return NextResponse.json({ error: "That social action could not be read." }, { status: 400 });
  }

  if (action === "like") {
    const existing = await supabase
      .from("great_game_social_reactions")
      .select("match_id")
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing.error) return NextResponse.json({ error: "Reactions are not ready yet." }, { status: 503 });

    const result = existing.data
      ? await supabase.from("great_game_social_reactions").delete().eq("match_id", matchId).eq("user_id", user.id)
      : await supabase.from("great_game_social_reactions").insert({ match_id: matchId, user_id: user.id });

    if (result.error) return NextResponse.json({ error: "That reaction did not reach the ledger." }, { status: 400 });
    return NextResponse.json({ ok: true, liked: !existing.data });
  }

  const body = typeof input?.body === "string" ? input.body.trim() : "";
  if (!body || body.length > 420) {
    return NextResponse.json({ error: "Replies must be between 1 and 420 characters." }, { status: 400 });
  }

  const inserted = await supabase
    .from("great_game_social_replies")
    .insert({ match_id: matchId, user_id: user.id, body })
    .select("id")
    .single();

  if (inserted.error) return NextResponse.json({ error: "Your reply could not be posted." }, { status: 400 });
  return NextResponse.json({ ok: true, id: inserted.data.id });
}
