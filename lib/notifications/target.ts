import type { SiteNotification } from "./types";

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function safeStoredHref(value: string | null | undefined) {
  return value && value.startsWith("/") ? value : "/notifications";
}

/**
 * Resolve the actual destination of a notification from its semantic context.
 * Context wins over the stored href for notification kinds where we have a
 * stable object id. This also repairs older rows that were recorded with a
 * stale or incorrect href before the Rookery routing fixes landed.
 */
export function notificationTargetHref(notification: Pick<SiteNotification, "kind" | "href" | "context">) {
  const context = notification.context ?? {};
  const stored = safeStoredHref(notification.href);

  if (notification.kind === "direct_raven" || notification.kind === "guild_parley") {
    const conversationId = text(context.conversationId);
    return conversationId ? `/messages/${encodeURIComponent(conversationId)}?unread=1` : stored;
  }

  if (notification.kind === "tavern_answer" || notification.kind === "tavern_participant_activity" || notification.kind === "new_tavern_thread") {
    const threadId = text(context.threadId);
    const commentId = text(context.commentId);
    if (threadId) {
      const query = new URLSearchParams({ thread: threadId });
      if (commentId) query.set("comment", commentId);
      return `/forum?${query.toString()}${commentId ? `#comment-${encodeURIComponent(commentId)}` : ""}`;
    }
    return stored;
  }

  if (notification.kind === "tavern_favor") {
    const targetKind = text(context.targetKind);
    const targetId = text(context.targetId);
    const threadId = text(context.threadId);
    if (targetKind === "thread" && targetId) return `/forum?thread=${encodeURIComponent(targetId)}`;
    if (threadId) {
      const query = new URLSearchParams({ thread: threadId });
      if (targetKind === "post" && targetId) query.set("comment", targetId);
      return `/forum?${query.toString()}${targetKind === "post" && targetId ? `#comment-${encodeURIComponent(targetId)}` : ""}`;
    }
    return stored;
  }

  if (notification.kind === "ravens_eye_answer" || notification.kind === "ravens_eye_like" || notification.kind === "ravens_eye_root_comment") {
    // The stored href deliberately preserves the correct Raven's Eye subsection
    // (main Eye, Gutter Memes, or Gutter Reels). Only reject obviously unrelated
    // legacy destinations instead of flattening every entry to one route.
    if (stored.startsWith("/ravens-eye")) return stored;
    const entryId = text(context.entryId);
    const commentId = text(context.commentId) ?? (notification.kind === "ravens_eye_like" ? text(context.targetId) : null);
    if (entryId) {
      const query = new URLSearchParams({ item: entryId });
      if (commentId) query.set("comment", commentId);
      return `/ravens-eye?${query.toString()}${commentId ? `#comment-${encodeURIComponent(commentId)}` : ""}`;
    }
    return "/ravens-eye";
  }

  if (notification.kind === "ravens_eye_image" || notification.kind === "gutter_meme" || notification.kind === "gutter_reel") {
    if (stored.startsWith("/ravens-eye")) return stored;
    return notification.kind === "gutter_meme" ? "/ravens-eye/memes" : notification.kind === "gutter_reel" ? "/ravens-eye/reels" : "/ravens-eye";
  }


  if (notification.kind === "guestbook_entry" || notification.kind === "guestbook_reply") {
    const username = text(context.profileUsername);
    return username ? `/users/${encodeURIComponent(username)}#guestbook` : stored;
  }

  if (notification.kind === "new_chapter") {
    return stored.startsWith("/chapters") ? stored : "/chapters";
  }

  return stored;
}
