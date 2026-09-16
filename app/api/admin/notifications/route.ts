import { NextResponse } from "next/server";
import { z } from "zod";
import { getChapters } from "@/lib/chapters";
import { isLuckAdmin } from "@/lib/adminAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchSiteNotification } from "@/lib/notifications/server";
import { manualNotificationTemplate } from "@/lib/notifications/manual";
import type { NotificationMascot } from "@/lib/notifications/types";

const schema = z.object({
  audience: z.enum(["single", "all"]),
  username: z.string().trim().max(80).optional().default(""),
  templateId: z.enum(["new_chapter", "new_reel", "new_meme", "realm_notice", "custom"]),
  mascot: z.enum(["balanced", "mara", "aldren"]).default("balanced"),
  title: z.string().trim().max(120).optional().default(""),
  body: z.string().trim().max(500).optional().default(""),
  href: z.string().trim().max(1000).optional().default("/"),
});

function latestChapter() {
  const chapter = getChapters().at(-1);
  return chapter ? { title: chapter.title, href: `/chapters/${encodeURIComponent(chapter.slug)}` } : { title: "The Chronicle", href: "/chapters" };
}

function safeHref(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function GET() {
  if (!(await isLuckAdmin())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ latestChapter: latestChapter() });
}

export async function POST(request: Request) {
  if (!(await isLuckAdmin())) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the notification fields." }, { status: 400 });
  const input = parsed.data;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Server notification access is not configured." }, { status: 503 });

  let recipients: Array<{ id: string; username: string }> = [];
  if (input.audience === "all") {
    const { data, error } = await admin.from("profiles").select("id,username");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    recipients = data ?? [];
  } else {
    const username = input.username.replace(/^@/, "").toLowerCase();
    if (!username) return NextResponse.json({ error: "Enter a username." }, { status: 400 });
    const { data } = await admin.from("profiles").select("id,username").ilike("username", username).maybeSingle();
    if (!data) return NextResponse.json({ error: `@${username} was not found.` }, { status: 404 });
    recipients = [data];
  }

  const forcedMascot = input.mascot === "balanced" ? undefined : input.mascot as NotificationMascot;
  const latest = latestChapter();
  const template = input.templateId === "custom" ? null : manualNotificationTemplate(input.templateId);
  if (!template && input.templateId !== "custom") return NextResponse.json({ error: "That template is unavailable." }, { status: 400 });
  if (input.templateId === "custom" && (!input.title || !input.body)) return NextResponse.json({ error: "Custom notifications need a title and body." }, { status: 400 });

  const kind = template?.kind ?? "realm_notice";
  const href = safeHref(template?.href === "latest-chapter" ? latest.href : template?.href ?? input.href);
  const manualCopy = template?.copy ?? {
    mara: { title: input.title, body: input.body },
    aldren: { title: input.title, body: input.body },
  };

  let delivered = 0;
  for (const recipient of recipients) {
    const result = await dispatchSiteNotification({
      recipientUserId: recipient.id,
      kind,
      href,
      sourceLabel: template?.sourceLabel ?? "The Realm",
      forceMascot: forcedMascot,
      manualCopy,
      context: { manualAdmin: true, templateId: input.templateId, latestChapter: latest.title },
    });
    if (result) delivered += 1;
  }

  return NextResponse.json({ ok: true, delivered, total: recipients.length, href });
}
