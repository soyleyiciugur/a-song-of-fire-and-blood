"use client";

import { useEffect } from "react";
import ShellUpdate from "./ShellUpdate";
import { restorePush } from "@/lib/pwa/client";
import { useRouter } from "next/navigation";

export default function PwaBoot() {
  const router = useRouter();
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const receive = (event: MessageEvent) => {
      if (event.data?.type !== "ASOFAB_OPEN_NOTIFICATION" || typeof event.data.url !== "string") return;
      try {
        const target = new URL(event.data.url, location.origin);
        if (target.origin !== location.origin || target.pathname !== "/notifications") return;
        const href = `${target.pathname}${target.search}`;
        if (location.pathname === target.pathname) window.history.replaceState(null, "", href);
        else router.push(href);
        event.ports[0]?.postMessage("navigated");
      } catch { /* Ignore invalid notification destinations. */ }
    };
    navigator.serviceWorker.addEventListener("message", receive);
    return () => navigator.serviceWorker.removeEventListener("message", receive);
  }, [router]);
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

  return <ShellUpdate />;
}
