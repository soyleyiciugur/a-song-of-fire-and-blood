"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

const Presence = createContext<{ ids: Set<string>; ready: boolean }>({ ids: new Set(), ready: false });
export const useSitePresence = () => useContext(Presence);

export default function SitePresence({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState({ ids: new Set<string>(), ready: false });
  useEffect(() => {
    let disposed = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let currentUser: string | null = null;
    const connect = (id: string | null) => {
      if (disposed || id === currentUser) return;
      currentUser = id;
      if (channel) void supabase.removeChannel(channel);
      channel = null;
      setValue({ ids: new Set(), ready: false });
      if (!id) return;
      const next = supabase.channel("site-member-presence", { config: { presence: { key: crypto.randomUUID() } } });
      channel = next;
      next.on("presence", { event: "sync" }, () => {
        if (!disposed && channel === next) setValue({ ids: new Set(Object.values(next.presenceState<{ user_id: string }>()).flat().map(row => row.user_id)), ready: true });
      }).subscribe(async status => {
        if (disposed || channel !== next) return;
        if (status === "SUBSCRIBED") await next.track({ user_id: id });
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setValue({ ids: new Set(), ready: false });
      });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => connect(session?.user.id ?? null));
    return () => { disposed = true; subscription.unsubscribe(); if (channel) void supabase.removeChannel(channel); };
  }, [supabase]);
  return <Presence.Provider value={value}>{children}</Presence.Provider>;
}
