"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { playRavenSound, unlockSound } from "@/lib/ravenSound";
import styles from "@/components/nav/navbar.module.css";

export default function DirectRavenNavButton() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let currentUser: string | undefined;
    document.addEventListener("pointerdown", unlockSound);
    document.addEventListener("keydown", unlockSound);
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      currentUser = user?.id;
      setSignedIn(Boolean(user));
      if (!user) { setUnread(0); return; }
      const { data } = await supabase.rpc("direct_raven_unread_count");
      if (active) setUnread(Number(data ?? 0));
    };

    void load();
    channel = supabase
      .channel("direct-raven-navbar")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_raven_messages" }, (payload) => {
        if (currentUser && payload.new.sender_id !== currentUser) playRavenSound();
        void load();
      })
      .subscribe();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void load(), 0));

    const onRead = () => void load();
    window.addEventListener("direct-raven-read", onRead);
    return () => {
      active = false;
      document.removeEventListener("pointerdown", unlockSound);
      document.removeEventListener("keydown", unlockSound);
      authListener.subscription.unsubscribe();
      window.removeEventListener("direct-raven-read", onRead);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [pathname]);

  if (!signedIn) return null;
  return (
    <Link href="/messages" className={`${styles.notificationsButton} ${styles.directRavenButton}`} aria-label={unread ? `Direct Raven, ${unread} unread` : "Direct Raven"} title="Direct Raven">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="m4.5 7 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {unread > 0 && <span className={styles.navBadge}>{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}
