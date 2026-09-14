"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { playRavenSound, unlockSound } from "@/lib/ravenSound";
import styles from "@/components/nav/navbar.module.css";
import RavenIcon from "./RavenIcon";

export default function DirectRavenNavButton() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let currentUser: string | undefined;
    let optimisticReadUntil = 0;
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
      if (active && Date.now() >= optimisticReadUntil) setUnread(Number(data ?? 0));
    };

    void load();
    channel = supabase
      .channel("direct-raven-navbar")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_raven_messages" }, (payload) => {
        const sameOpenConversation = document.visibilityState === "visible"
          && document.documentElement.dataset.activeRavenConversation === payload.new.conversation_id;
        if (currentUser && payload.new.sender_id !== currentUser && !sameOpenConversation) playRavenSound();
        // The open conversation writes its read marker immediately. Avoid querying
        // unread totals in the tiny window before that upsert lands, otherwise the
        // navbar badge can flash for a message the user is already looking at.
        if (!sameOpenConversation) void load();
      })
      .subscribe();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => window.setTimeout(() => void load(), 0));

    const onRead = (event: Event) => {
      const detail = (event as CustomEvent<{ cleared?: number }>).detail;
      const cleared = Number(detail?.cleared ?? 0);
      if (cleared > 0) {
        optimisticReadUntil = Date.now() + 600;
        setUnread((current) => Math.max(0, current - cleared));
      }
      window.setTimeout(() => void load(), cleared > 0 ? 650 : 80);
    };
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
      <RavenIcon size={19} />
      {unread > 0 && <span className={styles.navBadge}>{unread > 99 ? "99+" : unread}</span>}
    </Link>
  );
}
