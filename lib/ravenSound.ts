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
  if (kind === "message") {
    // Two short, filtered noise strokes suggest a nearby raven taking wing.
    // Keep the envelope low and dry so repeated chat activity never becomes
    // a theatrical sound effect or competes with media playback.
    const sampleRate = context.sampleRate;
    const buffer = context.createBuffer(1, Math.ceil(sampleRate * .18), sampleRate);
    const channel = buffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) {
      const position = index / channel.length;
      channel[index] = (Math.random() * 2 - 1) * Math.sin(Math.PI * position);
    }
    for (const delay of [0, .105]) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const start = now + delay;
      source.buffer = buffer;
      source.playbackRate.setValueAtTime(delay ? .82 : 1, start);
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(delay ? 520 : 680, start);
      filter.Q.setValueAtTime(.72, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(delay ? .012 : .016, start + .018);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .13);
      source.connect(filter).connect(gain).connect(context.destination);
      source.start(start);
      source.stop(start + .15);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
    }
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(392, now);
  oscillator.frequency.exponentialRampToValueAtTime(294, now + .28);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.017, now + .018);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .28);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + .3);
  oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
}
