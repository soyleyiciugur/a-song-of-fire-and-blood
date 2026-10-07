"use client";
import { useEffect, useState } from "react";
import type { HubData } from "@/lib/the-great-game/hub";
export function useHubData() {
  const [data, setData] = useState<HubData | null>(null);
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      if (document.visibilityState !== "visible") { timer = setTimeout(refresh, 15000); return; }
      try {
        const response = await fetch("/api/great-game/hub", { signal: controller.signal, cache: "no-store" });
        if (response.status === 401) { setGuest(true); setData(null); return; }
        const payload = await response.json();
        if (!response.ok) throw Error(payload.error || "The ledger could not be opened.");
        setGuest(false); setData(payload); setError("");
      } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "The ledger could not be opened."); }
      finally { if (!controller.signal.aborted) timer = setTimeout(refresh, 15000); }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, []);
  return { data, error, guest };
}
