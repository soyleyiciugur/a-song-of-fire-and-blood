import type { NotificationSource } from "./types";

export const NOTIFICATION_SOURCE_LABELS: Record<NotificationSource, string> = {
  tavern: "Taverns",
  "ravens-eye": "The Raven's Eye",
  "direct-raven": "Direct Raven",
  "guild-parley": "Guild Parley",
  chronicle: "The Chronicle",
  realm: "The Realm",
};

export function notificationSourceLabel(source: NotificationSource) {
  return NOTIFICATION_SOURCE_LABELS[source];
}
