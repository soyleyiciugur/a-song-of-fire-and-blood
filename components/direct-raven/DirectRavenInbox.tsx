"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { RavenConversationSummary } from "@/lib/directRaven";
import styles from "./direct-raven.module.css";
import NewRaven from "./NewRaven";
import RavenIcon from "./RavenIcon";

const time = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function DirectRavenInbox({ conversations, selectedId }: { conversations: RavenConversationSummary[]; selectedId?: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  useEffect(() => { const refresh = () => { if (document.visibilityState === "visible") router.refresh(); }; const timer = setInterval(refresh, 15000); window.addEventListener("direct-raven-read", refresh); return () => { clearInterval(timer); window.removeEventListener("direct-raven-read", refresh); }; }, [router]);
  const visible = conversations.filter(({ partner }) => `${partner.display_name} ${partner.username}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <aside className={styles.inbox} aria-label="Direct Raven conversations">
      <div className={styles.inboxHeader}>
        <p className={styles.kicker}>Private correspondence</p>
        <h1><RavenIcon /> Direct Raven</h1>
        <NewRaven />
        <input className={styles.inboxSearch} aria-label="Filter conversations" placeholder="Find a conversation" value={filter} onChange={e => setFilter(e.target.value)} />
      </div>
      <div className={styles.conversationList}>
        {conversations.length === 0 && <div className={styles.emptyInbox}><span aria-hidden="true">◆</span><p>No ravens have arrived.</p><small>Choose New Raven to start a conversation.</small></div>}
        {visible.map(({ conversation, partner, lastMessage, unread }) => (
          <Link key={conversation.id} href={`/messages/${conversation.id}`} className={`${styles.conversationItem} ${selectedId === conversation.id ? styles.selectedConversation : ""}`}>
            <span className={styles.avatar}>{partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}</span>
            <span className={styles.conversationCopy}>
              <span className={styles.conversationTop}><b>{partner.display_name}</b><time>{time(lastMessage?.created_at ?? conversation.updated_at)}</time></span>
              <span className={styles.handle}>@{partner.username}</span>
              <span className={styles.preview}>{lastMessage ? (lastMessage.deleted_at ? "A message was withdrawn." : lastMessage.body || "Photo / GIF") : "No message yet."}</span>
            </span>
            {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}
