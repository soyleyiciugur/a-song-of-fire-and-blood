"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ShellUpdate from "./ShellUpdate";
import AndroidInstallPrompt from "./AndroidInstallPrompt";
import PullToRefresh from "./PullToRefresh";
import { restorePush } from "@/lib/pwa/client";
import { createClient } from "@/lib/supabase/client";
import NotificationPortrait from "@/components/notifications/NotificationPortrait";
import NotificationSourceIcon from "@/components/notifications/NotificationSourceIcon";
import { notificationSourceLabel } from "@/lib/notifications/source";
import type { NotificationMascot, NotificationSource } from "@/lib/notifications/types";
import styles from "./inAppNotification.module.css";

type ForegroundNotification = {
  title: string;
  body: string;
  data: {
    notificationId?: string;
    source?: NotificationSource;
    mascot?: NotificationMascot;
    conversationId?: string;
    targetHref?: string;
    actorUsername?: string;
    actorAvatarUrl?: string;
    conversationTitle?: string;
    guildAvatarUrl?: string;
    messagePreview?: string;
    messageNotification?: boolean;
  };
};

type BannerState = ForegroundNotification & { burstCount: number };

function validSource(value: unknown): value is NotificationSource {
  return ["tavern", "ravens-eye", "direct-raven", "guild-parley", "chronicle", "guestbook", "realm"].includes(String(value));
}
function validMascot(value: unknown): value is NotificationMascot { return value === "mara" || value === "aldren"; }

export default function PwaBoot() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [banner, setBanner] = useState<BannerState | null>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 7000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const receive = (event: MessageEvent) => {
      if (event.data?.type === "ASOFAB_OPEN_NOTIFICATION" && typeof event.data.url === "string") {
        try {
          const target = new URL(event.data.url, location.origin);
          if (target.origin !== location.origin || target.pathname !== "/notifications") return;
          const href = `${target.pathname}${target.search}`;
          if (location.pathname === target.pathname) window.history.replaceState(null, "", href);
          else router.push(href);
          event.ports[0]?.postMessage("navigated");
        } catch { /* Ignore invalid notification destinations. */ }
        return;
      }

      if (event.data?.type !== "ASOFAB_PUSH_NOTIFICATION") return;
      const raw = event.data.notification as Partial<ForegroundNotification> | undefined;
      const data = raw?.data ?? {};
      if (!raw || typeof raw.title !== "string" || typeof raw.body !== "string" || !validSource(data.source) || !validMascot(data.mascot)) {
        event.ports[0]?.postMessage({ handled: false });
        return;
      }

      const notification: ForegroundNotification = { title: raw.title, body: raw.body, data: { ...data, source: data.source, mascot: data.mascot } };
      const activeConversation = document.documentElement.dataset.activeRavenConversation;
      const ravenWorkspaceOpen = document.documentElement.dataset.directRavenWorkspaceActive === "1";
      const sameOpenRaven = document.visibilityState === "visible"
        && (data.source === "direct-raven" || data.source === "guild-parley")
        && (ravenWorkspaceOpen || (typeof data.conversationId === "string" && data.conversationId === activeConversation));

      if (sameOpenRaven) {
        event.ports[0]?.postMessage({ handled: true, action: "suppressed" });
        if (typeof data.notificationId === "string") {
          void (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const readAt = new Date().toISOString();
            await supabase.from("site_notifications").update({ read_at: readAt }).eq("id", data.notificationId).eq("user_id", user.id).is("read_at", null);
            window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
          })();
        }
        return;
      }

      window.dispatchEvent(new CustomEvent("asofab:notifications-changed"));
      setBanner((current) => {
        const sameBurst = Boolean(
          current?.data.messageNotification && notification.data.messageNotification &&
          current.data.conversationId && current.data.conversationId === notification.data.conversationId
        );
        return { ...notification, burstCount: sameBurst ? current!.burstCount + 1 : 1 };
      });
      event.ports[0]?.postMessage({ handled: true, action: "in-app" });
    };
    navigator.serviceWorker.addEventListener("message", receive);
    return () => navigator.serviceWorker.removeEventListener("message", receive);
  }, [router, supabase]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (!cancelled) void registration.update();
        await navigator.serviceWorker.ready;
        if (!cancelled) void restorePush().catch(() => { /* Raven Settings offers explicit recovery. */ });
      } catch (error) {
        console.error("ASOFAB service worker could not be registered.", error);
      }
    };
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });
    return () => { cancelled = true; window.removeEventListener("load", register); };
  }, []);

  const openBanner = () => {
    if (!banner) return;
    const id = banner.data.notificationId;
    const target = banner.data.messageNotification && banner.data.targetHref
      ? banner.data.targetHref
      : id ? `/notifications?open=${encodeURIComponent(id)}` : "/notifications";
    setBanner(null);
    router.push(target);
  };

  return <>
    <ShellUpdate />
    <AndroidInstallPrompt />
    <PullToRefresh />
    {banner && banner.data.source && banner.data.mascot && <aside className={`${styles.banner} ${banner.data.messageNotification ? styles.messageBanner : ""}`} role="status" aria-label="New raven notification">
      <button type="button" className={styles.bannerButton} onClick={openBanner}>
        {banner.data.messageNotification ? (
          <span className={styles.messageAvatar} aria-hidden="true">
            {(banner.data.source === "guild-parley" ? banner.data.guildAvatarUrl : banner.data.actorAvatarUrl)
              ? <img src={(banner.data.source === "guild-parley" ? banner.data.guildAvatarUrl : banner.data.actorAvatarUrl)!} alt="" />
              : <span>{(banner.data.source === "guild-parley" ? banner.data.conversationTitle : banner.data.actorUsername)?.slice(0, 2).toUpperCase() || "DR"}</span>}
          </span>
        ) : <NotificationPortrait mascot={banner.data.mascot} source={banner.data.source} size={48} />}
        <span className={styles.copy}>
          <span className={styles.source}><NotificationSourceIcon source={banner.data.source} size={12} />{notificationSourceLabel(banner.data.source)}{banner.burstCount > 1 && <em>{banner.burstCount} new</em>}</span>
          {banner.data.messageNotification ? (
            <>
              <strong>{banner.data.source === "guild-parley" ? banner.data.conversationTitle || "Guild Parley" : `@${banner.data.actorUsername || "raven"}`}</strong>
              <p>{banner.data.source === "guild-parley" && banner.data.actorUsername ? `@${banner.data.actorUsername}: ` : ""}{banner.data.messagePreview || banner.body}</p>
            </>
          ) : <>
            <strong>{banner.title}</strong>
            <p>{banner.body}</p>
          </>}
        </span>
      </button>
      <button type="button" className={styles.close} aria-label="Dismiss notification" onClick={() => setBanner(null)}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" /></svg></button>
    </aside>}
  </>;
}
