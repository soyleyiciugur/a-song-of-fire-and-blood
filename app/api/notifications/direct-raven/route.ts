import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dispatchSiteNotification } from "@/lib/notifications/server";

const schema = z.object({ messageId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid raven." }, { status: 400 });

  const { data: message } = await supabase.from("direct_raven_messages").select("id,conversation_id,sender_id,body,created_at").eq("id", parsed.data.messageId).maybeSingle();
  if (!message || message.sender_id !== user.id) return NextResponse.json({ error: "Raven not found." }, { status: 404 });
  const [{ data: conversation }, { data: members }, { data: actor }] = await Promise.all([
    supabase.from("direct_raven_conversations").select("id,kind,title").eq("id", message.conversation_id).maybeSingle(),
    supabase.from("direct_raven_members").select("user_id").eq("conversation_id", message.conversation_id),
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  if (!conversation) return NextResponse.json({ error: "Raven path not found." }, { status: 404 });

  const recipients = (members ?? []).map((member) => member.user_id).filter((id) => id !== user.id);
  const kind = conversation.kind === "guild" ? "guild_parley" as const : "direct_raven" as const;
  const sourceLabel = conversation.kind === "guild" ? conversation.title || "Guild Parley" : actor?.display_name ? `Raven from ${actor.display_name}` : "Direct Raven";
  for (const recipient of recipients) after(() => dispatchSiteNotification({
    recipientUserId: recipient,
    actorUserId: user.id,
    actorName: actor?.display_name ?? null,
    kind,
    href: `/messages/${conversation.id}`,
    sourceLabel,
    context: { conversationId: conversation.id, messageId: message.id, replyBody: message.body },
    groupKey: `direct-raven:${conversation.id}`,
    dedupeKey: `direct-raven:${message.id}:${recipient}`,
  }));
  return NextResponse.json({ ok: true, recipients: recipients.length });
}
