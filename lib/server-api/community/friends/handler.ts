import { after, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { dispatchSiteNotification } from "@/lib/notifications/server";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), profileId: z.string().uuid() }),
  z.object({ action: z.literal("accept"), friendshipId: z.string().uuid() }),
  z.object({ action: z.literal("remove"), friendshipId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "That friendship request could not be read." }, { status: 400 });

  const { data: actor } = await supabase.from("profiles").select("id,username,display_name").eq("id", user.id).maybeSingle();
  if (!actor) return NextResponse.json({ error: "Profile unavailable." }, { status: 404 });

  if (parsed.data.action === "request") {
    if (parsed.data.profileId === user.id) return NextResponse.json({ error: "You cannot send yourself a friendship request." }, { status: 400 });
    const { data: target } = await supabase.from("profiles").select("id,username,display_name").eq("id", parsed.data.profileId).maybeSingle();
    if (!target) return NextResponse.json({ error: "That profile is unavailable." }, { status: 404 });
    const { data: friendship, error } = await supabase.from("member_friendships").insert({ requester_id: user.id, recipient_id: target.id }).select("id").single();
    if (error || !friendship) return NextResponse.json({ error: "Could not send that friendship request." }, { status: 400 });
    after(() => dispatchSiteNotification({
      recipientUserId: target.id,
      actorUserId: user.id,
      actorName: actor.display_name || actor.username,
      kind: "friend_request",
      href: `/users/${encodeURIComponent(actor.username)}#friends`,
      sourceLabel: `@${actor.username}`,
      context: { actorUsername: actor.username, friendshipId: friendship.id },
      dedupeKey: `friend-request:${friendship.id}`,
    }));
    return NextResponse.json({ ok: true, id: friendship.id }, { status: 201 });
  }

  const { data: friendship } = await supabase.from("member_friendships").select("id,requester_id,recipient_id,accepted_at").eq("id", parsed.data.friendshipId).maybeSingle();
  if (!friendship || (friendship.requester_id !== user.id && friendship.recipient_id !== user.id)) {
    return NextResponse.json({ error: "That friendship is unavailable." }, { status: 404 });
  }

  if (parsed.data.action === "accept") {
    if (friendship.recipient_id !== user.id || friendship.accepted_at) return NextResponse.json({ error: "That request cannot be accepted." }, { status: 409 });
    const { error } = await supabase.from("member_friendships").update({ accepted_at: new Date().toISOString() }).eq("id", friendship.id);
    if (error) return NextResponse.json({ error: "Could not accept that friendship." }, { status: 400 });
    after(() => dispatchSiteNotification({
      recipientUserId: friendship.requester_id,
      actorUserId: user.id,
      actorName: actor.display_name || actor.username,
      kind: "friend_accept",
      href: `/users/${encodeURIComponent(actor.username)}#friends`,
      sourceLabel: `@${actor.username}`,
      context: { actorUsername: actor.username, friendshipId: friendship.id },
      dedupeKey: `friend-accept:${friendship.id}`,
    }));
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("member_friendships").delete().eq("id", friendship.id);
  if (error) return NextResponse.json({ error: "Could not update that friendship." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
