import { NextResponse } from "next/server";
import { z } from "zod";
import { loadDirectRavenInbox } from "@/lib/directRaven";
import { createClient } from "@/lib/supabase/server";

const BLOCKED_PREFIXES = ["/messages", "/settings", "/admin", "/notifications", "/login", "/signup"];

const shareSchema = z.object({
  pageHref: z.string().min(1).max(1200),
  pageTitle: z.string().trim().min(1).max(180),
  conversationIds: z.array(z.string().uuid()).min(1).max(12),
  message: z.string().max(1200).optional().default(""),
});

function safeHref(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const path = value.split(/[?#]/, 1)[0] || "/";
  if (BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) return null;
  return value;
}

function pageToken(title: string, href: string) {
  const encoded = Buffer.from(JSON.stringify({ title, href }), "utf8").toString("base64url");
  return `[[page:${encoded}]]`;
}

export async function GET() {
  const inbox = await loadDirectRavenInbox();
  if (!inbox) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const supabase = await createClient();
  const targets = await Promise.all(inbox.conversations.map(async ({ conversation, partner, members }) => {
    let avatarUrl: string | null = null;
    if (conversation.kind === "guild") {
      if (conversation.avatar_path) {
        const { data } = await supabase.storage.from("raven-media").createSignedUrl(conversation.avatar_path, 3600);
        avatarUrl = data?.signedUrl ?? null;
      }
      const title = conversation.title?.trim() || "Guild Parley";
      return { id: conversation.id, kind: conversation.kind, title, subtitle: `${members.length} ${members.length === 1 ? "member" : "members"}`, avatarUrl, initials: title.slice(0, 2).toUpperCase(), updatedAt: conversation.updated_at };
    }
    const title = partner?.display_name?.trim() || partner?.username || "Raven keeper";
    return { id: conversation.id, kind: conversation.kind, title, subtitle: partner?.username ? `@${partner.username}` : "Direct Raven", avatarUrl: partner?.avatar_url ?? null, initials: title.slice(0, 2).toUpperCase(), updatedAt: conversation.updated_at };
  }));
  return NextResponse.json({ targets: targets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = shareSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a Raven path first." }, { status: 400 });
  const href = safeHref(parsed.data.pageHref);
  if (!href) return NextResponse.json({ error: "That page cannot be shared by raven." }, { status: 400 });

  const ids = [...new Set(parsed.data.conversationIds)];
  const { data: memberships, error: membershipError } = await supabase.from("direct_raven_members").select("conversation_id").eq("user_id", user.id).in("conversation_id", ids);
  if (membershipError) return NextResponse.json({ error: "Raven paths could not be checked." }, { status: 500 });
  const allowed = new Set((memberships ?? []).map((row) => row.conversation_id));
  const body = [parsed.data.message.trim(), pageToken(parsed.data.pageTitle, href)].filter(Boolean).join("\n");
  const messages: { id: string; conversationId: string }[] = [];

  for (const conversationId of ids) {
    if (!allowed.has(conversationId)) continue;
    const { data, error } = await supabase.from("direct_raven_messages").insert({ conversation_id: conversationId, sender_id: user.id, body }).select("id,conversation_id").single();
    if (!error && data) messages.push({ id: data.id, conversationId: data.conversation_id });
  }
  if (!messages.length) return NextResponse.json({ error: "The page could not be sent down those Raven paths." }, { status: 400 });

  return NextResponse.json({ sent: messages.length, messages });
}
