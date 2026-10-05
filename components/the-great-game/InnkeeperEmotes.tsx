"use client";

import {
  Fragment,
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
  GREAT_GAME_INNKEEPER_ACTION_EVENT,
  decodeGreatGameEmote,
  encodeGreatGameEmote,
  greatGameEmoteDefinition,
  type GreatGameEmoteId,
} from "@/lib/the-great-game/emotes";
import { createClient } from "@/lib/supabase/client";

import EmoteIcon from "./EmoteIcon";

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
  emoteId?: GreatGameEmoteId;
  text: string;
  speaker?: string;
};

type FanStave = {
  id: GreatGameEmoteId;
  angle: number;
};

const FLOOD_WINDOW_MS = 8_000;
const FLOOD_MAX = 3;
const FLOOD_BLOCK_MS = 6_000;
const BUBBLE_LIFETIME_MS = 6_600;
const SALT_VIDEO_COOLDOWN_MS = 12_000;

// Positive emotes fan to the left, reactions / threat to the right, and WOW
// sits at the crown. Salt keeps its special place at the outer edge.
const FAN_STAVES: readonly FanStave[] = [
  { id: "greetings", angle: -102 },
  { id: "thanks", angle: -68 },
  { id: "well-played", angle: -34 },
  { id: "wow", angle: 0 },
  { id: "oops", angle: 34 },
  { id: "threaten", angle: 68 },
  { id: "salt", angle: 102 },
] as const;

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
  phase,
  supporter,
}: {
  match: GreatGameOnlineMatchView | null;
  buttonClassName?: string;
  label: string;
  phase: string;
  supporter: "mara" | "aldren";
}) {
  const supabase = useMemo(() => createClient(), []);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const sentAtRef = useRef<number[]>([]);
  const lastSaltVideoAtRef = useRef(0);
  const bubbleTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const previousPhaseRef = useRef(phase);
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

  const showBubble = useCallback((bubble: Bubble) => {
    setBubbles((current) => [...current, bubble].slice(-3));
    const timer = setTimeout(() => {
      bubbleTimersRef.current.delete(bubble.id);
      setBubbles((current) => current.filter((item) => item.id !== bubble.id));
    }, BUBBLE_LIFETIME_MS);
    bubbleTimersRef.current.set(bubble.id, timer);
  }, []);

  useEffect(() => {
    const previous = previousPhaseRef.current;
    previousPhaseRef.current = phase;
    if (phase !== "playing" || !previous.startsWith("mulligan-")) return;
    const text = supporter === "mara"
      ? "Welcome to The Cupbearer. Good luck. Try not to lose all your coin; the place has bills to pay."
      : "Welcome to The Cupbearer, my liege! May fortune favor your hand, and may your stay be most agreeable.";
    const timer = setTimeout(() => showBubble({ id: `welcome:${Date.now()}`, speaker: supporter === "mara" ? "Mara" : "Aldren", text }), 0);
    return () => clearTimeout(timer);
  }, [phase, supporter, showBubble]);

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

          showBubble(bubble);

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
  }, [match, refreshAnchor, showBubble, supabase, viewerId]);

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
      showBubble({ id: `sent:${Date.now()}`, emoteId, speaker: "Sent", text: `${greatGameEmoteDefinition(emoteId).label} reached your opponent.` });
      const nextRecent = [...recent, currentTime];
      sentAtRef.current = nextRecent;
      if (nextRecent.length >= FLOOD_MAX) {
        sentAtRef.current = [];
        setBlockedUntil(currentTime + FLOOD_BLOCK_MS);
      }
      setOpen(false);
    }
    setSending(false);
  }, [active, blockedUntil, match, sending, showBubble, supabase, viewerId]);

  const wheelStyle = useMemo<CSSProperties | undefined>(() => {
    if (!anchorRect) return undefined;
    const scale = Math.min(compact ? .65 : .8, (window.innerWidth - 16) / 460, (window.innerHeight - 16) / 300);
    const width = 460 * scale;
    const height = 300 * scale;
    const left = clamp(
      anchorRect.left + Math.min(anchorRect.width * .05, 14),
      8,
      Math.max(8, window.innerWidth - width - 8)
    );
    const top = clamp(
      anchorRect.top - height + (compact ? 60 : 74),
      8,
      Math.max(8, window.innerHeight - height - 8)
    );
    return { left, top, "--fan-scale": scale } as CSSProperties;
  }, [anchorRect, compact]);

  const bubbleStyle = useMemo<CSSProperties | undefined>(() => {
    if (!anchorRect) return undefined;
    const left = clamp(
      anchorRect.left + Math.min(anchorRect.width * .56, 166),
      8,
      Math.max(8, window.innerWidth - 304)
    );
    const bottom = Math.max(12, window.innerHeight - anchorRect.top + 6);
    return { left, bottom };
  }, [anchorRect]);

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

              <div className={styles.wheel} style={wheelStyle} role="group" aria-label={`${label} emotes`}>
                <div className={styles.fanShadow} aria-hidden="true" />

                {FAN_STAVES.map((stave, index) => {
                  const emote = greatGameEmoteDefinition(stave.id);
                  const optionStyle = {
                    "--stave-angle": `${stave.angle}deg`,
                    "--stave-art": `url("/images/cards/chat-wheel/wheel-${stave.id === "well-played" ? "wp" : stave.id}.webp")`,
                    "--stave-index": index,
                  } as CSSProperties;

                  return (
                    <Fragment key={stave.id}>
                    <button
                      type="button"
                      className={styles.option}
                      style={optionStyle}
                      aria-label={emote.ariaLabel}
                      disabled={blocked || sending}
                      onClick={() => void sendEmote(stave.id)}
                    >
                      <span className={styles.optionArt} aria-hidden="true" />
                    </button>
                    <span className={styles.tooltip} aria-hidden="true">{emote.ariaLabel}</span>
                    </Fragment>
                  );
                })}

                <div className={`${styles.center} ${blocked ? styles.centerBlocked : ""}`}>
                  {blocked ? (
                    <>
                      <span>{label === "Aldren" ? "A moment." : "Patience."}</span>
                      <small>{remainingBlockSeconds}s</small>
                    </>
                  ) : null}
                </div>

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
              {bubbles.map((bubble, index) => (
                <div
                  key={bubble.id}
                  className={`${styles.bubble} ${bubble.emoteId === "salt" ? styles.bubbleSalt : ""}`}
                  style={{ "--bubble-index": index } as CSSProperties}
                >
                  <div className={styles.bubbleHeader}>
                    <strong>{bubble.speaker ?? "Mara"}</strong>
                    {bubble.emoteId && <span className={styles.bubbleEmote} aria-hidden="true">
                      <EmoteIcon id={bubble.emoteId} />
                    </span>}
                  </div>
                  <div className={styles.bubbleText}>{bubble.emoteId === "salt" ? <span role="img" aria-label="Salt"><EmoteIcon id="salt" /></span> : bubble.text}</div>
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
