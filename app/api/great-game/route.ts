import { NextResponse } from "next/server";

import { createGame, applyAction } from "@/lib/the-great-game/engine";
import { createTestDeck, validateDeck } from "@/lib/the-great-game/deck";
import {
  normalizeMatchCode,
  playerIdForUser,
  projectGameStateForPlayer,
  type GreatGameOnlineMatchSummary,
  type GreatGameOnlineMatchView,
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
  state: GameState | null;
  status: GreatGameMatchStatus;
  version: number;
  winner_user_id: string | null;
  abandoned_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
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

  const { data } = await admin
    .from("profiles")
    .select("id,username,display_name,avatar_url")
    .in("id", uniqueIds);

  const map = new Map<string, GreatGameOnlinePlayer>();
  for (const raw of (data ?? []) as ProfileRow[]) {
    map.set(raw.id, {
      id: raw.id,
      username: raw.username,
      displayName: raw.display_name || raw.username || "Player",
      avatarUrl: raw.avatar_url,
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

async function emitMatchEvent(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  matchId: string,
  version: number,
  eventType: "joined" | "state" | "left"
) {
  await admin.from("great_game_events").insert({
    match_id: matchId,
    version,
    event_type: eventType,
  });
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return jsonError("Sign in to play The Great Game online.", 401);

  const admin = createAdminClient();
  if (!admin) return jsonError("Online play is not configured on the server.", 503);

  const url = new URL(request.url);
  const matchId = url.searchParams.get("match");

  if (matchId) {
    const { data, error } = await admin
      .from("great_game_matches")
      .select("*")
      .eq("id", matchId)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("That table no longer exists.", 404);

    const view = await toMatchView(admin, data as MatchRow, user.id);
    if (!view) return jsonError("You are not seated at that table.", 403);

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
  const user = await getAuthenticatedUser();
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

      await emitMatchEvent(admin, match.id, nextVersion, "joined");
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
      if (match.status !== "active" || !match.state) {
        return jsonError("That game is not currently active.", 409);
      }

      if (match.version !== requestedVersion) {
        const view = await toMatchView(admin, match, user.id);
        return NextResponse.json(
          { error: "The table changed before that move arrived.", match: view },
          { status: 409 }
        );
      }

      if (match.state.activePlayerId !== playerId) {
        return jsonError("It is not your turn.", 409);
      }

      const result = applyAction(match.state, action);
      if (!result.ok) return jsonError(result.error ?? "That move is not legal.", 422);

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

      const { data: updated, error: updateError } = await admin
        .from("great_game_matches")
        .update(patch)
        .eq("id", match.id)
        .eq("version", match.version)
        .eq("status", "active")
        .select("*")
        .maybeSingle();

      if (updateError) return jsonError(updateError.message, 500);
      if (!updated) {
        const { data: latest } = await admin
          .from("great_game_matches")
          .select("*")
          .eq("id", match.id)
          .maybeSingle();
        const view = latest ? await toMatchView(admin, latest as MatchRow, user.id) : null;
        return NextResponse.json(
          { error: "The table changed before that move arrived.", match: view },
          { status: 409 }
        );
      }

      await emitMatchEvent(admin, match.id, nextVersion, "state");
      const view = await toMatchView(admin, updated as MatchRow, user.id);
      return NextResponse.json({ match: view });
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
        await emitMatchEvent(admin, match.id, nextVersion, "left");
      }

      return NextResponse.json({ ok: true });
    }

    return jsonError("Unknown online-play request.");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Online play failed.");
  }
}
