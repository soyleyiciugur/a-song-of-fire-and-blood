"use client";

import { useCallback, useEffect, useRef } from "react";

// A soft, dry bubble pop: no download, decoding, or new audio context per emote.
export function scheduleEmotePop(context: AudioContext, volume: number) {
  if (context.state !== "running" || volume <= 0) return;
  const start = context.currentTime;
  const tone = context.createOscillator();
  const gain = context.createGain();
  tone.type = "sine";
  tone.frequency.setValueAtTime(920, start);
  tone.frequency.exponentialRampToValueAtTime(300, start + 0.035);
  tone.frequency.exponentialRampToValueAtTime(160, start + 0.09);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, Math.min(1, volume) * 0.12), start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);
  tone.connect(gain).connect(context.destination);
  tone.onended = () => { tone.disconnect(); gain.disconnect(); };
  tone.start(start);
  tone.stop(start + 0.1);
}

export function useEmotePop(volume: number, enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(volume);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    if (!enabled) return;
    const unlock = () => {
      if (volumeRef.current <= 0) return;
      try {
        const context = contextRef.current ??= new AudioContext();
        if (context.state === "suspended") void context.resume().catch(() => {});
      } catch { /* Emotes still work when browser audio is unavailable. */ }
    };
    document.addEventListener("pointerdown", unlock, { passive: true });
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      const context = contextRef.current;
      contextRef.current = null;
      if (context && context.state !== "closed") void context.close().catch(() => {});
    };
  }, [enabled]);

  return useCallback(() => {
    const context = contextRef.current;
    if (context) scheduleEmotePop(context, volumeRef.current);
  }, []);
}
