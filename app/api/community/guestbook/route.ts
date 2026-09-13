import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dispatchSiteNotification } from "@/lib/notifications/server";

const schema = z.object({
  profileId: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  body: z.string().trim().min(1).max(500),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the guestbook entry." }, { status: 400 });
  const input = parsed.data;

  const [{ data: actor }, { data: owner }] = await Promise.all([
    supabase.from("profiles").select("display_name,username").eq("id", user.id).maybeSingle(),
    supabase.from("profiles").select("username,display_name").eq("id", input.profileId).maybeSingle(),
  ]);
  if (!owner) return NextResponse.json({ error: "That guestbook is unavailable." }, { status: 404 });

  let parent: { id: string; author_id: string; body: string; profile_id: string } | null = null;
  if (input.parentId) {
    const result = await supabase.from("profile_guestbook").select("id,author_id,body,profile_id").eq("id", input.parentId).maybeSingle();
    parent = result.data;
    if (!parent || parent.profile_id !== input.profileId) return NextResponse.json({ error: "That guestbook entry is unavailable." }, { status: 404 });
  }

  const { data: inserted, error } = await supabase.from("profile_guestbook")
    .insert({ profile_id: input.profileId, author_id: user.id, body: input.body, parent_id: input.parentId ?? null })
    .select("id").single();
  if (error || !inserted) return NextResponse.json({ error: "Your words could not be added to the guestbook." }, { status: 400 });

  const recipient = parent?.author_id ?? input.profileId;
  if (recipient && recipient !== user.id) {
    const kind = parent ? "guestbook_reply" as const : "guestbook_entry" as const;
    after(() => dispatchSiteNotification({
      recipientUserId: recipient,
      actorUserId: user.id,
      actorName: actor?.display_name ?? null,
      kind,
      href: `/users/${encodeURIComponent(owner.username)}#guestbook`,
      sourceLabel: `${owner.display_name}'s Guestbook`,
      context: {
        profileId: input.profileId,
        profileUsername: owner.username,
        guestbookId: inserted.id,
        parentId: parent?.id ?? null,
        parentBody: parent?.body ?? null,
        replyBody: input.body,
      },
      groupKey: `guestbook:${input.profileId}`,
      dedupeKey: `guestbook:${inserted.id}:${recipient}`,
    }));
  }

  return NextResponse.json({ ok: true, id: inserted.id }, { status: 201 });
}
