"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import charactersData from "@/data/characters/characters.json";
import MiniPortrait from "@/components/MiniPortrait";
import LikeButton from "@/components/community/LikeButton";
import { createClient } from "@/lib/supabase/client";
import type { DirectRavenMessage, Profile } from "@/lib/supabase/database.types";
import RavenAttachment from "./RavenAttachment";
import RavenIcon from "./RavenIcon";
import RavenMessageContent, {
  encodeRavenBody,
  parseRavenBody,
  ravenBodySummary,
} from "./RavenMessageContent";
import styles from "./direct-raven.module.css";

const time = (value: string) =>
  new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const day = (value: string) =>
  new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));

const emojis = ["😀", "😂", "🥹", "😍", "❤️", "🔥", "👍", "👀", "😭", "💀", "🐦‍⬛", "🐉", "✨", "🙏", "🎉", "🍷"];
const MAX_PORTRAITS = 8;

type CharacterOption = {
  id: string;
  name: string;
  hidden?: boolean;
};

const portraitCharacters = (charactersData as CharacterOption[])
  .filter((character) => !character.hidden)
  .sort((a, b) => a.name.localeCompare(b.name));

type PickerTab = "emoji" | "portraits";

type Props = {
  conversationId: string;
  userId: string;
  partner: Profile;
  initialMessages: DirectRavenMessage[];
  blockedByMe: boolean;
  blockedByThem: boolean;
};

export default function RavenConversation({
  conversationId,
  userId,
  partner,
  initialMessages,
  blockedByMe: initialBlockedByMe,
  blockedByThem: initialBlockedByThem,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>("emoji");
  const [portraitSearch, setPortraitSearch] = useState("");
  const [selectedPortraits, setSelectedPortraits] = useState<string[]>([]);
  const [blockedByMe, setBlockedByMe] = useState(initialBlockedByMe);
  const [blockedByThem, setBlockedByThem] = useState(initialBlockedByThem);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [reply, setReply] = useState<DirectRavenMessage | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(initialMessages.length === 100);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [partnerRead, setPartnerRead] = useState("");
  const [newMessages, setNewMessages] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const loadedMessages = useRef(messages);
  const sendLock = useRef(false);

  const closed = blockedByMe || blockedByThem;
  const filteredPortraits = useMemo(() => {
    const query = portraitSearch.trim().toLowerCase();
    if (!query) return portraitCharacters;
    return portraitCharacters.filter(
      (character) => character.name.toLowerCase().includes(query) || character.id.includes(query)
    );
  }, [portraitSearch]);

  const scrollBottom = () => {
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
    nearBottom.current = true;
    setNewMessages(false);
  };

  const resetDraftExtras = () => {
    setSelectedPortraits([]);
    setPickerOpen(false);
    setPortraitSearch("");
  };

  const openPicker = (tab: PickerTab) => {
    const shouldClose = pickerOpen && pickerTab === tab;
    if (shouldClose) {
      setPickerOpen(false);
      return;
    }
    setPickerTab(tab);
    setPickerOpen(true);
    inputRef.current?.blur();
  };

  useEffect(() => {
    loadedMessages.current = messages;
    if (nearBottom.current) scrollBottom();
  }, [messages]);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const viewport = window.visualViewport;

    const updateViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--direct-raven-viewport-height", `${height}px`);

      requestAnimationFrame(() => {
        if (document.activeElement === inputRef.current && nearBottom.current) {
          scrollBottom();
        }
      });
    };

    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);

    return () => {
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      document.documentElement.style.removeProperty("--direct-raven-viewport-height");
    };
  }, []);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const markRead = async () => {
      if (document.visibilityState !== "visible" || !nearBottom.current) return;
      const latest = loadedMessages.current.at(-1);
      if (!latest) return;
      await supabase.from("direct_raven_reads").upsert(
        { conversation_id: conversationId, user_id: userId, last_read_at: latest.created_at },
        { onConflict: "conversation_id,user_id" }
      );
      window.dispatchEvent(new Event("direct-raven-read"));
    };

    const sync = async () => {
      if (document.visibilityState !== "visible") return;
      let query = supabase
        .from("direct_raven_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at");
      const oldest = loadedMessages.current[0];
      if (oldest) query = query.gte("created_at", oldest.created_at);

      const [{ data }, { data: reads }, { data: blocks }] = await Promise.all([
        query,
        supabase
          .from("direct_raven_reads")
          .select("last_read_at")
          .eq("conversation_id", conversationId)
          .eq("user_id", partner.id)
          .maybeSingle(),
        supabase
          .from("direct_raven_blocks")
          .select("blocker_id,blocked_id")
          .or(
            `and(blocker_id.eq.${userId},blocked_id.eq.${partner.id}),and(blocker_id.eq.${partner.id},blocked_id.eq.${userId})`
          ),
      ]);

      if (!active) return;
      if (data) {
        if (!nearBottom.current && data.some((message) => !loadedMessages.current.some((old) => old.id === message.id))) {
          setNewMessages(true);
        }
        setMessages((current) => {
          const map = new Map(current.map((message) => [message.id, message]));
          (data as DirectRavenMessage[]).forEach((message) => map.set(message.id, message));
          return [...map.values()].sort(
            (a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)
          );
        });
      }
      setPartnerRead(reads?.last_read_at ?? "");
      if (blocks) {
        setBlockedByMe(blocks.some((block) => block.blocker_id === userId));
        setBlockedByThem(blocks.some((block) => block.blocker_id === partner.id));
      }
      void markRead();
    };

    scrollBottom();
    void sync();

    const channel = supabase
      .channel(`direct-raven:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_raven_messages", filter: `conversation_id=eq.${conversationId}` },
        () => void sync()
      )
      .subscribe();

    const timer = setInterval(() => void sync(), 10000);
    const visible = () => void sync();
    const read = () => {
      if (nearBottom.current) void markRead();
    };

    document.addEventListener("visibilitychange", visible);
    const element = listRef.current;
    element?.addEventListener("scrollend", read);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      element?.removeEventListener("scrollend", read);
      void supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, userId, partner.id]);

  function chooseFile(next: File | undefined) {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(next.type) || next.size > 8 * 1024 * 1024) {
      setError("Choose a JPEG, PNG, WebP or GIF up to 8 MB.");
      return;
    }
    setError("");
    setFile(next);
  }

  function addPortrait(id: string) {
    if (selectedPortraits.length >= MAX_PORTRAITS) {
      setError(`You can attach up to ${MAX_PORTRAITS} mini portraits to one raven.`);
      return;
    }
    setError("");
    setSelectedPortraits((current) => [...current, id]);
  }

  function beginEdit(message: DirectRavenMessage) {
    const parsed = parseRavenBody(message.body);
    setEditing(message.id);
    setBody(parsed.text);
    setSelectedPortraits(parsed.portraitIds);
    setReply(null);
    setFile(null);
    setPickerOpen(false);
    inputRef.current?.focus({ preventScroll: true });
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const encodedBody = encodeRavenBody(body, selectedPortraits);
    if ((!encodedBody && !file) || sendLock.current || closed) return;

    sendLock.current = true;
    setSending(true);
    setError("");
    let path: string | null = null;

    try {
      if (file && !editing) {
        const extension = {
          "image/jpeg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
          "image/gif": "gif",
        }[file.type];
        path = `${conversationId}/${userId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("raven-media")
          .upload(path, file, { contentType: file.type });
        if (uploadError) throw Error("The image could not be uploaded. Please try again.");
      }

      const query = editing
        ? supabase
            .from("direct_raven_messages")
            .update({ body: encodedBody })
            .eq("id", editing)
            .eq("sender_id", userId)
            .is("deleted_at", null)
        : supabase.from("direct_raven_messages").insert({
            conversation_id: conversationId,
            sender_id: userId,
            body: encodedBody,
            ...(path ? { attachment_path: path } : {}),
            ...(reply ? { reply_to: reply.id } : {}),
          });

      const { data, error: sendError } = await query.select("*").single();
      if (sendError || !data) throw Error("The raven could not be sent. Your draft is still here.");

      nearBottom.current = true;
      setMessages((current) =>
        current.some((message) => message.id === data.id)
          ? current.map((message) => (message.id === data.id ? data : message))
          : [...current, data]
      );
      setBody("");
      setFile(null);
      setReply(null);
      setEditing(null);
      resetDraftExtras();
      window.dispatchEvent(new Event("direct-raven-read"));
    } catch (caught) {
      if (path) await supabase.storage.from("raven-media").remove([path]);
      setError(caught instanceof Error ? caught.message : "Could not send. Please try again.");
    } finally {
      sendLock.current = false;
      setSending(false);
    }
  }

  async function withdraw(message: DirectRavenMessage) {
    const { data, error: withdrawError } = await supabase
      .from("direct_raven_messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", message.id)
      .eq("sender_id", userId)
      .select("*")
      .single();

    if (withdrawError || !data) {
      setError("Could not withdraw this raven.");
      return;
    }
    setMessages((current) => current.map((item) => (item.id === message.id ? data : item)));
    if (editing === message.id) {
      setEditing(null);
      setBody("");
      resetDraftExtras();
    }
  }

  async function toggleBlock() {
    const { error: blockError } = blockedByMe
      ? await supabase
          .from("direct_raven_blocks")
          .delete()
          .eq("blocker_id", userId)
          .eq("blocked_id", partner.id)
      : await supabase.from("direct_raven_blocks").insert({ blocker_id: userId, blocked_id: partner.id });

    if (blockError) setError("Could not update this raven path.");
    else {
      setBlockedByMe(!blockedByMe);
      setMenuOpen(false);
    }
  }

  async function older() {
    if (loadingOlder || !messages[0]) return;
    setLoadingOlder(true);
    const element = listRef.current;
    const before = element?.scrollHeight ?? 0;
    const { data, error: olderError } = await supabase
      .from("direct_raven_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .lt("created_at", messages[0].created_at)
      .order("created_at", { ascending: false })
      .limit(100);

    if (olderError) setError("Could not load older ravens.");
    else {
      nearBottom.current = false;
      setHasOlder(data.length === 100);
      setMessages((current) => [...(data as DirectRavenMessage[]).reverse(), ...current]);
      requestAnimationFrame(() => {
        if (element) element.scrollTop += element.scrollHeight - before;
      });
    }
    setLoadingOlder(false);
  }

  return (
    <section className={styles.thread} aria-label={`Conversation with ${partner.display_name}`}>
      <header className={styles.threadHeader}>
        <Link href="/messages" className={styles.backInbox} aria-label="Back to inbox">←</Link>
        <Link href={`/users/${partner.username}`} className={styles.partnerIdentity}>
          <span className={styles.avatar}>
            {partner.avatar_url ? <img src={partner.avatar_url} alt="" /> : partner.display_name.slice(0, 2).toUpperCase()}
          </span>
          <span>
            <b>{partner.display_name}</b>
            <small>@{partner.username}</small>
          </span>
        </Link>
        <div className={styles.threadMenuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.threadMenuButton}
            onClick={() => setMenuOpen((current) => !current)}
            aria-expanded={menuOpen}
            aria-label="Conversation options"
          >
            •••
          </button>
          {menuOpen && (
            <div className={styles.threadMenu}>
              <button type="button" onClick={() => void toggleBlock()}>
                {blockedByMe ? "Unblock user" : "Block user"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div
        className={styles.messages}
        ref={listRef}
        onScroll={(event) => {
          const element = event.currentTarget;
          nearBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
          if (nearBottom.current) setNewMessages(false);
        }}
      >
        {hasOlder && (
          <button className={styles.olderButton} disabled={loadingOlder} onClick={() => void older()}>
            {loadingOlder ? "Loading…" : "Load earlier ravens"}
          </button>
        )}

        {!messages.length && (
          <div className={styles.emptyThread}>
            <RavenIcon size={64} />
            <h2>A clear sky between two keeps.</h2>
            <p>Send the first raven to {partner.display_name}.</p>
          </div>
        )}

        {messages.map((message, index) => {
          const mine = message.sender_id === userId;
          const parent = messages.find((item) => item.id === message.reply_to);
          return (
            <div key={message.id}>
              {(index === 0 || day(message.created_at) !== day(messages[index - 1].created_at)) && (
                <div className={styles.dateDivider}>{day(message.created_at)}</div>
              )}
              <div id={`raven-${message.id}`} className={`${styles.messageRow} ${mine ? styles.mine : styles.theirs}`}>
                <div className={`${styles.messageBubble} ${message.deleted_at ? styles.deletedMessage : ""}`}>
                  {!message.deleted_at && message.reply_to && (
                    <div className={styles.replyQuote}>
                      {parent
                        ? parent.deleted_at
                          ? "Withdrawn raven"
                          : ravenBodySummary(parent.body || "") || (parent.attachment_path ? "Photo" : "Raven")
                        : "Reply to an earlier raven"}
                    </div>
                  )}
                  {!message.deleted_at && message.attachment_path && (
                    <RavenAttachment
                      path={message.attachment_path}
                      onLoad={() => {
                        if (nearBottom.current) scrollBottom();
                      }}
                    />
                  )}
                  {message.deleted_at ? <p>This raven was withdrawn.</p> : <RavenMessageContent body={message.body} />}
                  <span>
                    <time dateTime={message.created_at}>{time(message.created_at)}</time>
                    {message.edited_at && !message.deleted_at ? " · edited" : ""}
                    {mine && !message.deleted_at ? (partnerRead >= message.created_at ? " · Seen" : " · Sent") : ""}
                  </span>
                  {!message.deleted_at && (
                    <div className={styles.messageActions}>
                      <LikeButton kind="message" id={message.id} />
                      {!closed && (
                        <button
                          type="button"
                          onClick={() => {
                            setReply(message);
                            setEditing(null);
                            setSelectedPortraits([]);
                            inputRef.current?.focus({ preventScroll: true });
                          }}
                        >
                          Reply
                        </button>
                      )}
                      {parseRavenBody(message.body).text && (
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard
                              .writeText(parseRavenBody(message.body).text)
                              .catch(() => setError("Could not copy text."))
                          }
                        >
                          Copy
                        </button>
                      )}
                      {mine && (
                        <>
                          <button type="button" disabled={closed} onClick={() => beginEdit(message)}>Edit</button>
                          <button type="button" onClick={() => void withdraw(message)}>Withdraw</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.composerArea}>
        {newMessages && <button className={styles.olderButton} onClick={scrollBottom}>New ravens ↓</button>}
        {closed ? (
          <div className={styles.closedNotice}>
            {blockedByMe ? "You closed this raven path. Unblock this user to send again." : "This raven path is closed."}
          </div>
        ) : (
          <>
            {(reply || editing) && (
              <div className={styles.draftContext}>
                <span>{editing ? "Editing raven" : `Replying: ${reply ? ravenBodySummary(reply.body) : "Raven"}`}</span>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => {
                    setReply(null);
                    if (editing) setBody("");
                    setEditing(null);
                    resetDraftExtras();
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {preview && (
              <div className={styles.mediaPreview}>
                <img src={preview} alt="Attachment preview" />
                <button type="button" disabled={sending} onClick={() => setFile(null)}>Remove image</button>
              </div>
            )}

            {selectedPortraits.length > 0 && (
              <div className={styles.selectedPortraits} aria-label="Selected mini portraits">
                {selectedPortraits.map((id, index) => {
                  const character = portraitCharacters.find((item) => item.id === id);
                  return (
                    <button
                      type="button"
                      key={`${id}-${index}`}
                      className={styles.selectedPortrait}
                      title={`Remove ${character?.name ?? id}`}
                      onClick={() => setSelectedPortraits((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      <MiniPortrait id={id} alt={character?.name ?? id} size={42} />
                      <span>×</span>
                    </button>
                  );
                })}
              </div>
            )}

            {pickerOpen && (
              <div className={styles.reactionPicker} aria-label="Emoji and mini portraits">
                <div className={styles.pickerTabs} role="tablist" aria-label="Raven reactions">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={pickerTab === "emoji"}
                    className={pickerTab === "emoji" ? styles.pickerTabActive : ""}
                    onClick={() => setPickerTab("emoji")}
                  >
                    Emoji
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={pickerTab === "portraits"}
                    className={pickerTab === "portraits" ? styles.pickerTabActive : ""}
                    onClick={() => setPickerTab("portraits")}
                  >
                    Mini portraits
                  </button>
                </div>

                {pickerTab === "emoji" ? (
                  <div className={styles.emojiPicker} aria-label="Choose emoji">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        disabled={sending}
                        onClick={() => setBody((value) => (value + emoji).slice(0, 4000))}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.portraitPicker}>
                    <input
                      type="search"
                      value={portraitSearch}
                      onChange={(event) => setPortraitSearch(event.target.value)}
                      placeholder="Find a character…"
                      aria-label="Find a mini portrait"
                    />
                    <div className={styles.portraitGrid}>
                      {filteredPortraits.map((character) => (
                        <button
                          key={character.id}
                          type="button"
                          disabled={sending || selectedPortraits.length >= MAX_PORTRAITS}
                          onClick={() => addPortrait(character.id)}
                          title={character.name}
                          aria-label={`Add ${character.name} mini portrait`}
                        >
                          <MiniPortrait id={character.id} alt="" size={44} />
                          <span>{character.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <form className={styles.composer} onSubmit={send}>
              <textarea
                ref={inputRef}
                disabled={sending}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={4000}
                rows={2}
                placeholder="Write your raven…"
                aria-label="Message"
                onFocus={() => {
                  setPickerOpen(false);
                  window.setTimeout(() => {
                    if (nearBottom.current) scrollBottom();
                  }, 250);
                }}
                onPaste={(event) => {
                  if (!editing) {
                    const image = Array.from(event.clipboardData.files).find((candidate) => candidate.type.startsWith("image/"));
                    if (image) {
                      event.preventDefault();
                      chooseFile(image);
                    }
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || (!body.trim() && !file && selectedPortraits.length === 0)}
              >
                <RavenIcon size={18} /> {sending ? "Sending…" : editing ? "Save" : "Send"}
              </button>
            </form>

            <div className={styles.composerTools}>
              <label className={styles.fileButton} aria-disabled={!!editing || sending}>
                ＋ Photo / GIF
                <input
                  type="file"
                  disabled={!!editing || sending}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              <button type="button" disabled={sending} onClick={() => openPicker("emoji")} aria-expanded={pickerOpen}>
                ☺ Emoji
              </button>
              <button type="button" disabled={sending} onClick={() => openPicker("portraits")} aria-expanded={pickerOpen}>
                ◫ Portraits
              </button>
              <small>Shift + Enter for a new line</small>
            </div>
          </>
        )}
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </div>
    </section>
  );
}
