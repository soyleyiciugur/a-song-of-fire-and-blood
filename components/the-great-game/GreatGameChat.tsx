"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import { decodeGreatGameEmote } from "@/lib/the-great-game/emotes";
import { createClient } from "@/lib/supabase/client";

import styles from "./great-game-chat.module.css";

type ChatMessage = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
  spectator?: boolean;
  sender?: {username:string;display_name:string;avatar_url:string|null};
};

type PlayerIdentity = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type GreatGameChatStatus = {
  activePlayerName: string;
  turnNumber: number;
  statusText: string;
  canAct: boolean;
  onExit: () => void;
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
        d="M7 17C5.5 13 8 7.5 12.5 5C15 3.6 18 3 21 3C20.5 6.2 19.2 9.4 17 12L14 12.5L15 14C12.5 16.5 9.5 17.5 7 17Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 21C7 16.5 11 12 16.5 7.5"
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

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={collapsed ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  status,
  embedded = false,
  spectatorViewer,
}: {
  match: GreatGameOnlineMatchView;
  status?: GreatGameChatStatus;
  embedded?: boolean;
  spectatorViewer?: import("@/lib/the-great-game/online").GreatGameOnlinePlayer;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const mobileOpenRef = useRef(false);
  const desktopCollapsedRef = useRef(false);
  const isCompactRef = useRef(false);
  const loadedRef = useRef(false);
  const seenMessageIds = useRef(new Set<string>());

  const viewer = match.playerId === "player1" ? match.host : match.guest;
  const opponent = match.opponent;
  const viewerId = spectatorViewer?.id ?? viewer?.id ?? "";

  const players = useMemo(() => {
    const result = new Map<string, PlayerIdentity>();
    result.set(match.host.id, match.host);
    if (match.guest) result.set(match.guest.id, match.guest);
    return result;
  }, [match.guest, match.host]);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;

  }, [mobileOpen]);

  useEffect(() => {
    desktopCollapsedRef.current = desktopCollapsed;

  }, [desktopCollapsed]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(max-width: 980px), (hover: none) and (max-height: 560px)");
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
    loadedRef.current = false;
    seenMessageIds.current.clear();

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let refreshing = false;
    async function refresh() {
      if (refreshing || cancelled) return;
      refreshing = true;
      clearTimeout(timer);
      try {
        const response = await fetch('/api/great-game/chat?match=' + encodeURIComponent(match.id), {signal:controller.signal,cache:'no-store'});
        const payload = await response.json();
        if (!response.ok) throw Error(payload.error || 'Table whispers could not be read.');
        if (cancelled) return;
        const incoming = payload.messages as ChatMessage[];
        if (loadedRef.current && ((isCompactRef.current && !mobileOpenRef.current) || (!isCompactRef.current && desktopCollapsedRef.current))) {
          const unreadCount = incoming.filter(message => message.user_id !== viewerId && !seenMessageIds.current.has(message.id)).length;
          if (unreadCount) setUnread(current => Math.min(99, current + unreadCount));
        }
        seenMessageIds.current = new Set(incoming.map(message => message.id));
        setMessages(incoming); setError(null); setLoading(false); loadedRef.current = true;
      } catch (e) { if (!cancelled) {setError(e instanceof Error ? e.message : 'Could not read chat.');setLoading(false);} }
      refreshing = false;
      if (!cancelled) timer = setTimeout(refresh, document.hidden ? 8000 : 2500);
    }
    void refresh();

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
          if (decodeGreatGameEmote(next.body)) return;
          // Realtime rows contain only IDs. Resolve gallery authors before rendering.
          if (next.user_id !== match.host.id && next.user_id !== match.guest?.id) {
            void refresh();
            return;
          }
          const alreadySeen = seenMessageIds.current.has(next.id);
          seenMessageIds.current.add(next.id);
          setMessages((current) => {
            if (current.some((item) => item.id === next.id)) return current;
            return [...current, next].slice(-100);
          });

          if (
            !alreadySeen && loadedRef.current &&
            next.user_id !== viewerId &&
            ((isCompactRef.current && !mobileOpenRef.current) ||
              (!isCompactRef.current && desktopCollapsedRef.current))
          ) {
            setUnread((current) => Math.min(99, current + 1));
          }
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      controller.abort(); clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [match.id, match.host.id, match.guest?.id, supabase, viewerId]);

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
    let data: ChatMessage | null = null;
    let sendError = false;
    try {
      const response = await fetch('/api/great-game/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({matchId:match.id,body:body.slice(0,MAX_CHAT_LENGTH)})});
      if (!response.ok) sendError = true;
      else data = await response.json();
    } catch {sendError = true;}

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
        className={`${styles.mobileToggle} ${embedded ? styles.mobileToggleEmbedded : ""}`}
        onClick={() => { if (!mobileOpen) setUnread(0); setMobileOpen(current => !current); }}
        aria-label={mobileOpen ? "Close match chat" : "Open match chat"}
        aria-expanded={mobileOpen}
        data-selection-ui="true"
      >
        <QuillIcon size={20} />
        {unread > 0 && <span className={styles.unread}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      <aside
        className={`${styles.panel} ${embedded ? styles.panelEmbedded : ""} ${mobileOpen ? styles.panelOpen : ""} ${desktopCollapsed ? styles.panelCollapsed : ""}`}
        aria-label="Online table chat"
        data-selection-ui="true"
      >
        <header className={styles.header}>
          {embedded ? (
            <span className={styles.headerIcon} aria-hidden="true">
              <QuillIcon size={17} />
            </span>
          ) : (
            <button
              type="button"
              className={styles.desktopCollapse}
              onClick={() => { if (desktopCollapsed) setUnread(0); setDesktopCollapsed(current => !current); }}
              aria-label={desktopCollapsed ? "Expand table chat" : "Collapse table chat"}
              aria-expanded={!desktopCollapsed}
            >
              <QuillIcon size={17} />
              <span className={styles.desktopCollapseChevron}><CollapseIcon collapsed={desktopCollapsed} /></span>
              {unread > 0 && desktopCollapsed && <span className={styles.desktopUnread}>{unread > 9 ? "9+" : unread}</span>}
            </button>
          )}

          <div className={styles.heading}>
            <span className={styles.tableCode}><i aria-hidden="true" />Table {match.code}</span>
            <strong>Table Whispers</strong>
            <small>{spectatorViewer ? "Spectator gallery" : `vs. ${opponent?.username ?? "Opponent"}`}</small>
          </div>

          {status && !embedded && (
              <div className={styles.headerGameMeta} aria-label="Online table status">
                <div className={styles.gameMetaTurn}>
                  <span>{status.activePlayerName}</span>
                  <strong>Turn {status.turnNumber}</strong>
                </div>
                <button type="button" className={styles.gameMetaExit} onClick={status.onExit}>Exit Game</button>
                <div className={`${styles.gameMetaState} ${status.canAct ? styles.gameMetaStateActive : ""}`}>{status.statusText}</div>
              </div>
          )}

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

          {messages.map((message, index) => {
            const own = message.user_id === viewerId;
            const sender = players.get(message.user_id);
            const username = sender?.displayName || sender?.username || message.sender?.display_name || message.sender?.username || "Spectator";
            const isSpectator = message.spectator ?? !players.has(message.user_id);
            const grouped = !isSpectator && index > 0 && messages[index - 1]?.user_id === message.user_id;

            return (
              <article
                key={message.id}
                className={[
                  styles.message,
                  own ? styles.messageOwn : styles.messageOther,
                  grouped ? styles.messageGrouped : "",
                ].filter(Boolean).join(" ")}
              >
                {!own && !grouped && (
                  <span className={styles.avatar} aria-hidden="true">
                    {sender?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sender.avatarUrl} alt="" />
                    ) : (
                      initials(sender?.displayName || username)
                    )}
                  </span>
                )}
                {!own && grouped && <span className={styles.avatarSpacer} aria-hidden="true" />}

                <div className={styles.messageBody}>
                  {!grouped && (
                    <span className={styles.meta}>
                      <strong>{own ? "You" : username}</strong>
                      {isSpectator && <span className={styles.spectatorTag}>Spectator</span>}
                      <time dateTime={message.created_at}>{messageTime(message.created_at)}</time>
                    </span>
                  )}
                  <p title={grouped ? messageTime(message.created_at) : undefined}>{message.body}</p>
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
