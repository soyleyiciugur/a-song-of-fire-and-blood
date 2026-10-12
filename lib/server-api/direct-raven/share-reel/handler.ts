import { NextResponse } from "next/server";
import { z } from "zod";
import galleryData from "@/data/gallery.json";
import { loadDirectRavenInbox } from "@/lib/directRaven";
import { createClient } from "@/lib/supabase/server";

const shareSchema = z.object({
  entryId: z.string().min(1).max(120),
  conversationIds: z.array(z.string().uuid()).min(1).max(12),
  message: z.string().max(1200).optional().default(""),
});

type GalleryRecord = {
  id: string;
  src: string;
  caption?: string | null;
};

function isVideo(src: string) {
  const clean = src.split("?")[0].split("#")[0].toLowerCase();
  return [".mp4", ".webm", ".mov"].some((extension) => clean.endsWith(extension));
}

export async function GET() {
  const inbox = await loadDirectRavenInbox();
  if (!inbox) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const supabase = await createClient();
  const targets = await Promise.all(
    inbox.conversations.map(async ({ conversation, partner, members }) => {
      let avatarUrl: string | null = null;
      if (conversation.kind === "guild") {
        if (conversation.avatar_path) {
          const { data } = await supabase.storage
            .from("raven-media")
            .createSignedUrl(conversation.avatar_path, 3600);
          avatarUrl = data?.signedUrl ?? null;
        }
        const title = conversation.title?.trim() || "Guild Parley";
        return {
          id: conversation.id,
          kind: conversation.kind,
          title,
          subtitle: `${members.length} ${members.length === 1 ? "member" : "members"}`,
          avatarUrl,
          initials: title.slice(0, 2).toUpperCase(),
          updatedAt: conversation.updated_at,
        };
      }

      const title = partner?.display_name?.trim() || partner?.username || "Raven keeper";
      return {
        id: conversation.id,
        kind: conversation.kind,
        title,
        subtitle: partner?.username ? `@${partner.username}` : "Direct Raven",
        avatarUrl: partner?.avatar_url ?? null,
        initials: title.slice(0, 2).toUpperCase(),
        updatedAt: conversation.updated_at,
      };
    })
  );

  return NextResponse.json({
    targets: targets.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = shareSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a Raven path first." }, { status: 400 });

  const entry = (galleryData as GalleryRecord[]).find(
    (candidate) => candidate.id === parsed.data.entryId
  );
  if (!entry) return NextResponse.json({ error: "That Raven's Eye item is no longer available." }, { status: 404 });

  const conversationIds = [...new Set(parsed.data.conversationIds)];
  const { data: memberships, error: membershipError } = await supabase
    .from("direct_raven_members")
    .select("conversation_id")
    .eq("user_id", user.id)
    .in("conversation_id", conversationIds);
  if (membershipError) return NextResponse.json({ error: "Raven paths could not be checked." }, { status: 500 });

  const allowed = new Set((memberships ?? []).map((row) => row.conversation_id));
  const attachedMessage = parsed.data.message.trim();
  const body = [attachedMessage, `[[reel:${entry.id}]]`].filter(Boolean).join("\n");
  const messages: { id: string; conversationId: string }[] = [];
  const failed: string[] = [];

  for (const conversationId of conversationIds) {
    if (!allowed.has(conversationId)) {
      failed.push(conversationId);
      continue;
    }

    const { data, error } = await supabase
      .from("direct_raven_messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      })
      .select("id,conversation_id")
      .single();

    if (error || !data) {
      failed.push(conversationId);
      continue;
    }
    messages.push({ id: data.id, conversationId: data.conversation_id });
  }

  if (!messages.length) {
    return NextResponse.json(
      { error: "The Raven's Eye item could not be sent down those Raven paths." },
      { status: 400 }
    );
  }

  return NextResponse.json({ messages, failed });
}
