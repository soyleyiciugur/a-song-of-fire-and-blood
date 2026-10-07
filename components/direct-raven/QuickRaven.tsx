"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { loadDirectRavenConversationOnly } from "@/lib/directRaven";
import RavenConversation from "./RavenConversation";
import RavenIcon from "./RavenIcon";
import styles from "@/components/the-great-game/play-hub.module.css";

type Loaded = NonNullable<Awaited<ReturnType<typeof loadDirectRavenConversationOnly>>>;
export default function QuickRaven({ username, onClose }: { username: string; onClose: () => void }) {
  const client = useMemo(() => createClient(), []);
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState("");
  const [closing, setClosing] = useState(false);
  const close = () => setClosing(true);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, 160);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const { data: id, error } = await client.rpc("start_direct_raven", { target_username: username });
      if (error || !id) throw Error("This Raven path is closed.");
      const response = await fetch(`/api/direct-raven/conversation?id=${encodeURIComponent(id)}`, { signal: controller.signal, cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw Error(payload.error || "The raven could not be opened.");
      if (!controller.signal.aborted) setData(payload);
    }
    void load().catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [client, username]);
  return <section className={styles.quickDock} data-closing={closing} aria-label={`Quick message to @${username}`} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); close(); } }}>
    {!data?.selected && <header className={styles.quickDockHeader}><span><RavenIcon size={18} /> @{username}</span><button onClick={close} aria-label="Close quick message">×</button></header>}
    {error ? <p role="alert" className={styles.empty}>{error}</p> : data?.selected ? <div className={styles.quickRaven} onClick={event => {
      const anchor = (event.target as HTMLElement).closest("a");
      if (anchor?.getAttribute("href")?.startsWith("/cards/play?join=")) onClose();
    }}>
      <RavenConversation embedded onClose={close} conversationId={data.selected.conversation.id} conversation={data.selected.conversation} userId={data.userId}
        partner={data.selected.partner} members={data.selected.members} memberships={data.selected.memberships}
        initialMessages={data.messages} initialSystemEvents={data.systemEvents} initialLastReadAt={data.initialLastReadAt}
        blockedByMe={data.blockedByMe} blockedByThem={data.blockedByThem} />
    </div> : <p role="status" className={styles.empty}>Opening the Raven window…</p>}
  </section>;
}
