"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RavenConversationSummary } from "@/lib/directRaven";
import styles from "./direct-raven.module.css";
import NewRaven from "./NewRaven";
import NewGuildParley from "./NewGuildParley";
import GuildAvatar from "./GuildAvatar";
import RavenIcon from "./RavenIcon";
import { RavenMessagePreview } from "./RavenMessageContent";

const time = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function DirectRavenInbox({ conversations, selectedId }: { conversations: RavenConversationSummary[]; selectedId?: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  useEffect(() => { const refresh = () => { if (document.visibilityState === "visible") router.refresh(); }; const timer = setInterval(refresh, 15000); window.addEventListener("direct-raven-read", refresh); return () => { clearInterval(timer); window.removeEventListener("direct-raven-read", refresh); }; }, [router]);

  const visible = conversations.filter(({ conversation, partner, members }) => {
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
        <div className={styles.inboxCreateActions}><NewRaven /><NewGuildParley /></div>
        <input className={styles.inboxSearch} aria-label="Filter conversations" placeholder="Find a raven or guild" value={filter} onChange={event => setFilter(event.target.value)} />
      </div>
      <div className={styles.conversationList}>
        {conversations.length === 0 && <div className={styles.emptyInbox}><span aria-hidden="true">◆</span><p>No ravens have arrived.</p><small>Start a Raven or gather a Guild Parley.</small></div>}
        {visible.map(({ conversation, partner, members, lastMessage, unread }) => {
          const guild = conversation.kind === "guild";
          const title = guild ? conversation.title ?? "Guild Parley" : partner?.display_name ?? "Unknown member";
          const subtitle = guild ? `Guild Parley · ${members.length} members` : partner ? `@${partner.username}` : "Direct Raven";
          return (
            <Link key={conversation.id} href={`/messages/${conversation.id}`} className={`${styles.conversationItem} ${selectedId === conversation.id ? styles.selectedConversation : ""}`}>
              {guild ? <GuildAvatar path={conversation.avatar_path} name={title} /> : <span className={styles.avatar}>{partner?.avatar_url ? <img src={partner.avatar_url} alt="" /> : title.slice(0, 2).toUpperCase()}</span>}
              <span className={styles.conversationCopy}>
                <span className={styles.conversationTop}><b>{title}</b><time>{time(lastMessage?.created_at ?? conversation.updated_at)}</time></span>
                <span className={guild ? styles.guildHandle : styles.handle}>{subtitle}</span>
                <span className={styles.preview}>{lastMessage ? (lastMessage.deleted_at ? "A message was withdrawn." : lastMessage.body ? <RavenMessagePreview body={lastMessage.body} /> : "Photo / GIF") : guild ? "The parley awaits its first message." : "No message yet."}</span>
              </span>
              {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
