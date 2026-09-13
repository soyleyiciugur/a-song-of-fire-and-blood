"use client";

import { useEffect } from "react";

export default function PwaBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (!cancelled) void registration.update();
      } catch (error) {
        console.error("ASOFAB service worker could not be registered.", error);
      }
    };
    if (document.readyState === "complete") void register();
    else window.addEventListener("load", register, { once: true });
    return () => { cancelled = true; window.removeEventListener("load", register); };
  }, []);

  return null;
}
