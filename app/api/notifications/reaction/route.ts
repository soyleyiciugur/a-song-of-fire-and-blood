import { after, NextResponse } from "next/server";
import { z } from "zod";
import gallery from "@/data/gallery.json";
import { createClient } from "@/lib/supabase/server";
import { dispatchSiteNotification } from "@/lib/notifications/server";

const schema = z.object({ kind: z.enum(["thread", "post", "raven"]), targetId: z.string().min(1).max(180) });

function ravenLink(entryId: string, commentId: string) {
  const entry = gallery.find((item) => item.id === entryId);
  if (!entry) return "/ravens-eye";
  const base = /\.(mp4|webm|mov)$/i.test(entry.src.split(/[?#]/)[0]) ? "/ravens-eye/reels" : entry.category === "fleabottom" ? "/ravens-eye/memes" : "/ravens-eye";
  return `${base}?${new URLSearchParams({ item: entry.id, comment: commentId })}#comment-${encodeURIComponent(commentId)}`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reaction target." }, { status: 400 });
  const { kind, targetId } = parsed.data;

  const { data: like } = await supabase.from("member_likes").select("created_at").eq("user_id", user.id).eq("target_kind", kind).eq("target_id", targetId).maybeSingle();
  if (!like) return NextResponse.json({ ok: true, notified: false });
  const { data: actor } = await supabase.from("profiles").select("display_name,username").eq("id", user.id).maybeSingle();

  let recipient: string | null = null;
  let href = "/notifications";
  let sourceLabel: string | null = null;
  let notificationContext: Record<string, unknown> = { targetKind: kind, targetId, actorUsername: actor?.username ?? undefined };
  const notificationKind: "tavern_favor" | "ravens_eye_like" = kind === "raven" ? "ravens_eye_like" : "tavern_favor";

  if (kind === "thread") {
    const { data: thread } = await supabase.from("forum_threads").select("user_author_id,title,body").eq("id", targetId).maybeSingle();
    recipient = thread?.user_author_id ?? null;
    sourceLabel = thread?.title ?? "Tavern discussion";
    notificationContext = { ...notificationContext, parentBody: thread?.body ?? null };
    href = `/forum?thread=${encodeURIComponent(targetId)}`;
  } else if (kind === "post") {
    const { data: post } = await supabase.from("forum_posts").select("user_author_id,thread_id,body").eq("id", targetId).maybeSingle();
    recipient = post?.user_author_id ?? null;
    if (post?.thread_id) {
      const { data: thread } = await supabase.from("forum_threads").select("title").eq("id", post.thread_id).maybeSingle();
      sourceLabel = thread?.title ?? "Tavern discussion";
      href = `/forum?thread=${encodeURIComponent(post.thread_id)}&comment=${encodeURIComponent(targetId)}#comment-${encodeURIComponent(targetId)}`;
      notificationContext = { ...notificationContext, threadId: post.thread_id, parentBody: post.body };
    }
  } else {
    const { data: comment } = await supabase.from("raven_comments").select("user_author_id,entry_id,body").eq("id", targetId).maybeSingle();
    recipient = comment?.user_author_id ?? null;
    if (comment?.entry_id) {
      const entry = gallery.find((item) => item.id === comment.entry_id);
      sourceLabel = entry?.caption?.trim().split("\n")[0].slice(0, 130) || "The Raven's Eye";
      href = ravenLink(comment.entry_id, targetId);
      notificationContext = { ...notificationContext, entryId: comment.entry_id, commentId: targetId, parentBody: comment.body };
    }
  }

  if (!recipient || recipient === user.id) return NextResponse.json({ ok: true, notified: false });
  after(() => dispatchSiteNotification({
    recipientUserId: recipient!,
    actorUserId: user.id,
    actorName: actor?.display_name ?? null,
    kind: notificationKind,
    href,
    sourceLabel,
    context: notificationContext,
    groupKey: `reaction:${kind}:${targetId}`,
    dedupeKey: `reaction:${user.id}:${kind}:${targetId}:${like.created_at}`,
  }));
  return NextResponse.json({ ok: true, notified: true });
}
