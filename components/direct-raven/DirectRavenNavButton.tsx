"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/nav/navbar.module.css";

export default function DirectRavenNavButton() {
  const [unread, setUnread] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      setSignedIn(Boolean(user));
      if (!user) { setUnread(0); return; }
      const { data } = await supabase.rpc("direct_raven_unread_count");
      if (active) setUnread(Number(data ?? 0));
    };

    void load();
    channel = supabase
      .channel("direct-raven-navbar")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_raven_messages" }, () => void load())
      .subscribe();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void load(), 0));

    const onRead = () => void load();
    window.addEventListener("direct-raven-read", onRead);
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener("direct-raven-read", onRead);
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  if (!signedIn) return null;
  return (
    <Link href="/messages" className={`${styles.notificationsButton} ${styles.directRavenButton}`} aria-label={unread ? `Direct Raven, ${unread} unread` : "Direct Raven"} title="Direct Raven">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.5 8.5 12 3l8.5 5.5v9A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="m4 9 8 5 8-5M8.5 7.1 12 5l3.5 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15.6 5.9c1.6-1.2 3.2-1.4 4.6-.5-1.1.2-1.8.7-2.3 1.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {unread > 0 && <span className={styles.navBadge}>{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}
