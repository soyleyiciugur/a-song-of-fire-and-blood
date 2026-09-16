"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import { createClient } from "@/lib/supabase/client";

import styles from "./great-game-chat.module.css";

type ChatMessage = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type PlayerIdentity = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

const MAX_CHAT_LENGTH = 500;

function QuillIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M19.5 3.8c-4.9.5-9.1 3.2-11.7 7.4-1.8 2.9-2.5 5.6-2.7 8.8 2.3-1.9 4.1-3.7 5.7-5.6m-3 1.1c2.6.1 4.8-.4 6.6-1.7 3.1-2.2 4.7-5.4 5.1-10Z"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 20.2c2.7-3.1 5.7-6 9-8.8"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m7 7 10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m4.4 5.1 15.3 6.7-15.3 7.1 2.2-6.4 7-.7-7-.7-2.2-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function messageTime(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

export default function GreatGameChat({
  match,
}: {
  match: GreatGameOnlineMatchView;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const mobileOpenRef = useRef(false);
  const isCompactRef = useRef(false);
  const loadedRef = useRef(false);

  const viewer = match.playerId === "player1" ? match.host : match.guest;
  const opponent = match.opponent;
  const viewerId = viewer?.id ?? "";

  const players = useMemo(() => {
    const result = new Map<string, PlayerIdentity>();
    result.set(match.host.id, match.host);
    if (match.guest) result.set(match.guest.id, match.guest);
    return result;
  }, [match.guest, match.host]);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
    if (mobileOpen) setUnread(0);
  }, [mobileOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 980px)");
    const sync = () => {
      isCompactRef.current = query.matches;
      setIsCompact(query.matches);
      if (!query.matches) setUnread(0);
    };
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadedRef.current = false;

    void supabase
      .from("great_game_chat_messages")
      .select("id,match_id,user_id,body,created_at")
      .eq("match_id", match.id)
      .order("created_at", { ascending: false })
      .limit(80)
      .then(({ data, error: loadError }) => {
        if (cancelled) return;
        if (loadError) {
          setError("Table whispers could not be read.");
          setMessages([]);
        } else {
          setMessages([...(data ?? [])].reverse() as ChatMessage[]);
        }
        setLoading(false);
        loadedRef.current = true;
      });

    const channel = supabase
      .channel(`great-game-chat:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "great_game_chat_messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          const next = payload.new as ChatMessage;
          setMessages((current) => {
            if (current.some((item) => item.id === next.id)) return current;
            return [...current, next].slice(-100);
          });

          if (
            loadedRef.current &&
            next.user_id !== viewerId &&
            isCompactRef.current &&
            !mobileOpenRef.current
          ) {
            setUnread((current) => Math.min(99, current + 1));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [match.id, supabase, viewerId]);

  useEffect(() => {
    if (loading) return;
    if (isCompact && !mobileOpen) return;
    const behavior = loadedRef.current ? "smooth" : "auto";
    endRef.current?.scrollIntoView({ block: "end", behavior });
  }, [isCompact, loading, messages, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen || !isCompact) return;
    const id = window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(id);
  }, [isCompact, mobileOpen]);

  async function sendMessage() {
    const body = draft.trim();
    if (!body || sending || !viewerId) return;

    setSending(true);
    setError(null);
    const { data, error: sendError } = await supabase
      .from("great_game_chat_messages")
      .insert({
        match_id: match.id,
        user_id: viewerId,
        body: body.slice(0, MAX_CHAT_LENGTH),
      })
      .select("id,match_id,user_id,body,created_at")
      .single();

    if (sendError) {
      setError("That whisper did not cross the table.");
    } else if (data) {
      const message = data as ChatMessage;
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message].slice(-100)
      );
      setDraft("");
    }
    setSending(false);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        onClick={() => setMobileOpen((current) => !current)}
        aria-label={mobileOpen ? "Close match chat" : "Open match chat"}
        aria-expanded={mobileOpen}
        data-selection-ui="true"
      >
        <QuillIcon size={20} />
        {unread > 0 && <span className={styles.unread}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      <aside
        className={`${styles.panel} ${mobileOpen ? styles.panelOpen : ""}`}
        aria-label="Online table chat"
        data-selection-ui="true"
      >
        <header className={styles.header}>
          <span className={styles.headerIcon}><QuillIcon size={17} /></span>
          <div className={styles.heading}>
            <span>Online Table</span>
            <strong>Table Whispers</strong>
            <small>{opponent?.username ? `with @${opponent.username}` : match.code}</small>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => setMobileOpen(false)}
            aria-label="Close match chat"
          >
            <CloseIcon />
          </button>
        </header>

        <div ref={listRef} className={styles.messages} aria-live="polite">
          {loading && <p className={styles.empty}>Listening at the table…</p>}
          {!loading && messages.length === 0 && !error && (
            <p className={styles.empty}>No words have crossed the table yet.</p>
          )}

          {messages.map((message) => {
            const own = message.user_id === viewerId;
            const sender = players.get(message.user_id);
            const username = sender?.username ?? "player";
            return (
              <article
                key={message.id}
                className={`${styles.message} ${own ? styles.messageOwn : styles.messageOther}`}
              >
                {!own && (
                  <span className={styles.avatar} aria-hidden="true">
                    {sender?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sender.avatarUrl} alt="" />
                    ) : (
                      initials(sender?.displayName || username)
                    )}
                  </span>
                )}
                <div className={styles.messageBody}>
                  <span className={styles.meta}>
                    <strong>{own ? "You" : `@${username}`}</strong>
                    <time dateTime={message.created_at}>{messageTime(message.created_at)}</time>
                  </span>
                  <p>{message.body}</p>
                </div>
              </article>
            );
          })}
          <div ref={endRef} />
        </div>

        {error && <p className={styles.error} role="status">{error}</p>}

        <footer className={styles.composer}>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHAT_LENGTH))}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_CHAT_LENGTH}
            placeholder="Whisper across the table…"
            aria-label="Match chat message"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={!draft.trim() || sending}
            aria-label="Send match chat message"
          >
            <SendIcon />
          </button>
        </footer>
      </aside>
    </>
  );
}
