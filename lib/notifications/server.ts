import "server-only";
import { chooseMascot } from "./rotation";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendWebPush } from "@/lib/webPush";
import { reinstallCopy } from "@/lib/pwa/release";
import { notificationCopyOptions, renderNotificationCopy } from "./catalog";
import {
  DEFAULT_NOTIFICATION_FLAGS,
  MASCOT_META,
  NOTIFICATION_KIND_META,
  type MascotMode,
  type NotificationKind,
  type NotificationMascot,
  type NotificationPreferenceFlags,
  type NotificationPreferences,
  type SiteNotification,
} from "./types";

const DEFAULT_PREFS = (userId: string): NotificationPreferences => ({
  user_id: userId,
  mascot_mode: "balanced",
  preferences: { ...DEFAULT_NOTIFICATION_FLAGS },
  last_mascot: null,
  mascot_streak: 0,
  mara_count: 0,
  aldren_count: 0,
  last_variants: {},
});

function normalizeFlags(value: unknown): NotificationPreferenceFlags {
  const incoming = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return Object.fromEntries(
    Object.entries(DEFAULT_NOTIFICATION_FLAGS).map(([key, fallback]) => [key, typeof incoming[key] === "boolean" ? incoming[key] : fallback]),
  ) as NotificationPreferenceFlags;
}

function normalizePreferences(userId: string, row: Record<string, unknown> | null | undefined): NotificationPreferences {
  if (!row) return DEFAULT_PREFS(userId);
  const mode = row.mascot_mode === "mara" || row.mascot_mode === "aldren" ? row.mascot_mode : "balanced";
  return {
    user_id: userId,
    mascot_mode: mode,
    preferences: normalizeFlags(row.preferences),
    last_mascot: row.last_mascot === "mara" || row.last_mascot === "aldren" ? row.last_mascot : null,
    mascot_streak: Math.max(0, Number(row.mascot_streak ?? 0)),
    mara_count: Math.max(0, Number(row.mara_count ?? 0)),
    aldren_count: Math.max(0, Number(row.aldren_count ?? 0)),
    last_variants: row.last_variants && typeof row.last_variants === "object" ? row.last_variants as Record<string, number> : {},
  };
}

function chooseVariant(kind: NotificationKind, mascot: NotificationMascot, preferences: NotificationPreferences) {
  const options = notificationCopyOptions(kind, mascot);
  const key = `${kind}:${mascot}`;
  const previous = Number(preferences.last_variants[key]);
  const candidates = options.map((_, index) => index).filter((index) => index !== previous);
  const pool = candidates.length ? candidates : options.map((_, index) => index);
  const index = pool[Math.floor(Math.random() * pool.length)] ?? 0;
  return { index, template: options[index] };
}

async function loadPreferences(userId: string) {
  const admin = createAdminClient();
  if (!admin) return { admin: null, preferences: DEFAULT_PREFS(userId) } as const;
  const { data } = await admin.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle();
  if (!data) {
    const defaults = DEFAULT_PREFS(userId);
    await admin.from("notification_preferences").upsert({
      user_id: userId,
      mascot_mode: defaults.mascot_mode,
      preferences: defaults.preferences,
      last_mascot: null,
      mascot_streak: 0,
      mara_count: 0,
      aldren_count: 0,
      last_variants: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    return { admin, preferences: defaults } as const;
  }
  return { admin, preferences: normalizePreferences(userId, data as unknown as Record<string, unknown>) } as const;
}

export type DispatchNotificationInput = {
  recipientUserId: string;
  kind: NotificationKind;
  href: string;
  actorUserId?: string | null;
  actorName?: string | null;
  sourceLabel?: string | null;
  context?: Record<string, unknown>;
  dedupeKey?: string | null;
  groupKey?: string | null;
  groupWindowMs?: number;
  collapseUnread?: boolean;
};

function messagePreviewContext(input: DispatchNotificationInput, count = 1) {
  if (input.kind !== "direct_raven" && input.kind !== "guild_parley") return null;
  const actorUsername = typeof input.context?.actorUsername === "string" ? input.context.actorUsername : null;
  const preview = typeof input.context?.messagePreview === "string" ? input.context.messagePreview : "A new raven has arrived.";
  const conversationTitle = typeof input.context?.conversationTitle === "string" ? input.context.conversationTitle : "Guild Parley";
  const title = input.kind === "guild_parley"
    ? `New messages in ${conversationTitle}`
    : actorUsername ? `New messages from @${actorUsername}` : "You have new messages";
  const line = actorUsername ? `@${actorUsername}: ${preview}` : preview;
  return { title, body: count > 1 ? `${count} new messages · ${line}` : line };
}

function pushCopyFor(input: DispatchNotificationInput, mascot: NotificationMascot, fallbackTitle: string, fallbackBody: string, count = 1) {
  const message = messagePreviewContext(input, count);
  if (!message) return { title: fallbackTitle, body: fallbackBody };
  const actorUsername = typeof input.context?.actorUsername === "string" ? input.context.actorUsername : "someone";
  const conversationTitle = typeof input.context?.conversationTitle === "string" ? input.context.conversationTitle : "the parley";
  const title = input.kind === "guild_parley"
    ? mascot === "mara" ? `${conversationTitle} · @${actorUsername}` : `A raven in ${conversationTitle}, my liege!`
    : mascot === "mara" ? `Raven from @${actorUsername}` : `A raven from @${actorUsername}, my liege!`;
  return { title, body: count > 1 ? `${count} new messages · ${message.body.replace(/^\d+ new messages · /, "")}` : message.body };
}

function pushIconFor(input: DispatchNotificationInput, mascot: NotificationMascot) {
  if (input.kind === "guild_parley" && typeof input.context?.guildAvatarUrl === "string" && input.context.guildAvatarUrl) return input.context.guildAvatarUrl;
  if (input.kind === "direct_raven" && typeof input.context?.actorAvatarUrl === "string" && input.context.actorAvatarUrl) return input.context.actorAvatarUrl;
  return MASCOT_META[mascot].portrait;
}

export async function dispatchSiteNotification(input: DispatchNotificationInput): Promise<SiteNotification | null> {
  if (!input.recipientUserId || input.recipientUserId === input.actorUserId) return null;
  const { admin, preferences } = await loadPreferences(input.recipientUserId);
  if (!admin) {
    console.warn("Mascot notification skipped: SUPABASE_SERVICE_ROLE_KEY is not configured.");
    return null;
  }

  const meta = NOTIFICATION_KIND_META[input.kind];
  if (preferences.preferences[meta.preference] === false) return null;

  let actorName = input.actorName?.trim() || null;
  if (!actorName && input.actorUserId) {
    const { data: actor } = await admin.from("profiles").select("display_name").eq("id", input.actorUserId).maybeSingle();
    actorName = actor?.display_name ?? null;
  }

  const groupWindowMs = Math.max(0, input.groupWindowMs ?? 45_000);
  if (input.groupKey && (groupWindowMs > 0 || input.collapseUnread)) {
    let recentQuery = admin.from("site_notifications")
      .select("*")
      .eq("user_id", input.recipientUserId)
      .eq("source", meta.source)
      .contains("context", { groupKey: input.groupKey });
    if (input.collapseUnread) recentQuery = recentQuery.is("read_at", null);
    else recentQuery = recentQuery.gte("created_at", new Date(Date.now() - groupWindowMs).toISOString());
    const { data: recent } = await recentQuery
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recent) {
      const count = Math.max(1, Number(recent.context?.groupCount ?? 1)) + 1;
      const mascot = recent.mascot as NotificationMascot;
      const groupedBody = mascot === "mara"
        ? `${count} fresh tidings from the same place. Kept to one raven.`
        : `${count} fresh tidings from the same quarter have arrived together, my liege.`;
      const context = { ...(recent.context ?? {}), ...(input.context ?? {}), groupKey: input.groupKey, groupCount: count, ...(actorName ? { actorName } : {}) };
      const messageRecord = messagePreviewContext(input, count);
      const { data: updated } = await admin.from("site_notifications").update({
        actor_id: input.actorUserId ?? recent.actor_id,
        title: messageRecord?.title ?? recent.title,
        body: messageRecord?.body ?? groupedBody,
        href: input.href || recent.href, source_label: input.sourceLabel ?? recent.source_label, context, read_at: null, created_at: new Date().toISOString(),
      }).eq("id", recent.id).select("*").single();
      const [{ data: subscriptions }, unreadResult] = await Promise.all([
        admin.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", input.recipientUserId),
        admin.from("site_notifications").select("id", { count: "exact", head: true }).eq("user_id", input.recipientUserId).is("read_at", null),
      ]);
      const badgeCount = unreadResult.count ?? undefined;
      const notificationUrl = `/notifications?open=${encodeURIComponent(recent.id)}`;
      await Promise.all((subscriptions ?? []).map(async (subscription) => {
        try {
          const pushCopy = pushCopyFor(input, mascot, recent.title, groupedBody, count);
          const response = await sendWebPush(subscription, {
            title: pushCopy.title, body: pushCopy.body, icon: pushIconFor(input, mascot), badge: "/notification-badge.png",
            url: input.href || notificationUrl, tag: `asofab-group-${input.groupKey}`, renotify: true, badgeCount,
            data: {
              notificationId: recent.id, source: meta.source, mascot,
              conversationId: typeof context.conversationId === "string" ? context.conversationId : undefined,
              targetHref: input.href || recent.href,
              actorUsername: typeof context.actorUsername === "string" ? context.actorUsername : undefined,
              actorAvatarUrl: typeof context.actorAvatarUrl === "string" ? context.actorAvatarUrl : undefined,
              conversationTitle: typeof context.conversationTitle === "string" ? context.conversationTitle : undefined,
              guildAvatarUrl: typeof context.guildAvatarUrl === "string" ? context.guildAvatarUrl : undefined,
              messagePreview: typeof context.messagePreview === "string" ? context.messagePreview : undefined,
              messageNotification: input.kind === "direct_raven" || input.kind === "guild_parley",
            },
          });
          if (response.status === 404 || response.status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        } catch (error) { console.error("Grouped Web Push delivery failed.", { kind: input.kind, error }); }
      }));
      return updated as unknown as SiteNotification;
    }
  }

  const mascot = chooseMascot(preferences);
  const { index: variantIndex, template } = chooseVariant(input.kind, mascot, preferences);
  const rendered = input.context?.shellVersion
    ? reinstallCopy[mascot]
    : renderNotificationCopy(template, { actor: actorName, source: input.sourceLabel });
  const context: Record<string, unknown> = { ...(input.context ?? {}), ...(input.groupKey ? { groupKey: input.groupKey, groupCount: 1 } : {}), ...(actorName ? { actorName } : {}) };

  const messageRecord = messagePreviewContext(input);
  const insert = {
    user_id: input.recipientUserId,
    actor_id: input.actorUserId ?? null,
    kind: input.kind,
    source: meta.source,
    mascot,
    title: messageRecord?.title ?? rendered.title,
    body: messageRecord?.body ?? rendered.body,
    href: input.href || "/notifications",
    source_label: input.sourceLabel ?? null,
    context,
    dedupe_key: input.dedupeKey ?? null,
  };
  const { data, error } = await admin.from("site_notifications").insert(insert).select("*").single();
  if (error) {
    if (error.code === "23505") return null;
    console.error("Site notification could not be recorded.", { code: error.code, message: error.message, kind: input.kind });
    return null;
  }

  const nextStreak = preferences.last_mascot === mascot ? preferences.mascot_streak + 1 : 1;
  const lastVariants = { ...preferences.last_variants, [`${input.kind}:${mascot}`]: variantIndex };
  await admin.from("notification_preferences").upsert({
    user_id: input.recipientUserId,
    mascot_mode: "balanced" as MascotMode,
    preferences: preferences.preferences,
    last_mascot: mascot,
    mascot_streak: nextStreak,
    mara_count: preferences.mara_count + (mascot === "mara" ? 1 : 0),
    aldren_count: preferences.aldren_count + (mascot === "aldren" ? 1 : 0),
    last_variants: lastVariants,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  const [{ data: subscriptions }, unreadResult] = await Promise.all([
    admin.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", input.recipientUserId),
    admin.from("site_notifications").select("id", { count: "exact", head: true }).eq("user_id", input.recipientUserId).is("read_at", null),
  ]);
  const badgeCount = unreadResult.count ?? undefined;
  const mascotMeta = MASCOT_META[mascot];
  const notificationUrl = `/notifications?open=${encodeURIComponent(data.id)}`;

  await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try {
      const pushCopy = pushCopyFor(input, mascot, rendered.title, `${rendered.body} — ${mascotMeta.name}`);
      const response = await sendWebPush(subscription, {
        title: pushCopy.title,
        body: pushCopy.body,
        icon: pushIconFor(input, mascot),
        badge: "/notification-badge.png",
        url: input.href || notificationUrl,
        tag: input.groupKey ? `asofab-group-${input.groupKey}` : `asofab-${data.id}`,
        badgeCount,
        data: {
          notificationId: data.id, source: meta.source, mascot,
          conversationId: typeof context.conversationId === "string" ? context.conversationId : undefined,
          targetHref: input.href || data.href,
          actorUsername: typeof context.actorUsername === "string" ? context.actorUsername : undefined,
          actorAvatarUrl: typeof context.actorAvatarUrl === "string" ? context.actorAvatarUrl : undefined,
          conversationTitle: typeof context.conversationTitle === "string" ? context.conversationTitle : undefined,
          guildAvatarUrl: typeof context.guildAvatarUrl === "string" ? context.guildAvatarUrl : undefined,
          messagePreview: typeof context.messagePreview === "string" ? context.messagePreview : undefined,
          messageNotification: input.kind === "direct_raven" || input.kind === "guild_parley",
        },
      });
      if (response.status === 404 || response.status === 410) {
        await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      }
    } catch (error) {
      console.error("Web Push delivery failed.", { kind: input.kind, error });
    }
  }));

  return data as unknown as SiteNotification;
}

export async function broadcastSiteNotification(input: Omit<DispatchNotificationInput, "recipientUserId">) {
  const admin = createAdminClient();
  if (!admin) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  const { data: profiles, error } = await admin.from("profiles").select("id");
  if (error) throw error;
  let delivered = 0;
  for (const profile of profiles ?? []) {
    const dedupeKey = input.dedupeKey?.replaceAll("{recipient}", profile.id) ?? null;
    const result = await dispatchSiteNotification({ ...input, dedupeKey, recipientUserId: profile.id });
    if (result) delivered += 1;
  }
  return delivered;
}
