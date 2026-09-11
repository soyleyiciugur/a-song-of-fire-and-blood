"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { RavenConversationSummary } from "@/lib/directRaven";
import type { DirectRavenMessage } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import styles from "./direct-raven.module.css";
import NewRaven from "./NewRaven";
import RavenIcon from "./RavenIcon";
import { RavenMessagePreview } from "./RavenMessageContent";

const time = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const summaryStamp = (item: RavenConversationSummary) =>
  item.lastMessage?.created_at ?? item.conversation.updated_at;

export default function DirectRavenInbox({ conversations }: { conversations: RavenConversationSummary[] }) {
  const pathname = usePathname();
  const selectedId = pathname.startsWith("/messages/") ? pathname.split("/")[2] : undefined;
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(conversations);
  const [filter, setFilter] = useState("");
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(conversations);
  }, [conversations]);

  const syncSummaries = useCallback(async () => {
    const { data, error } = await supabase.rpc("direct_raven_summaries");
    if (error || !data) return;

    const summaryMap = new Map(
      (data as { conversation_id: string; last_message: DirectRavenMessage | null; unread: number }[]).map((summary) => [
        summary.conversation_id,
        summary,
      ])
    );

    setItems((current) =>
      current
        .map((item) => {
          const summary = summaryMap.get(item.conversation.id);
          if (!summary) return item;
          return {
            ...item,
            lastMessage: summary.last_message,
            unread: Number(summary.unread ?? 0),
          };
        })
        .sort((a, b) => summaryStamp(b).localeCompare(summaryStamp(a)))
    );
  }, [supabase]);

  const scheduleSummarySync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => void syncSummaries(), 120);
  }, [syncSummaries]);

  useEffect(() => {
    const channel = supabase
      .channel("direct-raven:inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_raven_messages" }, scheduleSummarySync)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_raven_reads" }, scheduleSummarySync)
      .subscribe();

    const onRead = () => scheduleSummarySync();
    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleSummarySync();
    };

    window.addEventListener("direct-raven-read", onRead);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      window.removeEventListener("direct-raven-read", onRead);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [scheduleSummarySync, supabase]);

  const visible = items.filter(({ partner }) =>
    `${partner.display_name} ${partner.username}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <aside className={styles.inbox} aria-label="Direct Raven conversations">
      <div className={styles.inboxHeader}>
        <p className={styles.kicker}>Private correspondence</p>
        <h1><RavenIcon /> Direct Raven</h1>
        <NewRaven />
        <input
          className={styles.inboxSearch}
          aria-label="Filter conversations"
          placeholder="Find a conversation"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>
      <div className={styles.conversationList}>
        {items.length === 0 && (
          <div className={styles.emptyInbox}>
            <span aria-hidden="true">◆</span>
            <p>No ravens have arrived.</p>
            <small>Choose New Raven to start a conversation.</small>
          </div>
        )}
        {visible.map(({ conversation, partner, lastMessage, unread }) => (
          <Link
            key={conversation.id}
            href={`/messages/${conversation.id}`}
            prefetch
            className={`${styles.conversationItem} ${selectedId === conversation.id ? styles.selectedConversation : ""}`}
          >
            <span className={styles.avatar}>
              {partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}
            </span>
            <span className={styles.conversationCopy}>
              <span className={styles.conversationTop}>
                <b>{partner.display_name}</b>
                <time>{time(lastMessage?.created_at ?? conversation.updated_at)}</time>
              </span>
              <span className={styles.handle}>@{partner.username}</span>
              <span className={styles.preview}>
                {lastMessage
                  ? lastMessage.deleted_at
                    ? "A message was withdrawn."
                    : lastMessage.body
                      ? <RavenMessagePreview body={lastMessage.body} />
                      : "Photo / GIF"
                  : "No message yet."}
              </span>
            </span>
            {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}
