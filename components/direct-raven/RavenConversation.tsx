"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { DirectRavenMessage, Profile } from "@/lib/supabase/database.types";
import LikeButton from "@/components/community/LikeButton";
import RavenAttachment from "./RavenAttachment";
import RavenIcon from "./RavenIcon";
import styles from "./direct-raven.module.css";
const time = (v: string) => new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(v));
const day = (v: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(v));
const emojis = ["😀", "😂", "🥹", "😍", "❤️", "🔥", "👍", "👀", "😭", "💀", "🐦‍⬛", "🐉", "✨", "🙏", "🎉", "🍷"];
export default function RavenConversation({ conversationId, userId, partner, initialMessages, blockedByMe: initialBlockedByMe, blockedByThem: initialBlockedByThem }: {
  conversationId: string; userId: string; partner: Profile; initialMessages: DirectRavenMessage[]; blockedByMe: boolean; blockedByThem: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState(""), [error, setError] = useState("");
  const [sending, setSending] = useState(false), [menuOpen, setMenuOpen] = useState(false), [emojiOpen, setEmojiOpen] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(initialBlockedByMe), [blockedByThem, setBlockedByThem] = useState(initialBlockedByThem);
  const [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState("");
  const [reply, setReply] = useState<DirectRavenMessage | null>(null), [editing, setEditing] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(initialMessages.length === 100), [loadingOlder, setLoadingOlder] = useState(false);
  const [partnerRead, setPartnerRead] = useState(""), [newMessages, setNewMessages] = useState(false);
  const listRef = useRef<HTMLDivElement>(null), inputRef = useRef<HTMLTextAreaElement>(null);
  const nearBottom = useRef(true), loadedMessages = useRef(messages), sendLock = useRef(false);
  const closed = blockedByMe || blockedByThem;
  const scrollBottom = () => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; nearBottom.current = true; setNewMessages(false); };
  useEffect(() => { loadedMessages.current = messages; if (nearBottom.current) scrollBottom(); }, [messages]);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    let active = true;
    const markRead = async () => {
      if (document.visibilityState !== "visible" || !nearBottom.current) return;
      const latest = loadedMessages.current.at(-1);
      if (!latest) return;
      await supabase.from("direct_raven_reads").upsert({ conversation_id: conversationId, user_id: userId, last_read_at: latest.created_at }, { onConflict: "conversation_id,user_id" });
      window.dispatchEvent(new Event("direct-raven-read"));
    };
    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      let query = supabase.from("direct_raven_messages").select("*").eq("conversation_id", conversationId).order("created_at");
      const oldest = loadedMessages.current[0];
      if (oldest) query = query.gte("created_at", oldest.created_at);
      const [{ data }, { data: reads }, { data: blocks }] = await Promise.all([
        query, supabase.from("direct_raven_reads").select("last_read_at").eq("conversation_id", conversationId).eq("user_id", partner.id).maybeSingle(),
        supabase.from("direct_raven_blocks").select("blocker_id,blocked_id").or(`and(blocker_id.eq.${userId},blocked_id.eq.${partner.id}),and(blocker_id.eq.${partner.id},blocked_id.eq.${userId})`),
      ]);
      if (!active) return;
      if (data) {
        if (!nearBottom.current && data.some(m => !loadedMessages.current.some(old => old.id === m.id))) setNewMessages(true);
        setMessages(current => {
          const map = new Map(current.map(m => [m.id, m]));
          (data as DirectRavenMessage[]).forEach(m => map.set(m.id, m));
          return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
        });
      }
      setPartnerRead(reads?.last_read_at ?? "");
      if (blocks) { setBlockedByMe(blocks.some(b => b.blocker_id === userId)); setBlockedByThem(blocks.some(b => b.blocker_id === partner.id)); }
      void markRead();
    };
    scrollBottom(); void sync();
    const channel = supabase.channel(`direct-raven:${conversationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` }, () => void sync()).subscribe();
    const timer = setInterval(() => void sync(), 10000);
    const visible = () => { void sync(); };
    const read = () => { if (nearBottom.current) void markRead(); };
    document.addEventListener("visibilitychange", visible);
    const el = listRef.current; el?.addEventListener("scrollend", read);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", visible); el?.removeEventListener("scrollend", read); void supabase.removeChannel(channel); };
  }, [conversationId, supabase, userId, partner.id]);
  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(next.type) || next.size > 8 * 1024 * 1024) { setError("Choose a JPEG, PNG, WebP or GIF up to 8 MB."); return; }
    setError(""); setFile(next);
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    if ((!body.trim() && !file) || sendLock.current || closed) return;
    sendLock.current = true; setSending(true); setError("");
    let path: string | null = null;
    try {
      if (file && !editing) {
        const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
        path = `${conversationId}/${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("raven-media").upload(path, file, { contentType: file.type });
        if (error) throw Error("The image could not be uploaded. Please try again.");
      }
      const query = editing ? supabase.from("direct_raven_messages").update({ body: body.trim() }).eq("id", editing).eq("sender_id", userId).is("deleted_at", null) : supabase.from("direct_raven_messages").insert({ conversation_id: conversationId, sender_id: userId, body: body.trim(), ...(path ? { attachment_path: path } : {}), ...(reply ? { reply_to: reply.id } : {}) });
      const { data, error } = await query.select("*").single();
      if (error || !data) throw Error("The raven could not be sent. Your draft is still here.");
      nearBottom.current = true;
      setMessages(current => current.some(m => m.id === data.id) ? current.map(m => m.id === data.id ? data : m) : [...current, data]);
      setBody(""); setFile(null); setReply(null); setEditing(null); setEmojiOpen(false);
      window.dispatchEvent(new Event("direct-raven-read"));
    } catch (e) {
      if (path) await supabase.storage.from("raven-media").remove([path]);
      setError(e instanceof Error ? e.message : "Could not send. Please try again.");
    } finally { sendLock.current = false; setSending(false); }
  }
  async function withdraw(message: DirectRavenMessage) {
    const { data, error } = await supabase.from("direct_raven_messages").update({ deleted_at: new Date().toISOString() }).eq("id", message.id).eq("sender_id", userId).select("*").single();
    if (error || !data) { setError("Could not withdraw this raven."); return; }
    setMessages(current => current.map(m => m.id === message.id ? data : m));
    if (editing === message.id) { setEditing(null); setBody(""); }
  }
  async function toggleBlock() {
    const { error } = blockedByMe ? await supabase.from("direct_raven_blocks").delete().eq("blocker_id", userId).eq("blocked_id", partner.id) : await supabase.from("direct_raven_blocks").insert({ blocker_id: userId, blocked_id: partner.id });
    if (error) setError("Could not update this raven path."); else { setBlockedByMe(!blockedByMe); setMenuOpen(false); }
  }
  async function older() {
    if (loadingOlder || !messages[0]) return;
    setLoadingOlder(true);
    const el = listRef.current, before = el?.scrollHeight ?? 0;
    const { data, error } = await supabase.from("direct_raven_messages").select("*").eq("conversation_id", conversationId).lt("created_at", messages[0].created_at).order("created_at", { ascending: false }).limit(100);
    if (error) setError("Could not load older ravens.");
    else { nearBottom.current = false; setHasOlder(data.length === 100); setMessages(current => [...(data as DirectRavenMessage[]).reverse(), ...current]); requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - before; }); }
    setLoadingOlder(false);
  }
  return <section className={styles.thread} aria-label={`Conversation with ${partner.display_name}`}>
    <header className={styles.threadHeader}>
      <Link href="/messages" className={styles.backInbox} aria-label="Back to inbox">←</Link>
      <Link href={`/users/${partner.username}`} className={styles.partnerIdentity}><span className={styles.avatar}>{partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}</span><span><b>{partner.display_name}</b><small>@{partner.username}</small></span></Link>
      <div className={styles.threadMenuWrap}><button type="button" className={styles.threadMenuButton} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Conversation options">•••</button>{menuOpen && <div className={styles.threadMenu}><button onClick={() => void toggleBlock()}>{blockedByMe ? "Unblock user" : "Block user"}</button></div>}</div>
    </header>
    <div className={styles.messages} ref={listRef} onScroll={e => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; if (nearBottom.current) setNewMessages(false); }}>
      {hasOlder && <button className={styles.olderButton} disabled={loadingOlder} onClick={() => void older()}>{loadingOlder ? "Loading…" : "Load earlier ravens"}</button>}
      {!messages.length && <div className={styles.emptyThread}><RavenIcon size={64} /><h2>A clear sky between two keeps.</h2><p>Send the first raven to {partner.display_name}.</p></div>}
      {messages.map((message, index) => {
        const mine = message.sender_id === userId;
        const parent = messages.find(m => m.id === message.reply_to);
        return <div key={message.id}>
          {(index === 0 || day(message.created_at) !== day(messages[index - 1].created_at)) && <div className={styles.dateDivider}>{day(message.created_at)}</div>}
          <div id={`raven-${message.id}`} className={`${styles.messageRow} ${mine ? styles.mine : styles.theirs}`}><div className={`${styles.messageBubble} ${message.deleted_at ? styles.deletedMessage : ""}`}>
            {!message.deleted_at && message.reply_to && <div className={styles.replyQuote}>{parent ? (parent.deleted_at ? "Withdrawn raven" : parent.body || "Photo") : "Reply to an earlier raven"}</div>}
            {!message.deleted_at && message.attachment_path && <RavenAttachment path={message.attachment_path} onLoad={() => { if (nearBottom.current) scrollBottom(); }} />}
            <p>{message.deleted_at ? "This raven was withdrawn." : message.body}</p>
            <span><time dateTime={message.created_at}>{time(message.created_at)}</time>{message.edited_at && !message.deleted_at ? " · edited" : ""}{mine && !message.deleted_at ? (partnerRead >= message.created_at ? " · Seen" : " · Sent") : ""}</span>
            {!message.deleted_at && <div className={styles.messageActions}>
              <LikeButton kind="message" id={message.id} />
              {!closed && <button onClick={() => { setReply(message); setEditing(null); inputRef.current?.focus({ preventScroll: true }); }}>Reply</button>}
              {message.body && <button onClick={() => void navigator.clipboard.writeText(message.body).catch(() => setError("Could not copy text."))}>Copy</button>}
              {mine && <><button disabled={closed} onClick={() => { setEditing(message.id); setBody(message.body); setReply(null); setFile(null); inputRef.current?.focus({ preventScroll: true }); }}>Edit</button><button onClick={() => void withdraw(message)}>Withdraw</button></>}
            </div>}
          </div></div>
        </div>;
      })}
    </div>
    <div className={styles.composerArea}>
      {newMessages && <button className={styles.olderButton} onClick={scrollBottom}>New ravens ↓</button>}
      {closed ? <div className={styles.closedNotice}>{blockedByMe ? "You closed this raven path. Unblock this user to send again." : "This raven path is closed."}</div> : <>
        {(reply || editing) && <div className={styles.draftContext}><span>{editing ? "Editing raven" : `Replying: ${reply?.body || "Photo"}`}</span><button disabled={sending} onClick={() => { setReply(null); if (editing) setBody(""); setEditing(null); }}>Cancel</button></div>}
        {preview && <div className={styles.mediaPreview}><img src={preview} alt="Attachment preview" /><button disabled={sending} onClick={() => setFile(null)}>Remove image</button></div>}
        {emojiOpen && <div className={styles.emojiPicker} aria-label="Choose emoji">{emojis.map(emoji => <button key={emoji} disabled={sending} onClick={() => { setBody(value => (value + emoji).slice(0, 4000)); inputRef.current?.focus({ preventScroll: true }); }}>{emoji}</button>)}</div>}
        <form className={styles.composer} onSubmit={send}>
          <textarea ref={inputRef} disabled={sending} value={body} onChange={e => setBody(e.target.value)} maxLength={4000} rows={2} placeholder="Write your raven…" aria-label="Message" onPaste={e => { if (!editing) { const image = Array.from(e.clipboardData.files).find(f => f.type.startsWith("image/")); if (image) { e.preventDefault(); chooseFile(image); } } }} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
          <button type="submit" disabled={sending || (!body.trim() && !file)}><RavenIcon size={18} /> {sending ? "Sending…" : editing ? "Save" : "Send"}</button>
        </form>
        <div className={styles.composerTools}><label className={styles.fileButton} aria-disabled={!!editing || sending}>＋ Photo / GIF<input type="file" disabled={!!editing || sending} accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => { chooseFile(e.target.files?.[0]); e.target.value = ""; }} /></label><button disabled={sending} onClick={() => setEmojiOpen(!emojiOpen)} aria-expanded={emojiOpen}>☺ Emoji</button><small>Shift + Enter for a new line</small></div>
      </>}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  </section>;
}
