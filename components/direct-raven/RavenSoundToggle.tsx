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
  return <button type="button" className={styles.soundToggle} aria-pressed={enabled} onClick={() => {
    setSoundEnabled(!enabled);
    setEnabled(!enabled);
  }}>Sounds {enabled ? "on" : "off"}</button>;
}
