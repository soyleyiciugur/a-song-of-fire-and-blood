import { after, NextResponse } from "next/server";
import houses from "@/data/houses.json";

import { createGame, applyAction } from "@/lib/the-great-game/engine";
import { createTestDeck, validateDeck } from "@/lib/the-great-game/deck";
import { getGameCard } from "@/lib/the-great-game/cards";
import {
  normalizeMatchCode,
  playerIdForUser,
  projectGameStateForPlayer,
  type GreatGameOnlineMatchSummary,
  type GreatGameOnlineMatchView,
  type GreatGameOnlineStatePatch,
  type GreatGameOnlinePlayer,
  type GreatGameMatchStatus,
} from "@/lib/the-great-game/online";
import type { GameAction, GameState } from "@/lib/the-great-game/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const OPEN_STATUSES: GreatGameMatchStatus[] = ["waiting", "active"];

type MatchRow = {
  id: string;
  code: string;
  host_id: string;
  guest_id: string | null;
  host_deck: string[];
  guest_deck: string[] | null;
  host_deck_name: string | null;
  guest_deck_name: string | null;
  host_faction: string | null;
  guest_faction: string | null;
  started_at: string | null;
  state: GameState | null;
  status: GreatGameMatchStatus;
  version: number;
  winner_user_id: string | null;
  abandoned_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type ActionMatchRow = Pick<
  MatchRow,
  | "id"
  | "host_id"
  | "guest_id"
  | "state"
  | "status"
  | "version"
  | "updated_at"
  | "completed_at"
>;

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  affinity?: Record<string, string> | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function randomCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function asDeck(input: unknown): string[] {
  if (input == null) return createTestDeck();
  if (!Array.isArray(input) || input.some((cardId) => typeof cardId !== "string")) {
    throw new Error("That deck could not be read.");
  }

  const deck = input as string[];
  const validation = validateDeck(deck);
  if (!validation.valid) {
    throw new Error(validation.errors[0] ?? "That deck is not legal.");
  }
  return deck;
}

function asDeckName(input: unknown): string {
  if (typeof input !== "string") return "Practice Deck";
  const value = input.trim().replace(/\s+/g, " ");
  return value.slice(0, 60) || "Practice Deck";
}

function deckFaction(deck: string[]): string {
  const counts = new Map<string, number>();
  for (const cardId of deck) {
    const house = getGameCard(cardId).houseId;
    if (!house || house === "-") continue;
    counts.set(house, (counts.get(house) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!ranked[0]) return "mixed";
  return ranked[1]?.[1] === ranked[0][1] ? "mixed" : ranked[0][0];
}

function asAction(input: unknown): GameAction {
  if (!input || typeof input !== "object" || !("type" in input)) {
    throw new Error("Invalid game action.");
  }

  const type = (input as { type?: unknown }).type;
  if (
    type !== "mulligan" &&
    type !== "resolve-pending-effect" &&
    type !== "play-card" &&
    type !== "military-attack" &&
    type !== "political-attack" &&
    type !== "end-turn"
  ) {
    throw new Error("Invalid game action.");
  }

  return input as GameAction;
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function getProfiles(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  ids: string[]
): Promise<Map<string, GreatGameOnlinePlayer>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  // Public stats views grant access to authenticated users, not the admin role.
  const publicClient = await createClient();

  const [{ data }, { data: stats, error: statsError }] = await Promise.all([admin
    .from("profiles")
    .select("id,username,display_name,avatar_url,affinity")
    .in("id", uniqueIds),
    publicClient.from("great_game_player_stats")
      .select("user_id,games_played,wins,losses,draws,win_rate,current_win_streak")
      .in("user_id", uniqueIds),
  ]);

  const map = new Map<string, GreatGameOnlinePlayer>();
  for (const raw of (data ?? []) as ProfileRow[]) {
    const house = houses.find(house => house.id === raw.affinity?.house);
    const record = stats?.find(record => record.user_id === raw.id);
    map.set(raw.id, {
      id: raw.id,
      username: raw.username,
      displayName: raw.display_name || raw.username || "Player",
      avatarUrl: raw.avatar_url,
      favoriteHouse: house ? { name: house.name, image: house.sigilSrc } : null,
      gameStats: statsError ? null : {
        games: record?.games_played ?? 0,
        wins: record?.wins ?? 0,
        losses: record?.losses ?? 0,
        draws: record?.draws ?? 0,
        winRate: Number(record?.win_rate ?? 0),
        streak: record?.current_win_streak ?? 0,
      },
    });
  }

  for (const id of uniqueIds) {
    if (!map.has(id)) {
      map.set(id, {
        id,
        username: "player",
        displayName: "Player",
        avatarUrl: null,
      });
    }
  }

  return map;
}

async function toMatchView(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  match: MatchRow,
  userId: string
): Promise<GreatGameOnlineMatchView | null> {
  const playerId = playerIdForUser(match, userId);
  if (!playerId) return null;

  const profiles = await getProfiles(
    admin,
    [match.host_id, match.guest_id].filter((id): id is string => Boolean(id))
  );

  const host = profiles.get(match.host_id)!;
  const guest = match.guest_id ? profiles.get(match.guest_id) ?? null : null;
  const opponent = playerId === "player1" ? guest : host;

  return {
    id: match.id,
    code: match.code,
    status: match.status,
    version: match.version,
    playerId,
    host,
    guest,
    opponent,
    state: match.state ? projectGameStateForPlayer(match.state, playerId) : null,
    createdAt: match.created_at,
    updatedAt: match.updated_at,
    completedAt: match.completed_at,
  };
}

function toStatePatch(
  match: Pick<MatchRow, "id" | "status" | "version" | "state" | "updated_at" | "completed_at">,
  playerId: "player1" | "player2"
): GreatGameOnlineStatePatch {
  return {
    id: match.id,
    status: match.status,
    version: match.version,
    state: match.state ? projectGameStateForPlayer(match.state, playerId) : null,
    updatedAt: match.updated_at,
    completedAt: match.completed_at,
  };
}

async function emitMatchEvent(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  matchId: string,
  version: number,
  eventType: "joined" | "state" | "left",
  detail: Record<string, unknown> = {}
) {
  await admin.from("great_game_events").insert({
    match_id: matchId,
    version,
    event_type: eventType,
    detail,
  });
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return jsonError("Sign in to play The Great Game online.", 401);

  const admin = createAdminClient();
  if (!admin) return jsonError("Online play is not configured on the server.", 503);

  const url = new URL(request.url);
  const profileId = url.searchParams.get("player");
  if (profileId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId)) return jsonError("Invalid player.");
    const profiles = await getProfiles(admin, [profileId]);
    return NextResponse.json({ player: profiles.get(profileId) }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const matchId = url.searchParams.get("match");
  const stateOnly = url.searchParams.get("stateOnly") === "1";

  if (matchId) {
    if (stateOnly) {
      const stateReadStartedAt = performance.now();
      const { data, error } = await admin
        .from("great_game_matches")
        .select("id,host_id,guest_id,state,status,version,updated_at,completed_at")
        .eq("id", matchId)
        .maybeSingle();
      const stateReadFinishedAt = performance.now();

      if (error) return jsonError(error.message, 500);
      if (!data) return jsonError("That table no longer exists.", 404);

      const match = data as ActionMatchRow;
      const playerId = playerIdForUser(match, user.id);
      if (!playerId) return jsonError("You are not seated at that table.", 403);

      return NextResponse.json(
        { statePatch: toStatePatch(match, playerId) },
        {
          headers: {
            "Server-Timing": `db-state;dur=${(stateReadFinishedAt - stateReadStartedAt).toFixed(1)}`,
          },
        }
      );
    }

    const { data, error } = await admin
      .from("great_game_matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("That table no longer exists.", 404);

    const match = data as MatchRow;
    const playerId = playerIdForUser(match, user.id);
    if (!playerId) return jsonError("You are not seated at that table.", 403);

    const view = await toMatchView(admin, match, user.id);
    return NextResponse.json({ match: view });
  }

  const { data, error } = await admin
    .from("great_game_matches")
    .select("*")
    .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
    .in("status", OPEN_STATUSES)
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) return jsonError(error.message, 500);

  const rows = (data ?? []) as MatchRow[];
  const profileIds = rows.flatMap((row) =>
    [row.host_id, row.guest_id].filter((id): id is string => Boolean(id))
  );
  const profiles = await getProfiles(admin, profileIds);

  const matches: GreatGameOnlineMatchSummary[] = rows.flatMap((row) => {
    const playerId = playerIdForUser(row, user.id);
    if (!playerId) return [];
    const opponentId = playerId === "player1" ? row.guest_id : row.host_id;
    return [
      {
        id: row.id,
        code: row.code,
        status: row.status,
        version: row.version,
        playerId,
        opponent: opponentId ? profiles.get(opponentId) ?? null : null,
        updatedAt: row.updated_at,
      },
    ];
  });

  return NextResponse.json({ matches });
}

export async function POST(request: Request) {
  const requestStartedAt = performance.now();
  const user = await getAuthenticatedUser();
  const authFinishedAt = performance.now();
  if (!user) return jsonError("Sign in to play The Great Game online.", 401);

  const admin = createAdminClient();
  if (!admin) return jsonError("Online play is not configured on the server.", 503);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.");
  }

  const op = body.op;

  try {
    if (op === "create") {
      const deck = asDeck(body.deck);
      const deckName = asDeckName(body.deckName);

      // A host does not need several stale empty tables. Retire old invitations.
      await admin
        .from("great_game_matches")
        .update({
          status: "abandoned",
          completed_at: new Date().toISOString(),
          abandoned_by: user.id,
        })
        .eq("host_id", user.id)
        .eq("status", "waiting");

      let created: MatchRow | null = null;
      let lastError: string | null = null;

      for (let attempt = 0; attempt < 6 && !created; attempt += 1) {
        const code = randomCode();
        const { data, error } = await admin
          .from("great_game_matches")
          .insert({
            code,
            host_id: user.id,
            host_deck: deck,
            host_deck_name: deckName,
            host_faction: deckFaction(deck),
            status: "waiting",
            version: 0,
          })
          .select("*")
          .single();

        if (data) created = data as MatchRow;
        if (error) lastError = error.message;
      }

      if (!created) {
        return jsonError(lastError ?? "Could not open a table.", 500);
      }

      const view = await toMatchView(admin, created, user.id);
      return NextResponse.json({ match: view }, { status: 201 });
    }

    if (op === "join") {
      const code = normalizeMatchCode(String(body.code ?? ""));
      if (code.length !== 6) return jsonError("Enter a six-character table code.");
      const deck = asDeck(body.deck);
      const deckName = asDeckName(body.deckName);

      const { data, error } = await admin
        .from("great_game_matches")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (error) return jsonError(error.message, 500);
      if (!data) return jsonError("No open table bears that code.", 404);

      const match = data as MatchRow;
      const existingSeat = playerIdForUser(match, user.id);
      if (existingSeat) {
        const view = await toMatchView(admin, match, user.id);
        return NextResponse.json({ match: view });
      }

      if (match.status !== "waiting" || match.guest_id) {
        return jsonError("That table already has two players.", 409);
      }

      if (match.host_id === user.id) {
        return jsonError("You cannot take both seats at your own table.");
      }

      const state = createGame(match.host_deck, deck);
      const nextVersion = match.version + 1;
      const now = new Date().toISOString();

      const { data: joined, error: joinError } = await admin
        .from("great_game_matches")
        .update({
          guest_id: user.id,
          guest_deck: deck,
          guest_deck_name: deckName,
          guest_faction: deckFaction(deck),
          started_at: now,
          state,
          status: "active",
          version: nextVersion,
          updated_at: now,
        })
        .eq("id", match.id)
        .eq("status", "waiting")
        .is("guest_id", null)
        .eq("version", match.version)
        .select("*")
        .maybeSingle();

      if (joinError) return jsonError(joinError.message, 500);
      if (!joined) return jsonError("Another player reached that table first.", 409);

      after(() => emitMatchEvent(admin, match.id, nextVersion, "joined"));
      const view = await toMatchView(admin, joined as MatchRow, user.id);
      return NextResponse.json({ match: view });
    }

    if (op === "action") {
      const matchId = String(body.matchId ?? "");
      const requestedVersion = Number(body.version);
      const action = asAction(body.action);

      if (!matchId) return jsonError("Missing match id.");
      if (!Number.isInteger(requestedVersion) || requestedVersion < 0) {
        return jsonError("Invalid match version.");
      }

      const readStartedAt = performance.now();
      const { data, error } = await admin
        .from("great_game_matches")
        .select("id,host_id,guest_id,state,status,version,updated_at,completed_at")
        .eq("id", matchId)
        .maybeSingle();
      const readFinishedAt = performance.now();

      if (error) return jsonError(error.message, 500);
      if (!data) return jsonError("That table no longer exists.", 404);

      const match = data as ActionMatchRow;
      const playerId = playerIdForUser(match, user.id);
      if (!playerId) return jsonError("You are not seated at that table.", 403);
      if (match.status !== "active" || !match.state) {
        return jsonError("That game is not currently active.", 409);
      }

      if (match.version !== requestedVersion) {
        return NextResponse.json(
          {
            error: "The table changed before that move arrived.",
            statePatch: toStatePatch(match, playerId),
          },
          { status: 409 }
        );
      }

      if (match.state.activePlayerId !== playerId) {
        return jsonError("It is not your turn.", 409);
      }

      const playedHandCard = action.type === "play-card"
        ? match.state.players[playerId].hand.find((card) => card.instanceId === action.handInstanceId) ?? null
        : null;
      const beforeBoardIds = action.type === "play-card"
        ? new Set(match.state.players[playerId].board.map((unit) => unit.instanceId))
        : null;

      const engineStartedAt = performance.now();
      const result = applyAction(match.state, action);
      const engineFinishedAt = performance.now();
      if (!result.ok) return jsonError(result.error ?? "That move is not legal.", 422);

      const addedBoardUnit = beforeBoardIds
        ? result.state.players[playerId].board.find((unit) => !beforeBoardIds.has(unit.instanceId)) ?? null
        : null;
      const eventDetail: Record<string, unknown> = playedHandCard
        ? {
            kind: "play-card",
            actorPlayerId: playerId,
            cardId: playedHandCard.cardId,
            boardInstanceId: addedBoardUnit?.instanceId ?? null,
          }
        : { kind: action.type, actorPlayerId: playerId };

      const nextVersion = match.version + 1;
      const finished = Boolean(result.state.winner || result.state.phase === "finished");
      const winnerSeat = result.state.winner;
      let winnerUserId: string | null = null;
      if (winnerSeat === "player1") winnerUserId = match.host_id;
      if (winnerSeat === "player2") winnerUserId = match.guest_id;

      const patch: Record<string, unknown> = {
        state: result.state,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      };

      if (finished) {
        patch.status = "finished";
        patch.completed_at = new Date().toISOString();
        patch.winner_user_id = winnerUserId;
      }

      const writeStartedAt = performance.now();
      const { data: updated, error: updateError } = await admin
        .from("great_game_matches")
        .update(patch)
        .eq("id", match.id)
        .eq("version", match.version)
        .eq("status", "active")
        .select("id,status,version,updated_at,completed_at")
        .maybeSingle();
      const writeFinishedAt = performance.now();

      if (updateError) return jsonError(updateError.message, 500);
      if (!updated) {
        const { data: latest } = await admin
          .from("great_game_matches")
          .select("id,host_id,guest_id,state,status,version,updated_at,completed_at")
          .eq("id", match.id)
          .maybeSingle();
        const latestMatch = latest as ActionMatchRow | null;
        const latestPatch = latestMatch
          ? toStatePatch(latestMatch, playerId)
          : null;
        return NextResponse.json(
          { error: "The table changed before that move arrived.", statePatch: latestPatch },
          { status: 409 }
        );
      }

      // Realtime notification is not part of the actor's critical path. The
      // authoritative match row is already committed; schedule the lightweight
      // event insert after the response so the acting player does not wait for
      // another Supabase round-trip.
      after(() => emitMatchEvent(admin, match.id, nextVersion, "state", eventDetail));

      const updatedMeta = updated as {
        id: string;
        status: GreatGameMatchStatus;
        version: number;
        updated_at: string;
        completed_at: string | null;
      };
      const statePatch = toStatePatch(
        {
          id: updatedMeta.id,
          status: updatedMeta.status,
          version: updatedMeta.version,
          state: result.state,
          updated_at: updatedMeta.updated_at,
          completed_at: updatedMeta.completed_at,
        },
        playerId
      );

      const responseFinishedAt = performance.now();
      return NextResponse.json(
        { statePatch },
        {
          headers: {
            "Server-Timing": [
              `auth;dur=${(authFinishedAt - requestStartedAt).toFixed(1)}`,
              `db-read;dur=${(readFinishedAt - readStartedAt).toFixed(1)}`,
              `engine;dur=${(engineFinishedAt - engineStartedAt).toFixed(1)}`,
              `db-write;dur=${(writeFinishedAt - writeStartedAt).toFixed(1)}`,
              `total;dur=${(responseFinishedAt - requestStartedAt).toFixed(1)}`,
            ].join(", "),
          },
        }
      );
    }

    if (op === "leave") {
      const matchId = String(body.matchId ?? "");
      if (!matchId) return jsonError("Missing match id.");

      const { data, error } = await admin
        .from("great_game_matches")
        .select("*")
        .eq("id", matchId)
        .maybeSingle();

      if (error) return jsonError(error.message, 500);
      if (!data) return NextResponse.json({ ok: true });

      const match = data as MatchRow;
      const playerId = playerIdForUser(match, user.id);
      if (!playerId) return jsonError("You are not seated at that table.", 403);

      if (match.status === "waiting" && match.host_id === user.id) {
        await admin.from("great_game_matches").delete().eq("id", match.id);
        return NextResponse.json({ ok: true });
      }

      if (match.status === "active") {
        const nextVersion = match.version + 1;
        const { error: leaveError } = await admin
          .from("great_game_matches")
          .update({
            status: "abandoned",
            abandoned_by: user.id,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            version: nextVersion,
          })
          .eq("id", match.id)
          .eq("status", "active")
          .eq("version", match.version);

        if (leaveError) return jsonError(leaveError.message, 500);
        after(() => emitMatchEvent(admin, match.id, nextVersion, "left"));
      }

      return NextResponse.json({ ok: true });
    }

    return jsonError("Unknown online-play request.");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Online play failed.");
  }
}
