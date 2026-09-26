"use client";

import { useEffect, useState } from "react";

let frontRequest: Promise<string | null> | null = null;

function loadDeckFront(): Promise<string | null> {
  frontRequest ??= fetch("/api/cards/deck-backs", { cache: "no-store" })
    .then((response) => response.ok ? response.json() as Promise<{ front: string | null }> : null)
    .then((result) => result?.front ?? null)
    .catch(() => {
      frontRequest = null;
      return null;
    });
  return frontRequest;
}

export function useDeckFront(enabled: boolean): string | null {
  const [front, setFront] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    loadDeckFront().then((result) => {
      if (active) setFront(result);
    });
    return () => { active = false; };
  }, [enabled]);

  return front;
}
