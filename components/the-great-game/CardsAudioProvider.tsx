"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_AMBIENCE_VOLUME, DEFAULT_MUSIC_VOLUME, DEFAULT_EMOTE_VOLUME } from "./GameAudio";

type CardsAudioSettings = {
  ambienceVolume: number;
  musicVolume: number;
  emoteVolume: number;
  setAmbienceVolume: (value: number) => void;
  setMusicVolume: (value: number) => void;
  setEmoteVolume: (value: number) => void;
};

const CardsAudioContext = createContext<CardsAudioSettings | null>(null);

function storedVolume(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) return fallback;
    const value = Number(stored);
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : fallback;
  } catch {
    return fallback;
  }
}

export function CardsAudioProvider({ children }: { children: ReactNode }) {
  const ambienceRef = useRef<HTMLAudioElement>(null);
  const [ambienceVolume, updateAmbienceVolume] = useState(() => storedVolume("asofab:great-game:ambience-volume", DEFAULT_AMBIENCE_VOLUME));
  const [musicVolume, updateMusicVolume] = useState(() => storedVolume("asofab:great-game:music-volume", DEFAULT_MUSIC_VOLUME));
  const [emoteVolume, updateEmoteVolume] = useState(() => storedVolume("asofab:great-game:emote-volume", DEFAULT_EMOTE_VOLUME));

  useEffect(() => {
    const audio = ambienceRef.current;
    if (!audio) return;
    const play = () => { if (audio.paused) void audio.play().catch(() => {}); };
    play();
    // Recover autoplay after the first interaction anywhere within Cards.
    document.addEventListener("pointerdown", play);
    document.addEventListener("keydown", play);
    return () => {
      document.removeEventListener("pointerdown", play);
      document.removeEventListener("keydown", play);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (ambienceRef.current) ambienceRef.current.volume = ambienceVolume;
  }, [ambienceVolume]);

  const setAmbienceVolume = (value: number) => {
    updateAmbienceVolume(value);
    try { window.localStorage.setItem("asofab:great-game:ambience-volume", String(value)); } catch { /* Storage can be unavailable. */ }
  };
  const setMusicVolume = (value: number) => {
    updateMusicVolume(value);
    try { window.localStorage.setItem("asofab:great-game:music-volume", String(value)); } catch { /* Storage can be unavailable. */ }
  };

  const setEmoteVolume = (value: number) => {
    updateEmoteVolume(value);
    try { window.localStorage.setItem("asofab:great-game:emote-volume", String(value)); } catch { /* Storage can be unavailable. */ }
  };

  return (
    <CardsAudioContext.Provider value={{ ambienceVolume, musicVolume, emoteVolume, setAmbienceVolume, setMusicVolume, setEmoteVolume }}>
      <audio ref={ambienceRef} src="/images/cards/audio/ambience.mp3" loop preload="auto" aria-hidden="true" />
      {children}
    </CardsAudioContext.Provider>
  );
}

export function useCardsAudio(): CardsAudioSettings {
  const settings = useContext(CardsAudioContext);
  if (!settings) throw new Error("Cards audio settings require CardsAudioProvider");
  return settings;
}
