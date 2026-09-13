import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchSiteNotification } from "@/lib/notifications/server";
import { shellRelease } from "./release";

export async function releaseNotification(userId: string) {
  const admin = createAdminClient();
  if (!admin || !shellRelease.reinstallRequired) return null;
  const dedupeKey = `shell:${shellRelease.version}:${userId}`;
  const { data, error } = await admin.from("site_notifications").select("*").eq("dedupe_key", dedupeKey).maybeSingle();
  if (error) throw error;
  if (data) return data;
  return dispatchSiteNotification({ recipientUserId: userId, kind: "realm_notice", href: "/app-update", sourceLabel: "A fresh Home Screen seal", context: { shellVersion: shellRelease.version }, dedupeKey });
}
