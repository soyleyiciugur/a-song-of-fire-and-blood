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
};

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

  const mascot = chooseMascot(preferences);
  const { index: variantIndex, template } = chooseVariant(input.kind, mascot, preferences);
  const rendered = input.context?.shellVersion
    ? reinstallCopy[mascot]
    : renderNotificationCopy(template, { actor: actorName, source: input.sourceLabel });
  const context = { ...(input.context ?? {}), ...(actorName ? { actorName } : {}) };

  const insert = {
    user_id: input.recipientUserId,
    actor_id: input.actorUserId ?? null,
    kind: input.kind,
    source: meta.source,
    mascot,
    title: rendered.title,
    body: rendered.body,
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
    admin.from("push_subscriptions").select("endpoint,p256dh,auth,user_agent").eq("user_id", input.recipientUserId),
    admin.from("site_notifications").select("id", { count: "exact", head: true }).eq("user_id", input.recipientUserId).is("read_at", null),
  ]);
  const badgeCount = unreadResult.count ?? undefined;
  const mascotMeta = MASCOT_META[mascot];
  const notificationUrl = `/notifications?open=${encodeURIComponent(data.id)}`;

  await Promise.all((subscriptions ?? []).map(async (subscription) => {
    try {
      const appleWebPush = /iP(hone|ad|od)|Macintosh.*Mobile/i.test(subscription.user_agent ?? "");
      const response = await sendWebPush(subscription, {
        title: rendered.title,
        body: appleWebPush ? `${rendered.body} — ${mascotMeta.name}` : rendered.body,
        icon: mascotMeta.portrait,
        badge: "/notification-badge.png",
        url: notificationUrl,
        tag: `asofab-${data.id}`,
        badgeCount,
        data: { notificationId: data.id, source: meta.source, mascot },
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
