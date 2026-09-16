"use client";

import PageTitleIcon from "@/components/nav/PageTitleIcon";
import NotificationPortrait from "@/components/notifications/NotificationPortrait";
import NotificationSourceIcon from "@/components/notifications/NotificationSourceIcon";
import MiniPortrait from "@/components/MiniPortrait";
import { RavenMessagePreview } from "@/components/direct-raven/RavenMessageContent";
import GuildAvatar from "@/components/direct-raven/GuildAvatar";
import { MASCOT_META, type NotificationMascot, type NotificationSource, type SiteNotification } from "@/lib/notifications/types";
import { notificationSourceLabel } from "@/lib/notifications/source";
import { notificationTargetHref } from "@/lib/notifications/target";
import { createClient } from "@/lib/supabase/client";
import { useCommunity, refreshCommunity } from "@/lib/communityStore";
import { getCommentEntryLabel, getCommentLink } from "@/lib/communityLinks";
import { groupNotifications, notificationTimeGroup } from "@/lib/notificationTime.mjs";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./notifications.module.css";

const PAGE_SIZE = 40;
type ActivityFilter = "for-you" | "all";
type LedgerTab = "personal" | "realm";

function isMascot(value: unknown): value is NotificationMascot { return value === "mara" || value === "aldren"; }
function isSource(value: unknown): value is NotificationSource { return ["tavern", "ravens-eye", "direct-raven", "guild-parley", "chronicle", "guestbook", "realm"].includes(String(value)); }

function normalize(row: Record<string, unknown>): SiteNotification | null {
  if (!isMascot(row.mascot) || !isSource(row.source) || typeof row.id !== "string" || typeof row.user_id !== "string") return null;
  return {
    id: row.id, user_id: row.user_id, actor_id: typeof row.actor_id === "string" ? row.actor_id : null,
    kind: row.kind as SiteNotification["kind"], source: row.source, mascot: row.mascot,
    title: String(row.title ?? "Word from the realm"), body: String(row.body ?? "A raven has arrived."),
    href: typeof row.href === "string" && row.href.startsWith("/") ? row.href : "/notifications",
    source_label: typeof row.source_label === "string" ? row.source_label : null,
    context: row.context && typeof row.context === "object" ? row.context as Record<string, unknown> : {},
    created_at: String(row.created_at ?? new Date().toISOString()), read_at: typeof row.read_at === "string" ? row.read_at : null,
  };
}

function ageLabel(value: string, now = Date.now()) {
  const elapsed = Math.max(0, now - Date.parse(value)); const minute = 60_000, hour = 60 * minute, day = 24 * hour;
  if (elapsed < minute) return `${Math.max(1, Math.floor(elapsed / 1000))}s`;
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)}d`;
  const date = new Date(value), current = new Date(now);
  return date.getFullYear() === current.getFullYear() ? `${date.getDate()}/${date.getMonth() + 1}` : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}
function groupLabel(value: string, now = new Date()) {
  const date = new Date(value); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); const delta = Math.round((today - target) / 86_400_000);
  if (delta === 0) return "Today"; if (delta === 1) return "Yesterday"; if (delta < 7) return "This week";
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" }).format(date);
}
function ctaLabel(source: NotificationSource) { if (source === "tavern") return "Enter the tavern"; if (source === "ravens-eye") return "Follow the sighting"; if (source === "direct-raven") return "Read the raven"; if (source === "guild-parley") return "Enter the parley"; if (source === "chronicle") return "Open the Chronicle"; if (source === "guestbook") return "Open the guestbook"; return "See the notice"; }

function ReplyIndicator() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9.25 8.25 5.5 12l3.75 3.75M6 12h6.25c3.45 0 5.75 1.8 6.25 5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function visualNotificationSource(source: NotificationSource): NotificationSource {
  return source === "guild-parley" ? "direct-raven" : source;
}

function notificationTidingsCount(item: SiteNotification) {
  const value = Number(item.context?.groupCount ?? 1);
  return Number.isFinite(value) && value > 1 ? Math.floor(value) : 1;
}

function personalGroupKey(item: SiteNotification) {
  const context = item.context ?? {};
  const explicit = typeof context.groupKey === "string" ? context.groupKey : null;
  if (explicit) return `${item.source}:${explicit}`;
  const conversationId = typeof context.conversationId === "string" ? context.conversationId : null;
  if (conversationId) return `${item.source}:conversation:${conversationId}`;
  const threadId = typeof context.threadId === "string" ? context.threadId : null;
  if (threadId) return `${item.source}:thread:${threadId}`;
  const entryId = typeof context.entryId === "string" ? context.entryId : null;
  if (entryId) return `${item.source}:entry:${entryId}`;
  const profileId = typeof context.profileId === "string" ? context.profileId : null;
  if (profileId) return `${item.source}:profile:${profileId}`;
  return null;
}

type CommunityIdentity = {
  username?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  color?: string | null;
  avatar?: string | null;
  account?: { type?: string | null; characterId?: string | null } | null;
};

function PersonalNotificationPortrait({ item, size }: { item: SiteNotification; size: number }) {
  const context = item.context ?? {};
  if (item.source === "guild-parley") {
    const path = typeof context.guildAvatarPath === "string" ? context.guildAvatarPath : null;
    const title = typeof context.conversationTitle === "string" ? context.conversationTitle : item.source_label || "Guild Parley";
    return <GuildAvatar path={path} name={title} size={size} />;
  }
  if (item.source === "direct-raven") {
    const avatarUrl = typeof context.actorAvatarUrl === "string" ? context.actorAvatarUrl : null;
    const username = typeof context.actorUsername === "string" ? context.actorUsername : "DR";
    return <span className={styles.messageNotificationAvatar} style={{ width: size, height: size }} aria-hidden="true">
      {avatarUrl ? <img src={avatarUrl} alt="" /> : username.slice(0, 2).toUpperCase()}
    </span>;
  }
  return <NotificationPortrait mascot={item.mascot} source={item.source} size={size} />;
}

function CommunityIdentityAvatar({ user, username, avatarUrl, size = 28 }: { user?: CommunityIdentity | null; username?: string | null; avatarUrl?: string | null; size?: number }) {
  const displayName = user?.displayName ?? user?.username ?? username ?? "Unknown patron";
  const initials = (user?.avatar ?? displayName).replace(/^@/, "").slice(0, 2).toUpperCase();
  const finalAvatarUrl = avatarUrl ?? user?.avatarUrl ?? null;
  const characterId = user?.account?.type === "character" && typeof user?.account?.characterId === "string" ? user.account.characterId : null;
  if (characterId) return <MiniPortrait id={characterId} alt={displayName} size={size} />;
  if (finalAvatarUrl) return <span className={styles.inlineIdentityAvatar} style={{ width: size, height: size }} aria-hidden="true"><img src={finalAvatarUrl} alt="" /></span>;
  return <span className={styles.inlineIdentityAvatar} style={{ width: size, height: size, backgroundColor: user?.color ?? "#51363d" }} aria-hidden="true">{initials}</span>;
}

function Notifications() {
  const community = useCommunity(); const params = useSearchParams(); const router = useRouter(); const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null), [authReady, setAuthReady] = useState(false);
  const [items, setItems] = useState<SiteNotification[]>([]), [extra, setExtra] = useState<SiteNotification | null>(null);
  const requestedView = params.get("view");
  const initialRealmView = requestedView === "all" ? "all" : "for-you";
  const [limit, setLimit] = useState(PAGE_SIZE), [activityLimit, setActivityLimit] = useState(30), [activityFilter, setActivityFilter] = useState<ActivityFilter>(initialRealmView);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [hasMore, setHasMore] = useState(false);
  const [fallbackNow] = useState(() => Date.now());
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>(requestedView === "for-you" || requestedView === "all" ? "realm" : "personal");
  const [markingAll, setMarkingAll] = useState(false), [readStatus, setReadStatus] = useState("");
  const [dismissedOpenId, setDismissedOpenId] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const readOverrides = useRef(new Map<string, string>());
  const bulkOverrides = useRef(new Map<string, string>());
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const openId = params.get("open");

  const setRookeryView = useCallback((view: "personal" | "for-you" | "all") => {
    // Read the browser's actual URL. On iOS/PWA, useSearchParams() can lag
    // behind a fast tab interaction by one render.
    const next = new URLSearchParams(window.location.search);
    next.set("view", view);
    next.delete("tab");
    if (view !== "personal") next.delete("open");
    const query = next.toString();
    const href = `/notifications${query ? `?${query}` : ""}`;

    // Commit the visual state first so a delayed params render cannot bounce
    // the user back to Personal Ravens.
    if (view === "personal") {
      setLedgerTab("personal");
    } else {
      setLedgerTab("realm");
      setActivityFilter(view);
      setActivityLimit(30);
    }

    // Native history updates are synchronous and are observed by Next 16.
    // Avoid a competing router.replace transition on mobile.
    window.history.replaceState(window.history.state, "", href);
  }, []);

  const load = useCallback(async (id: string | null, requestedLimit = limit) => {
    setLoading(true); setError("");
    if (!id) { setItems([]); setExtra(null); setHasMore(false); setLoading(false); return; }
    const { data, error: readError } = await supabase.from("site_notifications").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(requestedLimit + 1);
    if (readError) { setError("The personal raven ledger could not be gathered. Community activity remains below."); setLoading(false); return; }
    const normalized = (data ?? [])
      .map((row) => normalize(row as unknown as Record<string, unknown>))
      .filter((row): row is SiteNotification => Boolean(row))
      .map((item) => {
        const bulk = bulkOverrides.current.get(id);
        return {
          ...item,
          read_at: item.read_at ?? readOverrides.current.get(item.id) ?? (bulk && item.created_at <= bulk ? bulk : null),
        };
      });
    setHasMore(normalized.length > requestedLimit); setItems(normalized.slice(0, requestedLimit)); setLoading(false);
  }, [limit, supabase]);

  const markRead = useCallback(async (id?: string) => {
    if (!userId || (id && readOverrides.current.has(id))) return;
    const readAt = new Date().toISOString();
    const previousBulk = bulkOverrides.current.get(userId);

    if (id) readOverrides.current.set(id, readAt);
    else {
      bulkOverrides.current.set(userId, readAt);
      setMarkingAll(true);
    }

    const mark = (item: SiteNotification) =>
      (!id || item.id === id) && item.created_at <= readAt
        ? { ...item, read_at: item.read_at ?? readAt }
        : item;

    setItems((current) => current.map(mark));
    setExtra((current) => current ? mark(current) : current);
    setReadStatus("");

    try {
      let query = supabase
        .from("site_notifications")
        .update({ read_at: readAt })
        .eq("user_id", userId)
        .is("read_at", null);

      query = id ? query.eq("id", id) : query.lte("created_at", readAt);
      const { error: markError } = await query;
      if (markError) throw markError;

      if (!id) {
        try { if ("clearAppBadge" in navigator) await navigator.clearAppBadge(); } catch {}
        setReadStatus("Every waiting raven has been heard.");
      }
      window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
    } catch {
      if (id) readOverrides.current.delete(id);
      else if (previousBulk) bulkOverrides.current.set(userId, previousBulk);
      else bulkOverrides.current.delete(userId);

      await load(userId, limit);
      setReadStatus("The ledger could not be sealed. Please try again.");
    } finally {
      if (!id) setMarkingAll(false);
    }
  }, [limit, load, supabase, userId]);

  useEffect(() => { let alive = true; const resolveUser = async () => { const { data: { user } } = await supabase.auth.getUser(); if (!alive) return; setUserId(user?.id ?? null); setAuthReady(true); }; void resolveUser(); const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (!alive) return; setUserId(session?.user.id ?? null); setAuthReady(true); setLimit(PAGE_SIZE); }); return () => { alive = false; data.subscription.unsubscribe(); }; }, [supabase]);
  useEffect(() => { if (!authReady) return; const timer = window.setTimeout(() => void load(userId, limit), 0); return () => window.clearTimeout(timer); }, [authReady, limit, load, userId]);
  useEffect(() => { if (!userId) return; const refresh = () => void load(userId, limit); const onVisible = () => { if (document.visibilityState === "visible") refresh(); }; window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", onVisible); const channel = supabase.channel(`site-notifications-page:${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "site_notifications", filter: `user_id=eq.${userId}` }, refresh).subscribe(); return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); void supabase.removeChannel(channel); }; }, [limit, load, supabase, userId]);
  const effectiveOpenId = openedId ?? openId;
  useEffect(() => { if (!effectiveOpenId || !userId || items.some((item) => item.id === effectiveOpenId)) return; let active = true; void supabase.from("site_notifications").select("*").eq("user_id", userId).eq("id", effectiveOpenId).maybeSingle().then(({ data }) => { if (active) setExtra(data ? normalize(data as unknown as Record<string, unknown>) : null); }); return () => { active = false; }; }, [effectiveOpenId, items, supabase, userId]);

  useEffect(() => {
    if (effectiveOpenId) return;

    // window.location is already updated synchronously by setRookeryView,
    // while useSearchParams() can briefly still contain the previous tab.
    const view = new URLSearchParams(window.location.search).get("view");

    if (view === "for-you" || view === "all") {
      setLedgerTab("realm");
      setActivityFilter(view);
    } else {
      setLedgerTab("personal");
    }
  }, [effectiveOpenId, params]);

  const activeNotification = effectiveOpenId && effectiveOpenId !== dismissedOpenId
    ? items.find((item) => item.id === effectiveOpenId) ?? (extra?.id === effectiveOpenId ? extra : null)
    : null;

  useEffect(() => {
    if (openId && openId !== dismissedOpenId) {
      setOpenedId(openId);
      setDismissedOpenId(null);
    }
  }, [openId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeNotification) {
      setLedgerTab("personal");
      if (!activeNotification.read_at) void markRead(activeNotification.id);
    }
  }, [activeNotification?.id, markRead]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (authReady && !userId) setLedgerTab("realm");
  }, [authReady, userId]);

  useEffect(() => {
    if (!activeNotification) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
        .filter((node) => !node.hasAttribute("hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", onKey);
      cancelAnimationFrame(frame);
    };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [activeNotification?.id]);

  useEffect(() => { if (params.get("tab") === "updates") router.replace("/update-notes"); }, [params, router]);

  function setOpen(id: string) {
    setOpenedId(id);
    setDismissedOpenId(null);

    const next = new URL(window.location.href);
    next.searchParams.set("open", id);
    next.searchParams.set("view", "personal");
    next.searchParams.delete("tab");

    // Local state opens the lightbox immediately. Keep the deep-link URL in
    // sync without starting a second Next navigation/render cycle.
    window.history.replaceState(
      window.history.state,
      "",
      `${next.pathname}${next.search}${next.hash}`,
    );
  }

  function closeLightbox() {
    if (effectiveOpenId) setDismissedOpenId(effectiveOpenId);
    setOpenedId(null);
    setExtra(null);

    const next = new URL(window.location.href);
    next.searchParams.delete("open");
    next.searchParams.delete("tab");
    next.searchParams.set("view", "personal");

    // Closing is a local UI action, not a route transition. Updating history
    // alone preserves the deep-link state without the visible desktop
    // refresh/flicker caused by a competing router.replace().
    window.history.replaceState(
      window.history.state,
      "",
      `${next.pathname}${next.search}${next.hash}`,
    );
  }

  const grouped = useMemo(() => { const groups = new Map<string, SiteNotification[]>(); for (const item of items) { const label = groupLabel(item.created_at); groups.set(label, [...(groups.get(label) ?? []), item]); } return [...groups]; }, [items]);
  const personalGroups = useMemo(() => grouped.map(([label, notifications]) => {
    const buckets: { key: string; items: SiteNotification[] }[] = [];
    const indexed = new Map<string, { key: string; items: SiteNotification[] }>();
    for (const item of notifications) {
      const semanticKey = personalGroupKey(item);
      if (!semanticKey) { buckets.push({ key: item.id, items: [item] }); continue; }
      const existing = indexed.get(semanticKey);
      if (existing) existing.items.push(item);
      else { const bucket = { key: semanticKey, items: [item] }; indexed.set(semanticKey, bucket); buckets.push(bucket); }
    }
    return [label, buckets] as const;
  }), [grouped]);
  const unreadCount = items.reduce((count, item) => count + (item.read_at ? 0 : 1), 0);

  // Legacy/community activity remains visible instead of being replaced by the mascot ledger.
  const users = useMemo(() => new Map(community.users.map((user) => [user.id, user])), [community.users]);
  const usersByKnownName = useMemo(() => {
    const map = new Map<string, (typeof community.users)[number]>();
    for (const user of community.users) {
      if (user.username) map.set(user.username.toLowerCase(), user);
      if (user.displayName) map.set(user.displayName.toLowerCase(), user);
    }
    return map;
  }, [community.users]);
  const commentsById = useMemo(() => new Map(community.comments.map((comment) => [comment.id, comment])), [community.comments]);
  const threadsById = useMemo(() => new Map(community.forumThreads.map((thread) => [thread.id, thread])), [community.forumThreads]);
  const allComments = useMemo(() => community.comments.map((comment, order) => ({ comment, order })).sort((a, b) => Date.parse(b.comment.publishedAt) - Date.parse(a.comment.publishedAt) || b.order - a.order).map(({ comment }) => comment).filter((comment) => comment.authorId !== userId), [community.comments, userId]);
  const forYou = useMemo(() => userId ? allComments.filter((comment) => { const parent = comment.parentId ? commentsById.get(comment.parentId) : null; if (parent?.authorId === userId) return true; if (comment.surface === "forum" && threadsById.get(comment.entryId)?.authorId === userId) return true; return false; }) : [], [allComments, commentsById, threadsById, userId]);
  const activityComments = activityFilter === "for-you" && userId ? forYou : allComments;
  const activityNow = community.serverTime ? Date.parse(community.serverTime) : fallbackNow;
  const activityGroups = groupNotifications(activityComments.slice(0, activityLimit), activityNow);
  const previewForNotification = useCallback((item: SiteNotification) => {
    const context = item.context ?? {};
    const parentId = typeof context.parentId === "string" ? context.parentId : null;
    const commentId = typeof context.commentId === "string" ? context.commentId : null;
    const parentComment = parentId ? commentsById.get(parentId) ?? null : null;
    const parentBody = typeof context.parentBody === "string" ? context.parentBody : parentComment?.body ?? null;
    const replyBody = typeof context.replyBody === "string" ? context.replyBody : typeof context.threadBody === "string" ? context.threadBody : commentId ? commentsById.get(commentId)?.body ?? null : null;
    if (!parentBody && !replyBody) return null;

    const actor = item.actor_id ? users.get(item.actor_id) : null;
    const contextActorUsername = typeof context.actorUsername === "string" && context.actorUsername.trim() ? context.actorUsername.trim().replace(/^@/, "") : null;
    const contextActorName = typeof context.actorName === "string" && context.actorName.trim() ? context.actorName.trim() : null;
    const actorByKnownName = contextActorName ? usersByKnownName.get(contextActorName.toLowerCase()) ?? null : null;
    const actorUsername = contextActorUsername ?? actor?.username ?? actorByKnownName?.username ?? null;

    const parentAuthorId = typeof context.parentAuthorId === "string" ? context.parentAuthorId : parentComment?.authorId ?? null;
    const parentAuthor = parentAuthorId ? users.get(parentAuthorId) ?? null : null;
    const parentUsername = parentAuthor?.username ?? null;
    const contextTitle =
      typeof context.threadTitle === "string" ? context.threadTitle
      : typeof context.entryTitle === "string" ? context.entryTitle
      : item.source_label;
    const actorUser = actor ?? actorByKnownName ?? null;
    const actorAvatarUrl = typeof context.actorAvatarUrl === "string" && context.actorAvatarUrl ? context.actorAvatarUrl : actorUser?.avatarUrl ?? null;

    return {
      contextTitle,
      parentBody,
      replyBody,
      ravenPreview: item.source === "direct-raven" || item.source === "guild-parley",
      parentLabel: parentUsername ? `@${parentUsername}` : parentAuthorId && parentAuthorId === userId ? "You" : "Earlier words",
      actorLabel: actorUsername ? `@${actorUsername}` : contextActorName ?? "Someone",
      parentUser: parentAuthor,
      actorUser,
      actorAvatarUrl,
      actorUsername,
    };
  }, [commentsById, userId, users, usersByKnownName]);

  const activePreview = useMemo(() => activeNotification ? previewForNotification(activeNotification) : null, [activeNotification, previewForNotification]);

  const personalTargetHref = useCallback((item: SiteNotification) => {
    const target = notificationTargetHref(item);
    if (!target.startsWith("/ravens-eye")) return target;
    const url = new URL(target, "https://asofab.local");
    url.searchParams.set("returnTo", "/notifications?view=personal");
    return `${url.pathname}${url.search}${url.hash}`;
  }, []);

  const renderInlinePreview = (item: SiteNotification, preview = previewForNotification(item), nested = false) => {
    if (!preview) return null;
    const ravenMessageRow = (body: string, label: string, user: CommunityIdentity | null | undefined, username?: string | null, avatarUrl?: string | null, extraClass = "") => (
      <span className={`${styles.cardPreviewMessage} ${styles.cardPreviewRavenMessage} ${extraClass}`}>
        <span className={styles.cardPreviewAvatar}><CommunityIdentityAvatar user={user} username={username ?? label} avatarUrl={avatarUrl} size={nested ? 26 : 28} /></span>
        <span className={styles.cardPreviewCopy}><b>{label}</b><span><RavenMessagePreview body={body} /></span></span>
      </span>
    );
    return <span className={`${styles.cardPreview} ${nested ? styles.cardPreviewNested : ""} ${preview.ravenPreview ? styles.cardPreviewRaven : ""}`} aria-label="Notification preview">
      {preview.parentBody && (preview.ravenPreview
        ? ravenMessageRow(preview.parentBody, preview.parentLabel, preview.parentUser, preview.parentLabel, null, styles.cardPreviewParent)
        : <span className={`${styles.cardPreviewMessage} ${styles.cardPreviewParent}`}>
            <span className={styles.cardPreviewMarker}><ReplyIndicator /></span>
            <span className={styles.cardPreviewAvatar}><CommunityIdentityAvatar user={preview.parentUser} username={preview.parentLabel} size={nested ? 26 : 28} /></span>
            <span className={styles.cardPreviewCopy}><b>{preview.parentLabel}</b><span>“{preview.parentBody}”</span></span>
          </span>)}
      {preview.replyBody && (preview.ravenPreview
        ? ravenMessageRow(preview.replyBody, preview.actorLabel, preview.actorUser, preview.actorUsername ?? preview.actorLabel, preview.actorAvatarUrl, styles.cardPreviewReply)
        : <span className={`${styles.cardPreviewMessage} ${styles.cardPreviewReply}`}>
            <span className={`${styles.cardPreviewMarker} ${styles.cardPreviewMarkerEmpty}`} aria-hidden="true" />
            <span className={styles.cardPreviewAvatar}><CommunityIdentityAvatar user={preview.actorUser} username={preview.actorUsername ?? preview.actorLabel} avatarUrl={preview.actorAvatarUrl} size={nested ? 26 : 28} /></span>
            <span className={styles.cardPreviewCopy}><b>{preview.actorLabel}</b><span>“{preview.replyBody}”</span></span>
          </span>)}
    </span>;
  };

  const renderPersonalCard = (item: SiteNotification, nested = false) => {
    const target = personalTargetHref(item);
    const preview = previewForNotification(item);
    const hasTarget = target !== "/notifications";
    const simplifiedNested = nested && Boolean(preview);
    return <li key={item.id} className={nested ? styles.groupedPersonalItem : undefined}>
      <div className={`${styles.card} ${!item.read_at ? styles.unreadCard : ""} ${!preview ? styles.cardPlain : ""} ${!hasTarget ? styles.cardNoTarget : ""} ${simplifiedNested ? styles.groupedReplyCard : ""}`}>
        {hasTarget && <Link
          className={styles.cardDestinationLink}
          href={target}
          aria-label={`${item.title}. ${item.body}`}
          onClick={() => { if (!item.read_at) void markRead(item.id); }}
        />}
        <span className={styles.cardSourceRail} aria-hidden="true"><NotificationSourceIcon source={visualNotificationSource(item.source)} size={13} /></span>
        {!simplifiedNested && <button
          type="button"
          className={styles.cardPortraitButton}
          aria-label="Open raven preview"
          onClick={() => setOpen(item.id)}
        >
          <PersonalNotificationPortrait item={item} size={nested ? 44 : 52} />
        </button>}
        <span className={styles.cardContent}>
          <span className={styles.cardTopline}><span className={styles.source}><b>{notificationSourceLabel(item.source)}</b>{item.source_label && <em>· {item.source_label}</em>}</span><time dateTime={item.created_at}>{ageLabel(item.created_at)}</time></span>
          {simplifiedNested ? renderInlinePreview(item, preview, true) : <>
            <span className={styles.cardCompactCopy}><strong className={styles.cardTitle}>{item.title}</strong><span className={styles.cardBody}>{item.body}</span><span className={styles.deliveredBy}>— {MASCOT_META[item.mascot].name}</span></span>
            {renderInlinePreview(item, preview)}
          </>}
        </span>
        {!item.read_at && <span className={styles.unreadDot} aria-label="Unread" />}
        {hasTarget && <svg className={styles.openArrow} width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5l7 7-7 7" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </div>
    </li>;
  };

  const renderActivityCard = (comment: (typeof community.comments)[number], nested = false) => {
    const user = users.get(comment.authorId);
    const parentComment = comment.parentId ? commentsById.get(comment.parentId) ?? null : null;
    const parentUser = parentComment ? users.get(parentComment.authorId) ?? null : null;
    const source: NotificationSource = comment.surface === "forum" ? "tavern" : "ravens-eye";
    const username = user?.username ?? "unknown-patron";
    const parentUsername = parentUser?.username ?? (parentComment ? "unknown-patron" : null);
    const contextLabel = getCommentEntryLabel(comment.entryId);
    const returnView = activityFilter;

    return <li key={comment.id} className={nested ? styles.groupedActivityItem : undefined}>
      <Link
        href={getCommentLink(comment)}
        className={`${styles.legacyCard} ${comment.parentId ? styles.legacyReplyCard : ""}`}
        onClick={() => {
          const current = new URL(window.location.href);
          current.searchParams.set("view", returnView);
          current.searchParams.delete("open");
          window.history.replaceState(window.history.state, "", `${current.pathname}${current.search}${current.hash}`);
        }}
      >
        <span className={styles.activitySourceRail} aria-hidden="true"><NotificationSourceIcon source={source} size={12} /></span>
        <span className={styles.legacyContent}>
          <span className={styles.activityContextLine}>
            <span><b>{notificationSourceLabel(source)}</b><em>· {contextLabel}</em></span>
            <time dateTime={comment.publishedAt}>{notificationTimeGroup(comment.publishedAt, activityNow)}</time>
          </span>
          <span className={styles.activityConversation}>
            {parentComment && <span className={`${styles.activityMessageRow} ${styles.activityParentRow}`}>
              <span className={styles.activityReplyMarker}><ReplyIndicator /></span>
              <CommunityIdentityAvatar user={parentUser as CommunityIdentity | null} username={parentUsername} size={nested ? 30 : 32} />
              <span className={styles.activityMessageCopy}><b>@{parentUsername}</b><span>“{parentComment.body}”</span></span>
            </span>}
            <span className={`${styles.activityMessageRow} ${styles.activityReplyRow}`}>
              <span className={`${styles.activityReplyMarker} ${styles.activityReplyMarkerEmpty}`} aria-hidden="true" />
              <CommunityIdentityAvatar user={user as CommunityIdentity | null} username={username} size={nested ? 30 : 32} />
              <span className={styles.activityMessageCopy}><b>@{username}</b><span>“{comment.body}”</span></span>
            </span>
          </span>
        </span>
        <svg className={styles.openArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
    </li>;
  };

  const renderActivityEntries = (entries: (typeof community.comments)[number][]) => {
    const byEntry = new Map<string, (typeof community.comments)[number][]>();
    for (const comment of entries) {
      const key = `${comment.surface === "forum" ? "forum" : "raven"}:${comment.entryId}`;
      byEntry.set(key, [...(byEntry.get(key) ?? []), comment]);
    }
    return [...byEntry.entries()].map(([key, entryComments]) => {
      if (entryComments.length === 1) return renderActivityCard(entryComments[0]);
      const latest = entryComments[0];
      const source: NotificationSource = latest.surface === "forum" ? "tavern" : "ravens-eye";
      return <li key={key} className={styles.activityClusterItem}><details className={styles.activityCluster}><summary><span className={styles.clusterIdentity}><NotificationSourceIcon source={source} size={13} /><span><strong>{getCommentEntryLabel(latest.entryId)}</strong><small>{entryComments.length} new {entryComments.length === 1 ? "word" : "words"}</small></span></span><span className={styles.clusterMeta}><time dateTime={latest.publishedAt}>{notificationTimeGroup(latest.publishedAt, activityNow)}</time><span className={styles.clusterChevron} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" /></svg></span></span></summary><ol className={styles.clusterFeed}>{entryComments.map((comment) => renderActivityCard(comment, true))}</ol></details></li>;
    });
  };

  return <main className={styles.page}>
    <div className={styles.topRow}><Link href="/" className={styles.back}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>Back to Home</Link>{userId && <Link className={styles.settingsLink} href="/settings#notifications" aria-label="Raven settings" title="Raven settings"><svg className={styles.settingsIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.73v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.73l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle cx="12" cy="12" r="3" /></svg><span className={styles.settingsText}>Raven settings</span></Link>}</div>
    <header className={styles.hero}><span className={styles.heroEyebrow}>The innkeepers have kept your ravens</span><h1 className="realm-page-title">The Rookery<PageTitleIcon name="notifications" /></h1><p>Personal ravens from Mara and Aldren, followed by the wider conversation across the realm.</p></header>

    <nav className={styles.ledgerTabs} role="tablist" aria-label="Rookery ledgers">
      <button type="button" role="tab" aria-selected={ledgerTab === "personal"} onClick={() => setRookeryView("personal")}>Personal Ravens</button>
      <button type="button" role="tab" aria-selected={ledgerTab === "realm"} onClick={() => setRookeryView(activityFilter)}>Across the Realm</button>
    </nav>

    {ledgerTab === "personal" && <div className={styles.ledgerPanel}>
    {!authReady || loading && userId ? <div className={styles.loadingLedger}><span aria-hidden="true">✦</span><p>Gathering the ravens…</p></div> : null}
    {authReady && !userId && <section className={styles.signedOut}><span className={styles.signedOutSigil} aria-hidden="true">✦</span><h2>No name upon the ledger</h2><p>Sign in for personal ravens, account-synced unread state, and Mara/Aldren history. Public community activity remains available below.</p><div><Link href="/login">Sign in</Link><Link href="/register">Join the realm</Link></div></section>}
    {error && userId && <p className={styles.error} role="status">{error} <button type="button" onClick={() => void load(userId, limit)}>Try again</button></p>}

    {userId && <section className={styles.personalLedger} aria-label="Personal raven notifications"><div className={styles.sectionHeading}><span>Personal ravens</span>{unreadCount > 0 && <button className={styles.markAll} type="button" disabled={markingAll || loading} onClick={() => void markRead()}>{markingAll ? "Sealing the ledger…" : "Let no raven go unheard"}</button>}</div>{readStatus && <p className={styles.readStatus} role="status">{readStatus}</p>}
      {!loading && !error && !items.length && <section className={styles.empty}><span aria-hidden="true">✦</span><h2>The rookery is quiet</h2><p>No personal tidings await you.</p></section>}
      {personalGroups.map(([label, buckets]) => <section className={styles.timeGroup} key={label} aria-label={label}><h2 className={styles.timeHeading}>{label}</h2><ol className={styles.feed}>{buckets.map((bucket) => {
        if (bucket.items.length === 1) return renderPersonalCard(bucket.items[0]);
        const latest = bucket.items[0];
        const unread = bucket.items.some((item) => !item.read_at);
        const totalTidings = bucket.items.reduce((sum, item) => sum + notificationTidingsCount(item), 0);
        return <li key={bucket.key} className={styles.personalClusterItem}>
          <details className={`${styles.personalCluster} ${unread ? styles.personalClusterUnread : ""}`}>
            <summary>
              <span className={styles.clusterSourceRail} aria-hidden="true"><NotificationSourceIcon source={visualNotificationSource(latest.source)} size={13} /></span>
              <span className={styles.clusterPortraitStatic} aria-hidden="true">
                <PersonalNotificationPortrait item={latest} size={44} />
              </span>
              <span className={styles.personalClusterIdentity}><span className={styles.clusterSourceLine}><b>{notificationSourceLabel(latest.source)}</b>{latest.source_label && <em>· {latest.source_label}</em>}</span><strong>{latest.title}</strong><small>{totalTidings} fresh {totalTidings === 1 ? "tiding" : "tidings"} · {latest.body}</small></span>
              <span className={styles.personalClusterMeta}><time dateTime={latest.created_at}>{ageLabel(latest.created_at)}</time><span className={styles.clusterChevron} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m9 6 6 6-6 6" /></svg></span></span>
            </summary>
            <ol className={styles.personalClusterFeed}>{bucket.items.map((item) => renderPersonalCard(item, true))}</ol>
          </details>
        </li>;
      })}</ol></section>)}
      {hasMore && <button className={styles.more} type="button" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Gather older ravens</button>}
    </section>}
    </div>}

    {ledgerTab === "realm" && <div className={styles.ledgerPanel}>
    <section className={styles.communityLedger} aria-label="Community activity">
      <div className={styles.communityHeader}><div><span className={styles.sectionKicker}>Across the realm</span><h2>Community activity</h2><p>The familiar web activity feed remains here alongside the new personal raven ledger.</p></div><nav className={styles.activityTabs} aria-label="Community activity filters"><button type="button" aria-pressed={activityFilter === "for-you"} disabled={!userId} onClick={() => setRookeryView("for-you")}>For you</button><button type="button" aria-pressed={activityFilter === "all" || !userId} onClick={() => setRookeryView("all")}>All activity</button></nav></div>
      {!community.loaded && !community.error && <p className={styles.communityStatus}>Loading community activity…</p>}
      {community.error && <p className={styles.error}>{community.error} <button onClick={() => void refreshCommunity()}>Retry</button></p>}
      {activityGroups.map(({ label, entries }) => <section key={label} className={styles.legacyTimeGroup} aria-label={label}><h3 className={styles.timeHeading}>{label}</h3><ol className={styles.legacyFeed}>{renderActivityEntries(entries)}</ol></section>)}
      {community.loaded && !activityComments.length && <p className={styles.communityStatus}>{activityFilter === "for-you" && userId ? "Nothing addressed to you yet." : "No community activity yet."}</p>}
      {activityComments.length > activityLimit && <button className={styles.more} onClick={() => setActivityLimit((value) => value + 30)}>Load more activity</button>}
    </section>
    </div>}

    {activeNotification && <div className={styles.lightboxBackdrop} role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) closeLightbox(); }}><section ref={dialogRef} className={styles.lightbox} role="dialog" aria-modal="true" aria-labelledby="notification-lightbox-title"><button ref={closeRef} className={styles.closeButton} type="button" aria-label="Close notification" onClick={closeLightbox}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" /></svg></button><div className={styles.lightboxOrnament} aria-hidden="true"><span>✦</span></div><div className={styles.lightboxPortrait}><PersonalNotificationPortrait item={activeNotification} size={92} /></div><span className={styles.lightboxSource}><NotificationSourceIcon source={activeNotification.source} size={13} /> {notificationSourceLabel(activeNotification.source)}</span><h2 id="notification-lightbox-title">{activeNotification.title}</h2><p className={styles.lightboxBody}>{activeNotification.body}</p><p className={styles.lightboxSignature}>— {MASCOT_META[activeNotification.mascot].name}</p>{activePreview && <div className={styles.lightboxPreview} aria-label="Notification preview">{activePreview.contextTitle && <div className={styles.previewContext}>{activePreview.contextTitle}</div>}{activePreview.parentBody && <div className={styles.previewMessage}><span>{activePreview.parentLabel}</span><p>{activePreview.ravenPreview ? <RavenMessagePreview body={activePreview.parentBody} /> : <>“{activePreview.parentBody}”</>}</p></div>}{activePreview.parentBody && activePreview.replyBody && <div className={styles.previewDivider} aria-hidden="true"><span>✦</span></div>}{activePreview.replyBody && <div className={`${styles.previewMessage} ${styles.previewReply}`}><span>{activePreview.actorLabel}</span><p>{activePreview.ravenPreview ? <RavenMessagePreview body={activePreview.replyBody} /> : <>“{activePreview.replyBody}”</>}</p></div>}</div>}{activeNotification.source_label && !activePreview?.contextTitle && <p className={styles.lightboxContext}>{activeNotification.source_label}</p>}<time className={styles.lightboxTime} dateTime={activeNotification.created_at}>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(activeNotification.created_at))}</time><div className={styles.lightboxActions}>{notificationTargetHref(activeNotification) !== "/notifications" && <Link className={styles.primaryAction} href={personalTargetHref(activeNotification)}>{ctaLabel(activeNotification.source)} <svg className={styles.actionArrow} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></svg></Link>}<button type="button" className={styles.dismissAction} onClick={closeLightbox}>Return to the rookery</button></div></section></div>}
  </main>;
}

export default function NotificationsPage() { return <Suspense fallback={<main className={styles.page}><div className={styles.loadingLedger}><span aria-hidden="true">✦</span><p>Gathering the ravens…</p></div></main>}><Notifications /></Suspense>; }
