"use client";
import { createClient } from "@/lib/supabase/client";
import { chooseMascot } from "@/lib/notifications/rotation";
import type { NotificationMascot } from "@/lib/notifications/types";

const key = "asofab:installation";
export type Installation = { id: string; version: number; pending?: boolean };
let fallback: Installation | null = null;
export async function guideMascot(version: number): Promise<NotificationMascot> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const storageKey = `asofab:shell-mascot:${user?.id ?? "guest"}:${version}`;
  try { const saved = localStorage.getItem(storageKey); if (saved === "mara" || saved === "aldren") return saved; } catch {}
  let history = { last_mascot: null as NotificationMascot | null, mascot_streak: 0, mara_count: 0, aldren_count: 0 };
  if (user) {
    const { data } = await supabase.from("notification_preferences").select("last_mascot,mascot_streak,mara_count,aldren_count").eq("user_id", user.id).maybeSingle();
    if (data) history = data;
  } else {
    try { history = JSON.parse(localStorage.getItem("asofab:guest-mascot-history") || "null") || history; } catch {}
  }
  const mascot = chooseMascot(history);
  try {
    localStorage.setItem(storageKey, mascot);
    if (!user) localStorage.setItem("asofab:guest-mascot-history", JSON.stringify({ last_mascot: mascot, mascot_streak: history.last_mascot === mascot ? history.mascot_streak + 1 : 1, mara_count: history.mara_count + Number(mascot === "mara"), aldren_count: history.aldren_count + Number(mascot === "aldren") }));
  } catch {}
  return mascot;
}
export function standalone() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
export function iosDevice() {
  return /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
export function installation(baseline: number): Installation {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved && typeof saved.id === "string" && Number.isInteger(saved.version) && saved.version >= 0) return saved;
  } catch { /* Storage may be unavailable in private browsing. */ }
  if (!fallback) fallback = { id: crypto.randomUUID(), version: baseline };
  saveInstallation(fallback);
  return fallback;
}
export function saveInstallation(value: Installation) {
  fallback = value;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Session-only fallback. */ }
}
export async function syncInstallation(value: Installation, action: "check" | "acknowledge") {
  const response = await fetch("/api/app-shell", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ installationId: value.id, installedVersion: value.version, action }), cache: "no-store" });
  if (response.status === 401) return { signedIn: false, version: value.version, mascot: null };
  if (!response.ok) throw new Error("Your seal could not be saved. Please try again.");
  return response.json();
}

export async function restorePush() {
  if (!standalone() || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return "unavailable";
  if (Notification.permission !== "granted") return "permission";
  if (localStorage.getItem("asofab:push-disabled") === "true") return "disabled";
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  if (!publicKey) return "unavailable";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "signed-out";
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration?.active) return "unavailable";
  const raw = atob(publicKey.replace(/-/g, "+").replace(/_/g, "/"));
  const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: Uint8Array.from(raw, c => c.charCodeAt(0)) });
  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: subscription.endpoint, p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "", user_agent: navigator.userAgent, updated_at: new Date().toISOString() }, { onConflict: "endpoint" });
  if (error) throw error;
  return "restored";
}
