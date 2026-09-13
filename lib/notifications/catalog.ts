import rawCopy from "@/data/notification-copy.json";
import type { NotificationCopy, NotificationKind, NotificationMascot } from "./types";

const copy = rawCopy as Record<NotificationKind, Record<NotificationMascot, NotificationCopy[]>>;

export function notificationCopyOptions(kind: NotificationKind, mascot: NotificationMascot) {
  return copy[kind][mascot];
}

export function renderNotificationCopy(template: NotificationCopy, context: { actor?: string | null; source?: string | null }) {
  const actor = context.actor?.trim() || "Someone";
  const source = context.source?.trim() || "the realm";
  const replace = (value: string) => value.replaceAll("{actor}", actor).replaceAll("{source}", source);
  return { title: replace(template.title), body: replace(template.body) };
}
