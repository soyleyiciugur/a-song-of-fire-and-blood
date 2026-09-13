import fs from "node:fs";
const source = fs.readFileSync(new URL("../lib/notifications/target.ts", import.meta.url), "utf8");
for (const needle of [
  'notification.kind === "direct_raven"',
  '`/messages/${encodeURIComponent(conversationId)}`',
  'notification.kind === "tavern_answer"',
  'notification.kind === "ravens_eye_answer"',
]) {
  if (!source.includes(needle)) throw new Error(`Notification target resolver is missing: ${needle}`);
}
const page = fs.readFileSync(new URL("../app/notifications/page.tsx", import.meta.url), "utf8");
if (!page.includes("notificationTargetHref(activeNotification)")) throw new Error("Rookery lightbox is not using the target resolver.");
console.log("Notification target routing checks passed.");
