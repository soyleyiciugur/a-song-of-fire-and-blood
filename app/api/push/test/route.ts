import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dispatchSiteNotification } from "@/lib/notifications/server";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: subscriptions, error } = await supabase.from("push_subscriptions").select("id").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subscriptions?.length) return NextResponse.json({ error: "No push subscription found for this account." }, { status: 404 });

  const notification = await dispatchSiteNotification({
    recipientUserId: user.id,
    kind: "realm_notice",
    href: "/notifications",
    sourceLabel: "Raven Notifications",
    context: { test: true },
  });
  return notification
    ? NextResponse.json({ ok: true, notificationId: notification.id })
    : NextResponse.json({ error: "The test raven could not be prepared. Apply the mascot notification migration and add SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) to Vercel, then redeploy." }, { status: 500 });
}
