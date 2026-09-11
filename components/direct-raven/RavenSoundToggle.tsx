"use client";

import { useEffect, useState } from "react";
import { setSoundEnabled, soundEnabled } from "@/lib/ravenSound";
import styles from "./direct-raven.module.css";

export default function RavenSoundToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const sync = () => setEnabled(soundEnabled());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return <button type="button" className={styles.soundToggle} aria-pressed={enabled} aria-label={enabled ? "Mute notification sounds" : "Enable notification sounds"} title={enabled ? "Mute notification sounds" : "Enable notification sounds"} onClick={() => {
    setSoundEnabled(!enabled);
    setEnabled(!enabled);
  }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>{enabled ? <><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></> : <path d="m16 9 6 6m0-6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>}</svg></button>;
}
