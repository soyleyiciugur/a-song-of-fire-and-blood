"use client";

import { useEffect } from "react";

const HOME_SCROLL_KEY = "asofab:home-latest-scroll";

export default function HomeScrollRestorer() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("resume") !== "latest-updates") return;

    let saved: number | null = null;
    try {
      const raw = sessionStorage.getItem(HOME_SCROLL_KEY);
      const value = raw == null ? NaN : Number(raw);
      if (Number.isFinite(value)) saved = value;
      sessionStorage.removeItem(HOME_SCROLL_KEY);
    } catch {}

    const restore = () => {
      if (saved !== null) window.scrollTo({ top: saved, left: 0, behavior: "auto" });
      else document.getElementById("latest-updates")?.scrollIntoView({ block: "start", behavior: "auto" });
    };

    const first = requestAnimationFrame(() => requestAnimationFrame(restore));
    const settle = window.setTimeout(restore, 180);

    url.searchParams.delete("resume");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);

    return () => {
      cancelAnimationFrame(first);
      window.clearTimeout(settle);
    };
  }, []);

  return null;
}
