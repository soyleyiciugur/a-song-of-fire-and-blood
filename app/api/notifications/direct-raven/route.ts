import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dispatchSiteNotification } from "@/lib/notifications/server";
import { createAdminClient } from "@/lib/supabase/admin";
import galleryData from "@/data/gallery.json";

const schema = z.object({ messageId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid raven." }, { status: 400 });

  const { data: message } = await supabase.from("direct_raven_messages").select("id,conversation_id,sender_id,body,created_at,attachment_path,gif").eq("id", parsed.data.messageId).maybeSingle();
  if (!message || message.sender_id !== user.id) return NextResponse.json({ error: "Raven not found." }, { status: 404 });
  const [{ data: conversation }, { data: members }, { data: actor }] = await Promise.all([
    supabase.from("direct_raven_conversations").select("id,kind,title,avatar_path").eq("id", message.conversation_id).maybeSingle(),
    supabase.from("direct_raven_members").select("user_id").eq("conversation_id", message.conversation_id),
    supabase.from("profiles").select("display_name,username,avatar_url").eq("id", user.id).maybeSingle(),
  ]);
  if (!conversation) return NextResponse.json({ error: "Raven path not found." }, { status: 404 });

  const recipients = (members ?? []).map((member) => member.user_id).filter((id) => id !== user.id);
  const admin = createAdminClient();
  const activeUsers = new Set<string>();
  if (admin && recipients.length) {
    const now = new Date().toISOString();
    const [{ data: pageActive }, { data: conversationActive }] = await Promise.all([
      admin.from("direct_raven_page_presence").select("user_id").in("user_id", recipients).gt("active_until", now),
      admin.from("direct_raven_presence").select("user_id").eq("conversation_id", conversation.id).in("user_id", recipients).gt("active_until", now),
    ]);
    for (const row of [...(pageActive ?? []), ...(conversationActive ?? [])]) activeUsers.add(row.user_id);
  }

  const kind = conversation.kind === "guild" ? "guild_parley" as const : "direct_raven" as const;
  const actorUsername = actor?.username ?? actor?.display_name ?? "someone";
  const sourceLabel = conversation.kind === "guild" ? conversation.title || "Guild Parley" : `@${actorUsername}`;
  const reelMatch = /\[\[reel:([a-z0-9-]+)\]\]/i.exec(message.body);
  const reelEntry = reelMatch
    ? (galleryData as { id: string; caption?: string | null }[]).find((entry) => entry.id === reelMatch[1].toLowerCase())
    : null;
  const reelLabel = reelEntry?.caption?.trim()
    ? `Shared a Gutter Reel: ${reelEntry.caption.trim()}`
    : "Shared a Gutter Reel";
  const pageMatch = /\[\[page:([A-Za-z0-9_-]+)\]\]/i.exec(message.body);
  let pageLabel = "Shared a page";
  if (pageMatch) {
    try {
      const decoded = JSON.parse(Buffer.from(pageMatch[1], "base64url").toString("utf8")) as { title?: unknown };
      if (typeof decoded.title === "string" && decoded.title.trim()) pageLabel = `Shared a page: ${decoded.title.trim()}`;
    } catch {
      // A malformed page token should not block delivery of the raven itself.
    }
  }
  const attachedText = message.body
    .replace(/\[\[(?:portrait|reel):[a-z0-9-]+\]\]/gi, " ")
    .replace(/\[\[page:[A-Za-z0-9_-]+\]\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const cleanText = message.body
    .replace(/\[\[portrait:[a-z0-9-]+\]\]/gi, " mini portrait ")
    .replace(/\[\[reel:[a-z0-9-]+\]\]/gi, ` ${reelLabel} `)
    .replace(/\[\[page:[A-Za-z0-9_-]+\]\]/gi, ` ${pageLabel} `)
    .replace(/\s+/g, " ")
    .trim();
  const rawPreview = attachedText || cleanText || (message.attachment_path ? "Photo" : message.gif ? "GIF" : "New raven");
  const messagePreview = rawPreview.length > 110 ? `${rawPreview.slice(0, 107).trimEnd()}...` : rawPreview;
  let guildAvatarUrl: string | undefined;
  if (conversation.kind === "guild" && conversation.avatar_path) {
    const { data } = await supabase.storage.from("raven-media").createSignedUrl(conversation.avatar_path, 3600);
    guildAvatarUrl = data?.signedUrl;
  }
  const deliverable = recipients.filter((recipient) => !activeUsers.has(recipient));
  for (const recipient of deliverable) after(() => dispatchSiteNotification({
    recipientUserId: recipient,
    actorUserId: user.id,
    actorName: actor?.display_name ?? actorUsername,
    kind,
    href: `/messages/${conversation.id}?unread=1`,
    sourceLabel,
    context: {
      conversationId: conversation.id, messageId: message.id, replyBody: message.body, messagePreview,
      actorUsername, actorAvatarUrl: actor?.avatar_url ?? undefined,
      conversationTitle: conversation.kind === "guild" ? conversation.title || "Guild Parley" : undefined,
      guildAvatarPath: conversation.avatar_path ?? undefined, guildAvatarUrl,
    },
    groupKey: `direct-raven:${conversation.id}`,
    groupWindowMs: 0,
    collapseUnread: true,
    dedupeKey: `direct-raven:${message.id}:${recipient}`,
  }));
  return NextResponse.json({ ok: true, recipients: deliverable.length, suppressed: recipients.length - deliverable.length });
}
