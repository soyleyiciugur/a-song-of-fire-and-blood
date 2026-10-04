"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";

import type { GreatGameOnlineMatchView } from "@/lib/the-great-game/online";
import {
  GREAT_GAME_EMOTES,
  GREAT_GAME_INNKEEPER_ACTION_EVENT,
  decodeGreatGameEmote,
  encodeGreatGameEmote,
  greatGameEmoteDefinition,
  type GreatGameEmoteId,
} from "@/lib/the-great-game/emotes";
import { createClient } from "@/lib/supabase/client";

import styles from "./InnkeeperEmotes.module.css";

type EmoteWireMessage = {
  id: string;
  match_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type Bubble = {
  id: string;
  emoteId: GreatGameEmoteId;
  text: string;
};

type Point = { x: number; y: number };

const FLOOD_WINDOW_MS = 8_000;
const FLOOD_MAX = 3;
const FLOOD_BLOCK_MS = 6_000;
const BUBBLE_LIFETIME_MS = 4_800;
const SALT_VIDEO_COOLDOWN_MS = 12_000;

const DESKTOP_POINTS: readonly Point[] = [
  { x: -88, y: -72 },
  { x: 0, y: -106 },
  { x: 88, y: -72 },
  { x: 111, y: 16 },
  { x: 61, y: 91 },
  { x: -61, y: 91 },
  { x: -111, y: 16 },
];

const COMPACT_POINTS: readonly Point[] = [
  { x: -77, y: -63 },
  { x: 0, y: -92 },
  { x: 77, y: -63 },
  { x: 97, y: 14 },
  { x: 54, y: 79 },
  { x: -54, y: 79 },
  { x: -97, y: 14 },
];

function viewerUserId(match: GreatGameOnlineMatchView | null) {
  if (!match) return "";
  return match.playerId === "player1" ? match.host.id : match.guest?.id ?? "";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function InnkeeperEmotes({
  match,
  buttonClassName,
  label,
}: {
  match: GreatGameOnlineMatchView | null;
  buttonClassName?: string;
  label: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const sentAtRef = useRef<number[]>([]);
  const lastSaltVideoAtRef = useRef(0);
  const bubbleTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [compact, setCompact] = useState(false);

  const viewerId = viewerUserId(match);
  const active = Boolean(match && match.status === "active" && match.opponent && viewerId);
  const blocked = blockedUntil > now;

  const refreshAnchor = useCallback(() => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) setAnchorRect(rect);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px), (max-height: 620px)");
    const sync = () => setCompact(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    refreshAnchor();
    const onMove = () => refreshAnchor();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, refreshAnchor]);

  useEffect(() => {
    if (!active) {
      setOpen(false);
      return;
    }
    refreshAnchor();
    const onMove = () => refreshAnchor();
    window.addEventListener("resize", onMove);
    return () => window.removeEventListener("resize", onMove);
  }, [active, refreshAnchor]);

  useEffect(() => {
    if (!blocked) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [blocked]);

  useEffect(() => {
    if (!match || match.status !== "active" || !viewerId) return;

    const channel = supabase
      .channel(`great-game-emotes:${match.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "great_game_chat_messages",
          filter: `match_id=eq.${match.id}`,
        },
        (payload) => {
          const message = payload.new as EmoteWireMessage;
          if (message.user_id === viewerId) return;
          const emoteId = decodeGreatGameEmote(message.body);
          if (!emoteId) return;

          refreshAnchor();
          const definition = greatGameEmoteDefinition(emoteId);
          const bubble: Bubble = {
            id: message.id,
            emoteId,
            text: definition.maraText,
          };

          setBubbles((current) => [...current, bubble].slice(-3));
          const timer = setTimeout(() => {
            bubbleTimersRef.current.delete(message.id);
            setBubbles((current) => current.filter((item) => item.id !== message.id));
          }, BUBBLE_LIFETIME_MS);
          bubbleTimersRef.current.set(message.id, timer);

          if (emoteId === "salt") {
            const currentTime = Date.now();
            if (currentTime - lastSaltVideoAtRef.current >= SALT_VIDEO_COOLDOWN_MS) {
              lastSaltVideoAtRef.current = currentTime;
              window.dispatchEvent(
                new CustomEvent(GREAT_GAME_INNKEEPER_ACTION_EVENT, {
                  detail: { clip: "salt" },
                })
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [match, refreshAnchor, supabase, viewerId]);

  useEffect(() => () => {
    bubbleTimersRef.current.forEach((timer) => clearTimeout(timer));
    bubbleTimersRef.current.clear();
  }, []);

  const sendEmote = useCallback(async (emoteId: GreatGameEmoteId) => {
    if (!match || !viewerId || !active || sending) return;

    const currentTime = Date.now();
    setNow(currentTime);
    if (blockedUntil > currentTime) return;

    const recent = sentAtRef.current.filter((time) => currentTime - time < FLOOD_WINDOW_MS);
    if (recent.length >= FLOOD_MAX) {
      sentAtRef.current = [];
      setBlockedUntil(currentTime + FLOOD_BLOCK_MS);
      setOpen(false);
      return;
    }

    setSending(true);
    setSendError(null);
    const { error } = await supabase.from("great_game_chat_messages").insert({
      match_id: match.id,
      user_id: viewerId,
      body: encodeGreatGameEmote(emoteId),
    });

    if (error) {
      setSendError("Mara couldn't carry that across the table.");
    } else {
      const nextRecent = [...recent, currentTime];
      sentAtRef.current = nextRecent;
      if (nextRecent.length >= FLOOD_MAX) {
        sentAtRef.current = [];
        setBlockedUntil(currentTime + FLOOD_BLOCK_MS);
      }
      setOpen(false);
    }
    setSending(false);
  }, [active, blockedUntil, match, sending, supabase, viewerId]);

  const wheelStyle = useMemo<CSSProperties | undefined>(() => {
    if (!anchorRect) return undefined;
    const size = compact ? 248 : 282;
    const left = clamp(anchorRect.left + anchorRect.width * .5 - size * .5, 8, Math.max(8, window.innerWidth - size - 8));
    const top = clamp(anchorRect.top - size * .68, 8, Math.max(8, window.innerHeight - size - 8));
    return { left, top };
  }, [anchorRect, compact]);

  const bubbleStyle = useMemo<CSSProperties | undefined>(() => {
    if (!anchorRect) return undefined;
    const left = clamp(anchorRect.left + Math.min(anchorRect.width * .58, 170), 8, Math.max(8, window.innerWidth - 286));
    const bottom = Math.max(12, window.innerHeight - anchorRect.top + 8);
    return { left, bottom };
  }, [anchorRect]);

  const points = compact ? COMPACT_POINTS : DESKTOP_POINTS;
  const remainingBlockSeconds = Math.max(0, Math.ceil((blockedUntil - now) / 1000));

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={buttonClassName}
        aria-label={active ? `${label} emotes` : `${label} — emotes are available in online matches`}
        aria-expanded={open}
        disabled={!active}
        onClick={() => {
          if (!active) return;
          refreshAnchor();
          setNow(Date.now());
          setOpen((current) => !current);
        }}
      />

      {typeof document !== "undefined" && createPortal(
        <div className={styles.layer} aria-live="polite">
          {open && anchorRect && wheelStyle && (
            <>
              <button
                type="button"
                className={styles.dismiss}
                aria-label="Close emote menu"
                onClick={() => setOpen(false)}
              />
              <div className={styles.wheel} style={wheelStyle} role="menu" aria-label={`${label} emotes`}>
              <div className={`${styles.center} ${blocked ? styles.centerBlocked : ""}`}>
                {blocked ? <>ENOUGH<br />{remainingBlockSeconds}s</> : "MARA"}
              </div>

              {GREAT_GAME_EMOTES.map((emote, index) => {
                const point = points[index];
                const optionStyle = {
                  "--emote-x": `${point.x}px`,
                  "--emote-y": `${point.y}px`,
                } as CSSProperties;
                return (
                  <button
                    key={emote.id}
                    type="button"
                    role="menuitem"
                    className={`${styles.option} ${emote.id === "salt" ? styles.optionSalt : ""}`}
                    style={optionStyle}
                    aria-label={emote.ariaLabel}
                    disabled={blocked || sending}
                    onClick={() => void sendEmote(emote.id)}
                  >
                    {emote.label}
                  </button>
                );
              })}

              {(sendError || blocked) && (
                <div className={styles.status}>
                  {sendError ?? `Emotes blocked for ${remainingBlockSeconds}s`}
                </div>
              )}
              </div>
            </>
          )}

          {bubbles.length > 0 && anchorRect && bubbleStyle && (
            <div className={styles.bubbles} style={bubbleStyle}>
              {bubbles.map((bubble) => (
                <div
                  key={bubble.id}
                  className={`${styles.bubble} ${bubble.emoteId === "salt" ? styles.bubbleSalt : ""}`}
                >
                  <strong>Mara</strong>
                  <span>{bubble.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}
