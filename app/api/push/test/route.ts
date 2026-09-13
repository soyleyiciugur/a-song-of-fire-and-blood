import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendWebPush } from "@/lib/webPush";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { data, error } = await supabase.from("push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.length) return NextResponse.json({ error: "No push subscription found for this account." }, { status: 404 });

  let sent = 0;
  for (const subscription of data) {
    try {
      const response = await sendWebPush(subscription, {
        title: "A Song of Fire and Blood",
        body: "The ravens are flying. Push notifications are working on this device.",
        url: "/notifications",
        tag: "asofab-push-test",
      });
      if (response.ok) sent += 1;
      else if (response.status === 404 || response.status === 410) await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    } catch (pushError) {
      console.error("Push test failed", pushError);
    }
  }

  return sent ? NextResponse.json({ ok: true, sent }) : NextResponse.json({ error: "The push service rejected the notification." }, { status: 502 });
}
