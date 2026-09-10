"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { DirectRavenMessage, Profile } from "@/lib/supabase/database.types";
import styles from "./direct-raven.module.css";

const formatTime = (value: string) => new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" }).format(new Date(value));

export default function RavenConversation({ conversationId, userId, partner, initialMessages, blockedByMe: initialBlockedByMe, blockedByThem }: {
  conversationId: string;
  userId: string;
  partner: Profile;
  initialMessages: DirectRavenMessage[];
  blockedByMe: boolean;
  blockedByThem: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [blockedByMe, setBlockedByMe] = useState(initialBlockedByMe);
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const markRead = async () => {
    await supabase.from("direct_raven_reads").upsert({ conversation_id: conversationId, user_id: userId, last_read_at: new Date().toISOString() }, { onConflict: "conversation_id,user_id" });
    window.dispatchEvent(new Event("direct-raven-read"));
  };

  useEffect(() => {
    void markRead();
    endRef.current?.scrollIntoView({ block: "end" });
    const channel = supabase
      .channel(`direct-raven:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const message = payload.new as DirectRavenMessage;
        setMessages((current) => current.some((m) => m.id === message.id) ? current : [...current, message]);
        if (message.sender_id !== userId) window.setTimeout(() => void markRead(), 0);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        const message = payload.new as DirectRavenMessage;
        setMessages((current) => current.map((m) => m.id === message.id ? message : m));
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, supabase, userId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const clean = body.trim();
    if (!clean || sending || blockedByMe || blockedByThem) return;
    setSending(true); setError("");
    const { error: sendError } = await supabase.from("direct_raven_messages").insert({ conversation_id: conversationId, sender_id: userId, body: clean });
    if (sendError) setError("The raven could not be sent."); else setBody("");
    setSending(false);
  };

  const withdraw = async (id: string) => {
    await supabase.from("direct_raven_messages").update({ deleted_at: new Date().toISOString() }).eq("id", id).eq("sender_id", userId);
  };

  const toggleBlock = async () => {
    setError("");
    if (blockedByMe) {
      const { error: e } = await supabase.from("direct_raven_blocks").delete().eq("blocker_id", userId).eq("blocked_id", partner.id);
      if (!e) setBlockedByMe(false); else setError("Could not reopen this raven path.");
    } else {
      const { error: e } = await supabase.from("direct_raven_blocks").insert({ blocker_id: userId, blocked_id: partner.id });
      if (!e) { setBlockedByMe(true); setMenuOpen(false); } else setError("Could not close this raven path.");
    }
  };

  const closed = blockedByMe || blockedByThem;
  return (
    <section className={styles.thread}>
      <header className={styles.threadHeader}>
        <Link href={`/users/${partner.username}`} className={styles.partnerIdentity}>
          <span className={styles.avatar}>{partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}</span>
          <span><b>{partner.display_name}</b><small>@{partner.username}</small></span>
        </Link>
        <div className={styles.threadMenuWrap}>
          <button type="button" className={styles.threadMenuButton} onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="Conversation options">•••</button>
          {menuOpen && <div className={styles.threadMenu}><button type="button" onClick={toggleBlock}>{blockedByMe ? "Unblock user" : "Block user"}</button></div>}
        </div>
      </header>

      <div className={styles.messages}>
        {messages.length === 0 && <div className={styles.emptyThread}><span aria-hidden="true">✦</span><h2>A clear sky between two keeps.</h2><p>Send the first raven to {partner.display_name}.</p></div>}
        {messages.map((message) => {
          const mine = message.sender_id === userId;
          return <div key={message.id} className={`${styles.messageRow} ${mine ? styles.mine : styles.theirs}`}>
            <div className={`${styles.messageBubble} ${message.deleted_at ? styles.deletedMessage : ""}`}>
              <p>{message.deleted_at ? "This raven was withdrawn." : message.body}</p>
              <span><time>{formatTime(message.created_at)}</time>{message.edited_at && !message.deleted_at ? " · edited" : ""}</span>
              {mine && !message.deleted_at && <button type="button" className={styles.withdraw} onClick={() => void withdraw(message.id)}>Withdraw</button>}
            </div>
          </div>;
        })}
        <div ref={endRef} />
      </div>

      <div className={styles.composerArea}>
        {closed ? <div className={styles.closedNotice}>{blockedByMe ? "You closed this raven path. Unblock this user to send again." : "This raven path is closed."}</div> :
        <form className={styles.composer} onSubmit={send}>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} rows={2} placeholder="Write your raven…" aria-label="Message" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
          <button type="submit" disabled={sending || !body.trim()}>{sending ? "Sending…" : "Send Raven"}</button>
        </form>}
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </section>
  );
}
