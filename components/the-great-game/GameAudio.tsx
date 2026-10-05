"use client";

import { useEffect, useRef } from "react";

// Change these defaults (0 = silent, 1 = full volume) for first-time visitors.
export const DEFAULT_AMBIENCE_VOLUME = 0.15;
export const DEFAULT_MUSIC_VOLUME = 0.15;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function useGameMusic(activeGame: boolean, musicVolume: number) {
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const musicVolumeRef = useRef(musicVolume);

  useEffect(() => {
    musicVolumeRef.current = musicVolume;
    if (musicRef.current) musicRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (!activeGame) return;
    const music = new Audio();
    musicRef.current = music;
    music.volume = musicVolumeRef.current;
    let active = true;
    let tracks: string[] = [];
    let queue: string[] = [];
    let lastTrack = "";

    const play = () => {
      if (!active) return;
      if (music.src && music.paused) void music.play().catch(() => {});
    };

    const nextTrack = () => {
      if (!active || tracks.length === 0) return;
      if (queue.length === 0) {
        queue = shuffle(tracks);
        if (queue.length > 1 && queue[0] === lastTrack) {
          [queue[0], queue[1]] = [queue[1], queue[0]];
        }
      }
      const next = queue.shift()!;
      lastTrack = next;
      music.src = next;
      music.load();
      play();
    };

    music.addEventListener("ended", nextTrack);
    // A later gesture also recovers playback when the browser blocks autoplay.
    document.addEventListener("pointerdown", play);
    document.addEventListener("keydown", play);
    play();
    const controller = new AbortController();
    void fetch("/api/cards/audio", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load game music");
        return response.json() as Promise<{ tracks: string[] }>;
      })
      .then((data) => {
        if (!active) return;
        tracks = data.tracks;
        const first = tracks.find((track) => decodeURIComponent(track).endsWith("/the-cupbearer.mp3"));
        queue = shuffle(tracks.filter((track) => track !== first));
        if (first) queue.unshift(first);
        nextTrack();
      })
      .catch(() => {});

    return () => {
      active = false;
      controller.abort();
      music.removeEventListener("ended", nextTrack);
      document.removeEventListener("pointerdown", play);
      document.removeEventListener("keydown", play);
      music.pause();
      musicRef.current = null;
      music.src = "";
    };
  }, [activeGame]);
}
