"use client";

const key = "asofab:raven-sound";
let context: AudioContext | undefined;
let lastPlayed = 0;

export function soundEnabled() {
  try { return localStorage.getItem(key) === "on"; } catch { return false; }
}

export function setSoundEnabled(enabled: boolean) {
  try { localStorage.setItem(key, enabled ? "on" : "off"); } catch { /* Session-only UI remains usable. */ }
  if (enabled) unlockSound();
}

export function unlockSound() {
  if (!soundEnabled()) return;
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch { /* Audio is optional. */ }
}

export function playRavenSound(kind: "message" | "notification" = "message") {
  if (!soundEnabled() || !context || context.state !== "running" || document.visibilityState !== "visible" || Date.now() - lastPlayed < 4000) return;
  lastPlayed = Date.now();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(kind === "message" ? 660 : 520, now);
  oscillator.frequency.exponentialRampToValueAtTime(kind === "message" ? 880 : 660, now + .16);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(.025, now + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .28);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + .3);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
