"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GreatGameOnlinePlayer } from "@/lib/the-great-game/online";
import styles from "./player-portrait.module.css";
import type { PortraitFrames } from "./usePortraitFrames";

export default function PlayerPortrait({ player, label, frames }: { player?: GreatGameOnlinePlayer | null; label: string; frames?: PortraitFrames }) {
  const [position, setPosition] = useState<{ left: number; top: number; width: number } | null>(null);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const [failedHouse, setFailedHouse] = useState<string | null>(null);
  const [failedFrame, setFailedFrame] = useState<string | null>(null);
  const [failedHouseFrame, setFailedHouseFrame] = useState<string | null>(null);
  const profileFrame = frames?.profile !== failedFrame ? frames?.profile : undefined;
  const houseFrame = frames?.house !== failedHouseFrame ? frames?.house : undefined;
  const anchor = useRef<HTMLButtonElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);
  const [freshPlayer, setFreshPlayer] = useState<GreatGameOnlinePlayer | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const profileId = player?.id;
  const profile = freshPlayer?.id === profileId ? freshPlayer : player;
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!profileId) return;
      const response = await fetch(`/api/great-game?player=${encodeURIComponent(profileId)}`, { cache: "no-store", signal });
      if (!response.ok) throw new Error("Profile could not be loaded");
      const payload = await response.json();
      if (payload.player?.id !== profileId) throw new Error("Profile did not match");
      return payload.player as GreatGameOnlinePlayer;
  }, [profileId]);
  const receive = useCallback((updated?: GreatGameOnlinePlayer) => {
    if (!updated) return;
    setFreshPlayer(updated);
    setLoadFailed(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const failed = () => { if (!controller.signal.aborted) setLoadFailed(true); };
    void refresh(controller.signal).then(receive).catch(failed);
    const onFocus = () => { void refresh(controller.signal).then(receive).catch(failed); };
    window.addEventListener("focus", onFocus);
    return () => { controller.abort(); window.removeEventListener("focus", onFocus); };
  }, [refresh, receive]);
  const tooltipId = useId();
  const stats = profile?.gameStats;
  const house = profile?.favoriteHouse;
  const show = () => {
    const rect = anchor.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(236, window.innerWidth - 16);
    setPosition({ width, left: Math.max(8, Math.min(rect.right + 12, window.innerWidth - width - 8)), top: Math.max(8, Math.min(rect.top, window.innerHeight - 272)) });
  };
  useEffect(() => {
    const close = () => { setPinned(false); setPosition(null); };
    const outside = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node) && !details.current?.contains(event.target as Node)) close();
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const viewport = () => {
      if (!pinned) { setPosition(null); return; }
      const rect = anchor.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(236, window.innerWidth - 16);
      setPosition({ width, left: Math.max(8, Math.min(rect.right + 12, window.innerWidth - width - 8)), top: Math.max(8, Math.min(rect.top, window.innerHeight - 272)) });
    };
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", viewport);
    window.addEventListener("scroll", viewport, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("keydown", escape);
      window.removeEventListener("resize", viewport); window.removeEventListener("scroll", viewport, true);
    };
  }, [pinned]);

  return <>
    <button ref={anchor} type="button" className={styles.portrait} aria-label={`${label}: The Great Game statistics`} aria-describedby={position ? tooltipId : undefined} aria-expanded={pinned} aria-controls={position ? tooltipId : undefined}
      onPointerEnter={show} onPointerLeave={() => { if (!pinned) setPosition(null); }} onFocus={show} onBlur={() => { if (!pinned) setPosition(null); }}
      onClick={() => { show(); setPinned(true); void refresh().then(receive).catch(() => setLoadFailed(true)); }}>
      <span className={styles.visual} data-framed={Boolean(profileFrame)}>
      <span className={styles.photo}>
        {profile?.avatarUrl && failedImage !== profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" draggable={false} onError={() => setFailedImage(profile.avatarUrl)} />
        ) : <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="23" r="11" /><path d="M11 57c0-15 9-22 21-22s21 7 21 22" /></svg>}
      </span>
      {profileFrame && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.profileFrame} src={profileFrame} alt="" aria-hidden="true" draggable={false} onError={() => setFailedFrame(profileFrame)} />
      )}
      </span>
      {house && failedHouse !== house.image && <span className={styles.house}>
        <span className={styles.houseVisual} data-framed={Boolean(houseFrame)}>
        <span className={styles.houseImage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={house.image} alt={`Favorite house: ${house.name}`} draggable={false} onError={() => setFailedHouse(house.image)} />
        </span>
        {houseFrame && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.houseFrame} src={houseFrame} alt="" aria-hidden="true" draggable={false} onError={() => setFailedHouseFrame(houseFrame)} />
        )}
        </span>
      </span>}
    </button>
    {position && createPortal(<div ref={details} role={pinned ? "dialog" : "tooltip"} aria-label={pinned ? `${label}: The Great Game statistics` : undefined} id={tooltipId} className={styles.details} data-pinned={pinned} style={position}>
      <small>The Great Game</small><strong>{profile?.displayName || label}</strong>
      {house && <span className={styles.affinity}>{house.name}</span>}
      {stats ? <dl>
        <div><dt>Matches</dt><dd>{stats.games}</dd></div>
        <div><dt>Wins</dt><dd>{stats.wins}</dd></div>
        <div><dt>Losses</dt><dd>{stats.losses}</dd></div>
        <div><dt>Draws</dt><dd>{stats.draws}</dd></div>
        <div><dt>Win rate</dt><dd>{stats.games ? `${stats.winRate.toLocaleString("en-GB", { maximumFractionDigits: 1 })}%` : "—"}</dd></div>
        <div><dt>Win streak</dt><dd>{stats.streak}</dd></div>
      </dl> : <p>{player ? (!freshPlayer && !loadFailed ? "Loading statistics…" : "Statistics could not be loaded. Click the portrait to retry.") : "Local player · no linked profile."}</p>}
    </div>, document.body)}
  </>;
}
