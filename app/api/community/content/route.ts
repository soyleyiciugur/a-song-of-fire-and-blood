import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import forum from "@/data/forum.json";
import gallery from "@/data/gallery.json";
import community from "@/data/flea-bottom.json";
import { publishCommunity } from "@/lib/communityPublication.mjs";
import { broadcastSiteNotification, dispatchSiteNotification } from "@/lib/notifications/server";
import type { ForumSource } from "@/lib/communityTypes";

const schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("thread"), title: z.string().trim().min(3).max(140), body: z.string().trim().min(1).max(10000), category: z.string().trim().min(1).max(60).default("Community") }),
  z.object({ kind: z.literal("post"), threadId: z.string().min(1).max(160), parentId: z.string().min(1).max(160).nullable().optional(), body: z.string().trim().min(1).max(10000) }),
  z.object({ kind: z.literal("raven"), entryId: z.string().min(1).max(160), parentId: z.string().min(1).max(160).nullable().optional(), body: z.string().trim().min(1).max(4000) }),
]);

function ravenEntryLink(entryId: string, commentId: string) {
  const entry = gallery.find((item) => item.id === entryId);
  if (!entry) return "/ravens-eye";
  const base = /\.(mp4|webm|mov)$/i.test(entry.src.split(/[?#]/)[0]) ? "/ravens-eye/reels" : entry.category === "fleabottom" ? "/ravens-eye/memes" : "/ravens-eye";
  const params = new URLSearchParams({ item: entry.id, comment: commentId });
  return `${base}?${params}#comment-${encodeURIComponent(commentId)}`;
}

function galleryLabel(entryId: string) {
  const entry = gallery.find((item) => item.id === entryId);
  return entry?.caption?.trim().split("\n")[0].slice(0, 130) || "The Raven's Eye";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to join the discussion." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("id,display_name,username").eq("id", user.id).maybeSingle();
  if (!profile) {
    const { error: profileError } = await supabase.rpc("ensure_own_profile");
    if (profileError) {
      console.error("Profile repair failed", { code: profileError.code, message: profileError.message });
      return NextResponse.json({ error: "Your member profile is not ready. Apply the latest database migration and try again." }, { status: 409 });
    }
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the required fields and length limits." }, { status: 400 });
  const input = parsed.data;
  const published = publishCommunity(community, [], Date.now(), forum as unknown as ForumSource);

  if (input.kind !== "thread" && input.parentId) {
    const parentTable = input.kind === "post" ? "forum_posts" : "raven_comments";
    const entry = input.kind === "post" ? input.threadId : input.entryId;
    const staticParent = published.comments.some((comment) => comment.id === input.parentId && comment.entryId === entry && (input.kind === "post" ? comment.surface === "forum" : !comment.surface));
    const { data: liveParent } = staticParent ? { data: null } : await supabase.from(parentTable).select("id").eq("id", input.parentId).eq(input.kind === "post" ? "thread_id" : "entry_id", entry).eq("is_visible", true).maybeSingle();
    if (!staticParent && !liveParent) return NextResponse.json({ error: "The comment you are replying to is unavailable." }, { status: 404 });
  }

  if (input.kind === "thread") {
    const { data: insertedThread, error } = await supabase.from("forum_threads").insert({ title: input.title, body: input.body, category: input.category, author_type: "user", user_author_id: user.id }).select("id").single();
    if (error || !insertedThread) {
      console.error("Community insert failed", { code: error.code, message: error.message });
      return NextResponse.json({ error: error.code === "42501" ? "Your session does not have permission to post. Sign out and sign in again." : "Your contribution could not be saved. Please try again." }, { status: 400 });
    }
    after(() => broadcastSiteNotification({
      actorUserId: user.id, actorName: profile?.display_name ?? null, kind: "new_tavern_thread",
      href: `/forum?thread=${encodeURIComponent(insertedThread.id)}`, sourceLabel: input.title,
      context: { threadId: insertedThread.id, threadBody: input.body, actorUsername: profile?.username ?? undefined }, groupKey: "new-tavern-threads",
      dedupeKey: `new-thread:${insertedThread.id}:{recipient}`,
    }));
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (input.kind === "post") {
    const staticThread = published.forumThreads.find((thread: { id: string }) => thread.id === input.threadId);
    const { data: liveThread } = staticThread ? { data: null } : await supabase.from("forum_threads").select("id,title,is_locked,user_author_id,chapter_slug").eq("id", input.threadId).maybeSingle();
    if (!staticThread && (!liveThread || liveThread.is_locked)) return NextResponse.json({ error: "This discussion is unavailable or locked." }, { status: 404 });

    const { data: inserted, error } = await supabase.from("forum_posts").insert({ thread_id: input.threadId, parent_id: input.parentId ?? null, body: input.body, author_type: "user", user_author_id: user.id }).select("id").single();
    if (error || !inserted) {
      console.error("Community insert failed", { code: error?.code, message: error?.message });
      return NextResponse.json({ error: error?.code === "42501" ? "Your session does not have permission to post. Sign out and sign in again." : "Your contribution could not be saved. Please try again." }, { status: 400 });
    }

    let recipient: string | null = null;
    let parentBody: string | null = null;
    if (input.parentId) {
      const staticParent = published.comments.find((comment) => comment.id === input.parentId && comment.surface === "forum");
      const { data: parent } = staticParent ? { data: null } : await supabase.from("forum_posts").select("user_author_id,body").eq("id", input.parentId).maybeSingle();
      recipient = parent?.user_author_id ?? staticParent?.authorId ?? null;
      parentBody = parent?.body ?? staticParent?.body ?? null;
    }
    if (!recipient && liveThread?.user_author_id) recipient = liveThread.user_author_id;
    const sourceLabel = staticThread?.title ?? liveThread?.title ?? "Tavern discussion";
    if (recipient && recipient !== user.id) after(() => dispatchSiteNotification({
      recipientUserId: recipient,
      actorUserId: user.id,
      actorName: profile?.display_name ?? null,
      kind: "tavern_answer",
      href: `/forum?thread=${encodeURIComponent(input.threadId)}&comment=${encodeURIComponent(inserted.id)}#comment-${encodeURIComponent(inserted.id)}`,
      sourceLabel,
      context: { threadId: input.threadId, commentId: inserted.id, parentId: input.parentId ?? null, parentBody, replyBody: input.body, actorUsername: profile?.username ?? undefined },
      groupKey: `forum-thread:${input.threadId}`,
      dedupeKey: `forum-post:${inserted.id}:${recipient}`,
    }));
    after(async () => {
      const { data: participants } = await supabase.from("forum_posts").select("user_author_id").eq("thread_id", input.threadId).not("user_author_id", "is", null);
      const recipients = [...new Set((participants ?? []).map((row) => row.user_author_id).filter((id): id is string => Boolean(id) && id !== user.id && id !== recipient))];
      for (const participant of recipients) await dispatchSiteNotification({
        recipientUserId: participant, actorUserId: user.id, actorName: profile?.display_name ?? null, kind: "tavern_participant_activity",
        href: `/forum?thread=${encodeURIComponent(input.threadId)}&comment=${encodeURIComponent(inserted.id)}#comment-${encodeURIComponent(inserted.id)}`,
        sourceLabel, context: { threadId: input.threadId, commentId: inserted.id, replyBody: input.body, actorUsername: profile?.username ?? undefined }, groupKey: `forum-thread:${input.threadId}`,
        dedupeKey: `forum-participant:${inserted.id}:${participant}`,
      });
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  if (!gallery.some((entry) => entry.id === input.entryId)) return NextResponse.json({ error: "This Raven’s Eye entry is unavailable." }, { status: 404 });
  const { data: inserted, error } = await supabase.from("raven_comments").insert({ entry_id: input.entryId, parent_id: input.parentId ?? null, body: input.body, author_type: "user", user_author_id: user.id }).select("id").single();
  if (error || !inserted) {
    console.error("Community insert failed", { code: error?.code, message: error?.message });
    return NextResponse.json({ error: error?.code === "42501" ? "Your session does not have permission to post. Sign out and sign in again." : "Your contribution could not be saved. Please try again." }, { status: 400 });
  }
  if (input.parentId) {
    const staticParent = published.comments.find((comment) => comment.id === input.parentId && !comment.surface);
    const { data: parent } = staticParent ? { data: null } : await supabase.from("raven_comments").select("user_author_id,body").eq("id", input.parentId).maybeSingle();
    const recipient = parent?.user_author_id ?? staticParent?.authorId ?? null;
    const parentBody = parent?.body ?? staticParent?.body ?? null;
    if (recipient && recipient !== user.id) after(() => dispatchSiteNotification({
      recipientUserId: recipient,
      actorUserId: user.id,
      actorName: profile?.display_name ?? null,
      kind: "ravens_eye_answer",
      href: ravenEntryLink(input.entryId, inserted.id),
      sourceLabel: galleryLabel(input.entryId),
      context: { entryId: input.entryId, commentId: inserted.id, parentId: input.parentId, parentBody, replyBody: input.body, actorUsername: profile?.username ?? undefined },
      groupKey: `raven-entry:${input.entryId}`,
      dedupeKey: `raven-comment:${inserted.id}:${recipient}`,
    }));
  } else {
    after(() => broadcastSiteNotification({
      actorUserId: user.id, actorName: profile?.display_name ?? null, kind: "ravens_eye_root_comment",
      href: ravenEntryLink(input.entryId, inserted.id), sourceLabel: galleryLabel(input.entryId),
      context: { entryId: input.entryId, commentId: inserted.id, replyBody: input.body, actorUsername: profile?.username ?? undefined }, groupKey: `raven-entry:${input.entryId}`,
      dedupeKey: `raven-root:${inserted.id}:{recipient}`,
    }));
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { kind?: string; id?: string } | null;
  if (!body?.id || !["thread", "post", "raven"].includes(body.kind ?? "")) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const table = body.kind === "thread" ? "forum_threads" : body.kind === "post" ? "forum_posts" : "raven_comments";
  const { error } = await supabase.from(table).delete().eq("id", body.id);
  return error ? NextResponse.json({ error: "Not permitted." }, { status: 403 }) : NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { kind?: string; id?: string; body?: string } | null;
  const limit = body?.kind === "raven" ? 4000 : 10000;
  if (!body?.id || !["thread", "post", "raven"].includes(body.kind ?? "") || !body.body?.trim() || body.body.length > limit) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const table = body.kind === "thread" ? "forum_threads" : body.kind === "post" ? "forum_posts" : "raven_comments";
  const { error } = await supabase.from(table).update({ body: body.body.trim() }).eq("id", body.id);
  return error ? NextResponse.json({ error: "Not permitted." }, { status: 403 }) : NextResponse.json({ ok: true });
}
