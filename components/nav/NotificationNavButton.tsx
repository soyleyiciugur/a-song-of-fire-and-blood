"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCommunity } from "@/lib/communityStore";
import styles from "./navbar.module.css";

import { playRavenSound } from "@/lib/ravenSound";

const STORAGE_KEY = "asofab:notifications:last-seen";

export default function NotificationNavButton() {
  const data = useCommunity();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    setLastSeen(window.localStorage.getItem(STORAGE_KEY));
    void supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => auth.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const seen = (event: Event) => setLastSeen((event as CustomEvent<string>).detail);
    window.addEventListener("asofab:notifications-seen", seen);
    return () => window.removeEventListener("asofab:notifications-seen", seen);
  }, [pathname]);

  const latest = useRef<string | null>(null);
  useEffect(() => {
    if (!data.serverTime) return;
    if (latest.current && userId && data.comments.some(comment => comment.authorId !== userId && Date.parse(comment.publishedAt) > Date.parse(latest.current!))) playRavenSound("notification");
    latest.current = data.serverTime;
  }, [data.serverTime, data.comments, userId]);

  const unread = data.comments.reduce((count, comment) => {
    if (comment.authorId === userId) return count;
    if (!lastSeen || Date.parse(comment.publishedAt) > Date.parse(lastSeen)) return count + 1;
    return count;
  }, 0);

  return (
    <Link href="/notifications" className={styles.notificationsButton} aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} title="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
      {unread > 0 && <span className={styles.notificationDot} aria-hidden="true">{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}
