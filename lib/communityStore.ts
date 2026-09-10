"use client";

import { useSyncExternalStore } from "react";
import type { CommunitySnapshot } from "./communityTypes";

const empty = { users: [], comments: [], updates: [], serverTime: "", loaded: false, error: "" } as CommunitySnapshot & { loaded: boolean; error: string };
let snapshot = empty;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let request: Promise<void> | undefined;

export function refreshCommunity() {
  if (request) return request;
  request = (async () => {
    try {
      const response = await fetch("/api/community", { cache: "no-store", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error("Could not load comments.");
      const data = await response.json() as CommunitySnapshot;
      snapshot = { ...data, loaded: true, error: "" };
    } catch {
      snapshot = { ...snapshot, error: "Comments could not be refreshed. Try again." };
    } finally {
      request = undefined;
      listeners.forEach((listener) => listener());
    }
  })();
  return request;
}

function onVisible() { if (document.visibilityState === "visible") void refreshCommunity(); }
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    void refreshCommunity();
    timer = setInterval(onVisible, 15000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    }
  };
}

export const getCommunitySnapshot = () => snapshot;
export function useCommunity() { return useSyncExternalStore(subscribe, getCommunitySnapshot, () => empty); }
