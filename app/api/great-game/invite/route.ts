import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ matchId: z.string().uuid(), username: z.string().min(1).max(40), message: z.string().trim().max(600) });
export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to send an invitation." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The invitation could not be read." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Tables are unavailable." }, { status: 503 });
  const { data: match, error: matchError } = await admin.from("great_game_matches").select("id,host_id,code,status").eq("id", parsed.data.matchId).maybeSingle();
  if (matchError) return NextResponse.json({ error: "The table could not be checked." }, { status: 503 });
  if (!match || match.host_id !== user.id || match.status !== "waiting") return NextResponse.json({ error: "Open a private table before inviting a friend." }, { status: 409 });
  // Use the caller's client so blocks, membership and message permissions still apply.
  const { data: conversationId, error: startError } = await client.rpc("start_direct_raven", { target_username: parsed.data.username });
  if (startError || !conversationId) return NextResponse.json({ error: "This Raven path is closed." }, { status: 403 });
  const body = [parsed.data.message, `[[game:${match.code}]]`].filter(Boolean).join("\n");
  const { data: message, error } = await client.from("direct_raven_messages").insert({ conversation_id: conversationId, sender_id: user.id, body }).select("id").single();
  if (error || !message) return NextResponse.json({ error: "The raven could not be sent. Your table and draft are still here." }, { status: 503 });
  return NextResponse.json({ messageId: message.id, conversationId });
}
