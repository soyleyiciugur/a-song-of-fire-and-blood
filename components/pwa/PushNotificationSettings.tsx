"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/settings/settings.module.css";

type State = "loading" | "unsupported" | "needs-install" | "default" | "denied" | "enabled" | "error";

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function decodeVapidKey(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationSettings() {
  const supabase = useMemo(() => createClient(), []);
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
      if (ios && !isStandalone()) return setState("needs-install");
      if (Notification.permission === "denied") return setState("denied");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState(subscription ? "enabled" : "default");
    };
    void check().catch(() => setState("error"));
  }, []);

  async function enable() {
    setMessage("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push is not configured yet. Add NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY in Vercel.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "default"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sign in before enabling notifications.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(publicKey) });
      const json = subscription.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });
      if (error) throw error;
      setState("enabled");
      setMessage("Push notifications are enabled on this device.");
    } catch (error) {
      console.error(error);
      setState("error");
      setMessage(error instanceof Error ? error.message : "Notifications could not be enabled.");
    }
  }

  async function testPush() {
    setMessage("");
    try {
      const response = await fetch("/api/push/test", { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Test notification failed.");
      setMessage("A test raven was sent to your subscribed devices.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Test notification failed.");
    }
  }

  async function disable() {
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
      if ("clearAppBadge" in navigator) await navigator.clearAppBadge();
      setState("default");
      setMessage("Push notifications are disabled on this device.");
    } catch {
      setState("error");
      setMessage("Notifications could not be disabled.");
    }
  }

  const copy = state === "needs-install"
    ? "On iPhone and iPad, add ASOFAB to your Home Screen first, then open it from the new icon to enable push notifications."
    : state === "denied"
      ? "Notifications are blocked for ASOFAB. Re-enable them in your device or browser settings."
      : state === "unsupported"
        ? "This browser does not support Web Push for ASOFAB."
        : "Receive ravens for community activity even when ASOFAB is not open.";

  return <section className={styles.section}>
    <h2 className={styles.sectionTitle}>Raven notifications</h2>
    <p className={styles.sectionIntro}>{copy}</p>
    <div className={styles.notificationSettingRow}>
      <div><strong>{state === "enabled" ? "Enabled on this device" : "Push notifications"}</strong><small>iOS 16.4+ requires the Home Screen web app.</small></div>
      {state === "enabled" ? <div className={styles.notificationActions}><button type="button" className={styles.secondaryButton} onClick={testPush}>Send test</button><button type="button" className={styles.secondaryButton} onClick={disable}>Disable</button></div> : <button type="button" className={styles.secondaryButton} onClick={enable} disabled={["loading","unsupported","needs-install","denied"].includes(state)}>Enable</button>}
    </div>
    {message && <p className={styles.status}>{message}</p>}
  </section>;
}
