"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/settings/settings.module.css";

type State = "loading" | "signed-out" | "unsupported" | "needs-install" | "default" | "denied" | "enabled" | "error";

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
    let active = true;
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) return setState("signed-out");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState("unsupported");
      const ios = /iP(hone|ad|od)/.test(navigator.userAgent);
      if (ios && !isStandalone()) return setState("needs-install");
      if (Notification.permission === "denied") return setState("denied");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!active) return;
      setState(subscription ? "enabled" : "default");
    };
    void check().catch(() => active && setState("error"));
    const { data } = supabase.auth.onAuthStateChange(() => void check());
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  async function enable() {
    setMessage("");
    try {
      const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("Push is not configured yet. Add NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY in Vercel.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState("signed-out"); throw new Error("Sign in before enabling ravens on this device."); }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState(permission === "denied" ? "denied" : "default"); return; }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription = existing ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(publicKey) });
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
      localStorage.removeItem("asofab:push-disabled");
      setState("enabled");
      setMessage("Ravens may now reach this device even while ASOFAB is closed.");
      window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
    } catch (error) {
      console.error(error);
      if (state !== "signed-out") setState("error");
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
      window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Test notification failed.");
    }
  }

  async function disable() {
    setMessage("");
    try {
      localStorage.setItem("asofab:push-disabled", "true");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
        await subscription.unsubscribe();
      }
      if ("clearAppBadge" in navigator) await navigator.clearAppBadge();
      setState("default");
      setMessage("Push delivery is disabled on this device. Your account notification history remains intact.");
    } catch {
      setState("error");
      setMessage("Notifications could not be disabled.");
    }
  }

  const copy = state === "needs-install"
    ? "On iPhone and iPad, add ASOFAB to the Home Screen and open it from that icon before enabling push delivery."
    : state === "denied"
      ? "iOS or your browser is blocking notifications for ASOFAB. Permission must be restored in device settings."
      : state === "unsupported"
        ? "This browser cannot receive Web Push from ASOFAB. Your in-site notification history will still work."
        : state === "signed-out"
          ? "Sign in first. Delivery subscriptions, unread state, and notification history belong to your account rather than this device."
          : "Choose whether ravens may arrive on this device while ASOFAB is closed.";

  const statusLabel = state === "enabled" ? "Ravens permitted" : state === "denied" ? "Permission blocked" : state === "needs-install" ? "Home Screen required" : state === "unsupported" ? "Not supported" : state === "signed-out" ? "Sign in required" : "Not enabled";

  return <section className={`${styles.section} ${styles.deviceNotifications}`}>
    <div className={styles.notificationSubhead}><span>Delivery</span><small>iOS Home Screen web app</small></div>
    <div className={styles.deviceNotificationCard}>
      <span className={`${styles.deliveryGlyph} ${state === "enabled" ? styles.deliveryGlyphOn : ""}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div className={styles.deviceNotificationCopy}><strong>{statusLabel}</strong><p>{copy}</p></div>
      <div className={styles.notificationActions}>
        {state === "enabled" ? <><button type="button" className={styles.secondaryButton} onClick={testPush}>Send test raven</button><button type="button" className={styles.secondaryButton} onClick={disable}>Disable here</button></> : <button type="button" className={styles.secondaryButton} onClick={enable} disabled={["loading", "signed-out", "unsupported", "needs-install", "denied"].includes(state)}>Enable on this device</button>}
      </div>
    </div>
    {message && <p className={styles.status} role="status">{message}</p>}
  </section>;
}
