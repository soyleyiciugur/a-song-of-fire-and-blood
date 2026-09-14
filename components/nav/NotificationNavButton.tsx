"use client";

import UtilityIcon from "./UtilityIcon";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { playRavenSound } from "@/lib/ravenSound";
import styles from "./navbar.module.css";

export default function NotificationNavButton() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const initialized = useRef(false);
  const previousUnread = useRef(0);
  const refreshRequest = useRef(0);

  const syncBadge = useCallback(async (count: number, signedIn: boolean) => {
    if (!("setAppBadge" in navigator) || !("clearAppBadge" in navigator)) return;
    try {
      if (!signedIn || count <= 0) await navigator.clearAppBadge();
      else await navigator.setAppBadge(count);
    } catch { /* Badging may remain unavailable until notification permission exists. */ }
  }, []);

  const refresh = useCallback(async (id = userId) => {
    const request = ++refreshRequest.current;
    if (!id) {
      setUnread(0);
      previousUnread.current = 0;
      initialized.current = false;
      await syncBadge(0, false);
      return;
    }
    const { count, error } = await supabase.from("site_notifications").select("id", { count: "exact", head: true }).eq("user_id", id).is("read_at", null);
    if (error || request !== refreshRequest.current) return;
    const next = count ?? 0;
    if (initialized.current && next > previousUnread.current) playRavenSound("notification");
    previousUnread.current = next;
    initialized.current = true;
    setUnread(next);
    await syncBadge(next, true);
  }, [supabase, syncBadge, userId]);

  useEffect(() => {
    let alive = true;
    const load = async (id: string | null) => {
      if (!alive) return;
      setUserId(id);
      initialized.current = false;
      previousUnread.current = 0;
      if (!id) {
        setUnread(0);
        await syncBadge(0, false);
        return;
      }
      await refresh(id);
    };
    void supabase.auth.getUser().then(({ data: { user } }) => load(user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void load(session?.user.id ?? null));
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [refresh, supabase, syncBadge]);

  useEffect(() => {
    if (!userId) return;
    const onChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ unread?: number }>).detail;
      if (typeof detail?.unread === "number") {
        refreshRequest.current += 1;
        previousUnread.current = detail.unread;
        initialized.current = true;
        setUnread(detail.unread);
        void syncBadge(detail.unread, true);
      } else void refresh(userId);
    };
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(userId); };
    window.addEventListener("asofab:notifications-changed", onChanged);
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(userId); }, 30_000);
    const channel = supabase.channel(`site-notifications-nav:${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "site_notifications", filter: `user_id=eq.${userId}` }, (payload) => {
      const row = payload.new as { source?: string; context?: { conversationId?: string } } | undefined;
      const sameOpenRaven = payload.eventType === "INSERT"
        && document.visibilityState === "visible"
        && (row?.source === "direct-raven" || row?.source === "guild-parley")
        && row.context?.conversationId
        && row.context.conversationId === document.documentElement.dataset.activeRavenConversation;
      // RavenConversation/PwaBoot will mark this notification read immediately.
      // Skipping this transient INSERT prevents a badge/sound flash before that write lands.
      if (!sameOpenRaven) void refresh(userId);
    }).subscribe();
    return () => {
      window.removeEventListener("asofab:notifications-changed", onChanged);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh, supabase, syncBadge, userId]);

  return <Link href="/notifications" className={styles.notificationsButton} aria-label={userId && unread ? `Notifications, ${unread} unread` : "Notifications"} title="Notifications">
    <UtilityIcon name="notifications" />
    {userId && unread > 0 && <span className={styles.notificationDot} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
  </Link>;
}
