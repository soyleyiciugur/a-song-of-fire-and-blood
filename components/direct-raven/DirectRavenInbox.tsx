"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { RavenConversationSummary } from "@/lib/directRaven";
import type { DirectRavenMessage } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import styles from "./direct-raven.module.css";
import RavenSoundToggle from "./RavenSoundToggle";
import NewRaven from "./NewRaven";
import NewGuildParley from "./NewGuildParley";
import GuildAvatar from "./GuildAvatar";
import RavenIcon from "./RavenIcon";
import { RavenMessagePreview } from "./RavenMessageContent";

const time = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const summaryStamp = (item: RavenConversationSummary) => item.lastMessage?.created_at ?? item.conversation.updated_at;

export default function DirectRavenInbox({ conversations }: { conversations: RavenConversationSummary[] }) {
  const pathname = usePathname();
  const selectedId = pathname.startsWith("/messages/") ? pathname.split("/")[2] : undefined;
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(conversations);
  const [filter, setFilter] = useState("");
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setItems(conversations), [conversations]);

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
          return summary
            ? { ...item, lastMessage: summary.last_message, unread: Number(summary.unread ?? 0) }
            : item;
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
    const onVisible = () => document.visibilityState === "visible" && scheduleSummarySync();
    window.addEventListener("direct-raven-read", onRead);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      window.removeEventListener("direct-raven-read", onRead);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [scheduleSummarySync, supabase]);

  const visible = items.filter(({ conversation, partner, members }) => {
    const haystack = conversation.kind === "guild"
      ? `${conversation.title ?? ""} ${conversation.description ?? ""} ${members.map((member) => `${member.display_name} ${member.username}`).join(" ")}`
      : `${partner?.display_name ?? ""} ${partner?.username ?? ""}`;
    return haystack.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <aside className={styles.inbox} aria-label="Ravens and Guild Parleys">
      <div className={styles.inboxHeader}>
        <p className={styles.kicker}>Private correspondence</p>
        <h1><RavenIcon /> Direct Raven</h1>
        <RavenSoundToggle />
        <div className={styles.inboxCreateActions}><NewRaven /><NewGuildParley /></div>
        <input
          className={styles.inboxSearch}
          aria-label="Filter conversations"
          placeholder="Find a raven or guild"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
      </div>
      <div className={styles.conversationList}>
        {items.length === 0 && (
          <div className={styles.emptyInbox}>
            <span aria-hidden="true">◆</span>
            <p>No ravens have arrived.</p>
            <small>Start a Raven or gather a Guild Parley.</small>
          </div>
        )}
        {visible.map(({ conversation, partner, members, lastMessage, unread }) => {
          const guild = conversation.kind === "guild";
          const title = guild ? conversation.title ?? "Guild Parley" : partner?.display_name ?? "Unknown member";
          const subtitle = guild ? `Guild Parley · ${members.length} members` : partner ? `@${partner.username}` : "Direct Raven";
          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              scroll={false}
              prefetch
              className={`${styles.conversationItem} ${selectedId === conversation.id ? styles.selectedConversation : ""}`}
            >
              {guild
                ? <GuildAvatar path={conversation.avatar_path} name={title} />
                : <span className={styles.avatar}>{partner?.avatar_url ? <img src={partner.avatar_url} alt="" /> : title.slice(0, 2).toUpperCase()}</span>}
              <span className={styles.conversationCopy}>
                <span className={styles.conversationTop}><b>{title}</b><time>{time(lastMessage?.created_at ?? conversation.updated_at)}</time></span>
                <span className={guild ? styles.guildHandle : styles.handle}>{subtitle}</span>
                <span className={styles.preview}>
                  {lastMessage
                    ? lastMessage.deleted_at
                      ? "A message was withdrawn."
                      : lastMessage.body
                        ? <RavenMessagePreview body={lastMessage.body} />
                        : "Photo / GIF"
                    : guild ? "The parley awaits its first message." : "No message yet."}
                </span>
              </span>
              {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
