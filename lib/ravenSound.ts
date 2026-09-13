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
  if (!soundEnabled() || !context || context.state !== "running" || Date.now() - lastPlayed < 4000) return;
  lastPlayed = Date.now();
  const now = context.currentTime;
  const notes=kind==="message"?[[659,.00,.16],[880,.13,.23]]:[[392,.00,.28]];
  for(const [frequency,delay,duration] of notes){const oscillator=context.createOscillator(),gain=context.createGain(),start=now+delay;oscillator.type=kind==="message"?"sine":"triangle";oscillator.frequency.setValueAtTime(frequency,start);if(kind==="notification")oscillator.frequency.exponentialRampToValueAtTime(294,start+duration);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(kind==="message"?.022:.017,start+.018);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain).connect(context.destination);oscillator.start(start);oscillator.stop(start+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};}
}
