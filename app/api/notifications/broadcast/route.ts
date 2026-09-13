import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { broadcastSiteNotification } from "@/lib/notifications/server";

const schema = z.object({
  kind: z.enum(["ravens_eye_image", "gutter_meme", "gutter_reel", "new_chapter", "realm_notice"]),
  href: z.string().startsWith("/").max(500),
  sourceLabel: z.string().trim().max(160).nullable().optional(),
  dedupeKey: z.string().trim().max(220).nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid announcement." }, { status: 400 });

  after(async () => {
    try {
      await broadcastSiteNotification({
        ...parsed.data,
        actorUserId: user.id,
        actorName: profile.display_name,
        dedupeKey: parsed.data.dedupeKey ? `${parsed.data.dedupeKey}:{recipient}` : null,
      });
    } catch (error) {
      console.error("Notification broadcast failed.", error);
    }
  });
  return NextResponse.json({ ok: true, queued: true });
}
