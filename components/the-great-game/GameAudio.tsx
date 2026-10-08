"use client";

import { useEffect, useRef } from "react";

// Change these defaults (0 = silent, 1 = full volume) for first-time visitors.
export const DEFAULT_AMBIENCE_VOLUME = 0.15;
export const DEFAULT_MUSIC_VOLUME = 0.15;
export const DEFAULT_EMOTE_VOLUME = 0.15;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function trackGroup(track: string): string {
  return decodeURIComponent(track).replace(/-\d+(?=\.mp3$)/i, "");
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
    let groups = new Map<string, string[]>();
    let variantIndex = new Map<string, number>();
    let queue: string[] = [];
    let lastGroup = "";
    let firstRound = true;

    const play = () => {
      if (!active) return;
      if (music.src && music.paused) void music.play().catch(() => {});
    };

    const nextTrack = () => {
      if (!active || groups.size === 0) return;
      if (queue.length === 0) {
        queue = shuffle([...groups.keys()]);
        const cupbearer = [...groups.keys()].find((group) => group.endsWith("/the-cupbearer.mp3"));
        if (firstRound && cupbearer) {
          queue = [cupbearer, ...queue.filter((group) => group !== cupbearer)];
        } else if (queue.length > 1 && queue[0] === lastGroup) {
          [queue[0], queue[1]] = [queue[1], queue[0]];
        }
        firstRound = false;
      }
      const group = queue.shift()!;
      const variants = groups.get(group)!;
      const index = variantIndex.get(group) ?? 0;
      variantIndex.set(group, (index + 1) % variants.length);
      lastGroup = group;
      music.src = variants[index];
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
        groups = new Map();
        for (const track of data.tracks) {
          const group = trackGroup(track);
          groups.set(group, [...(groups.get(group) ?? []), track]);
        }
        for (const [group, variants] of groups) {
          groups.set(group, shuffle(variants));
        }
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
