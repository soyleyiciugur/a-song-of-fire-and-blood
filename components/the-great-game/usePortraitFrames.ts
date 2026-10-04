"use client";

import { useEffect, useState } from "react";

export type PortraitFrames = { profile?: string; house?: string };

export function usePortraitFrames(matchKey: string, active: boolean): PortraitFrames {
  const [catalog, setCatalog] = useState<{ profiles: string[]; houses: string[] }>({ profiles: [], houses: [] });
  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    fetch("/api/cards/profile-frames", { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error("Frames unavailable"); return response.json(); })
      .then(setCatalog)
      .catch(() => { /* Retain the unobtrusive CSS fallback when assets are unavailable. */ });
    return () => controller.abort();
  }, [active, matchKey]);
  let seed = 2166136261;
  for (const char of matchKey) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619);
  return {
    profile: catalog.profiles[(seed >>> 0) % catalog.profiles.length],
    house: catalog.houses[0],
  };
}
