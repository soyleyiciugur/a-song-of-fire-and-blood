import Link from "next/link";
import type { RavenConversationSummary } from "@/lib/directRaven";
import styles from "./direct-raven.module.css";

const time = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function DirectRavenInbox({ conversations, selectedId }: { conversations: RavenConversationSummary[]; selectedId?: string }) {
  return (
    <aside className={styles.inbox} aria-label="Direct Raven conversations">
      <div className={styles.inboxHeader}>
        <p className={styles.kicker}>Private correspondence</p>
        <h1>Direct Raven</h1>
      </div>
      <div className={styles.conversationList}>
        {conversations.length === 0 && <div className={styles.emptyInbox}><span aria-hidden="true">◆</span><p>No ravens have arrived.</p><small>Visit a member’s profile to begin a private correspondence.</small></div>}
        {conversations.map(({ conversation, partner, lastMessage, unread }) => (
          <Link key={conversation.id} href={`/messages/${conversation.id}`} className={`${styles.conversationItem} ${selectedId === conversation.id ? styles.selectedConversation : ""}`}>
            <span className={styles.avatar}>{partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}</span>
            <span className={styles.conversationCopy}>
              <span className={styles.conversationTop}><b>{partner.display_name}</b><time>{time(lastMessage?.created_at ?? conversation.updated_at)}</time></span>
              <span className={styles.handle}>@{partner.username}</span>
              <span className={styles.preview}>{lastMessage ? (lastMessage.deleted_at ? "A message was withdrawn." : lastMessage.body) : "No message yet."}</span>
            </span>
            {unread > 0 && <span className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}
