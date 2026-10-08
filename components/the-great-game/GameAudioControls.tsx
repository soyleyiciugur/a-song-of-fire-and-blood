"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./GameAudioControls.module.css";

type Props = {
  ambienceVolume: number;
  musicVolume: number;
  emoteVolume: number;
  onAmbienceChange: (value: number) => void;
  onMusicChange: (value: number) => void;
  onEmoteChange: (value: number) => void;
};

export default function GameAudioControls({ ambienceVolume, musicVolume, emoteVolume, onAmbienceChange, onMusicChange, onEmoteChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return (
    <div className={styles.root} ref={rootRef}>
      {open && (
        <div className={styles.panel} id="great-game-audio-settings">
          <div className={styles.heading}>Sound</div>
          <label className={styles.setting}>
            <span>Emote volume <output>{Math.round(emoteVolume * 100)}%</output></span>
            <input aria-label="Emote volume" type="range" min="0" max="100" value={Math.round(emoteVolume * 100)} onChange={(event) => onEmoteChange(Number(event.target.value) / 100)} style={{ "--fill": `${emoteVolume * 100}%` } as React.CSSProperties} />
          </label>
          <label className={styles.setting}>
            <span>Ambient volume <output>{Math.round(ambienceVolume * 100)}%</output></span>
            <input aria-label="Ambient volume" type="range" min="0" max="100" value={Math.round(ambienceVolume * 100)} onChange={(event) => onAmbienceChange(Number(event.target.value) / 100)} style={{ "--fill": `${ambienceVolume * 100}%` } as React.CSSProperties} />
          </label>
          <label className={styles.setting}>
            <span>Music volume <output>{Math.round(musicVolume * 100)}%</output></span>
            <input aria-label="Music volume" type="range" min="0" max="100" value={Math.round(musicVolume * 100)} onChange={(event) => onMusicChange(Number(event.target.value) / 100)} style={{ "--fill": `${musicVolume * 100}%` } as React.CSSProperties} />
          </label>
        </div>
      )}
      <button className={styles.trigger} type="button" aria-label="Sound settings" aria-expanded={open} aria-controls={open ? "great-game-audio-settings" : undefined} onClick={() => setOpen((value) => !value)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" />
          <path d="M16 9a4 4 0 0 1 0 6M18.5 6a8 8 0 0 1 0 12" />
        </svg>
      </button>
    </div>
  );
}
