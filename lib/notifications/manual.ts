import type { NotificationCopy, NotificationKind, NotificationMascot } from "./types";

export type ManualNotificationTemplateId = "new_chapter" | "new_reel" | "new_meme" | "realm_notice";

export type ManualNotificationTemplate = {
  id: ManualNotificationTemplateId;
  label: string;
  note: string;
  kind: NotificationKind;
  href: string | "latest-chapter";
  sourceLabel: string;
  copy: Record<NotificationMascot, NotificationCopy>;
};

export const MANUAL_NOTIFICATION_TEMPLATES: ManualNotificationTemplate[] = [
  {
    id: "new_chapter",
    label: "New chapter",
    note: "Sends a personal raven that opens the newest Chronicle chapter.",
    kind: "new_chapter",
    href: "latest-chapter",
    sourceLabel: "The Chronicle",
    copy: {
      mara: { title: "Fresh pages in the Chronicle.", body: "A new chapter has been writ. It is ready when you are." },
      aldren: { title: "A new chapter is writ!", body: "My liege, fresh pages have joined the Chronicle and await your attention." },
    },
  },
  {
    id: "new_reel",
    label: "New Gutter Reel",
    note: "Opens the moving spectacle in Flea Bottom.",
    kind: "gutter_reel",
    href: "/ravens-eye/reels",
    sourceLabel: "The Gutter",
    copy: {
      mara: { title: "New reels in the Gutter.", body: "Fresh spectacle has reached Flea Bottom. Subtlety remains absent." },
      aldren: { title: "New reels in the Gutter!", body: "My liege, our little birds whisper of fresh spectacle in Flea Bottom." },
    },
  },
  {
    id: "new_meme",
    label: "New Gutter Meme",
    note: "Opens the latest Flea Bottom mockery.",
    kind: "gutter_meme",
    href: "/ravens-eye/memes",
    sourceLabel: "The Gutter",
    copy: {
      mara: { title: "Fresh mockery from Flea Bottom.", body: "The smallfolk have found something else to laugh at." },
      aldren: { title: "Flea Bottom has fresh mockery!", body: "Your Grace, another little jest has spread through the alleys." },
    },
  },
  {
    id: "realm_notice",
    label: "Realm notice",
    note: "A general site notice that opens the home page unless you choose Custom.",
    kind: "realm_notice",
    href: "/",
    sourceLabel: "The Realm",
    copy: {
      mara: { title: "Word from the realm.", body: "There is fresh word worth knowing." },
      aldren: { title: "Word from the realm, my liege!", body: "A fresh matter worthy of Your Grace's attention has arrived." },
    },
  },
];

export function manualNotificationTemplate(id: string) {
  return MANUAL_NOTIFICATION_TEMPLATES.find((template) => template.id === id) ?? null;
}
