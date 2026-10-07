"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import styles from "./play-hub.module.css";

export default function ParchmentDialog({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, []);
  return <section ref={ref} tabIndex={-1} role="region" className={`${styles.dialog} ${wide ? styles.wideDialog : ""}`} aria-labelledby={id} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); onClose(); } }}>
    <header className={styles.dialogHeader}><h2 id={id}>{title}</h2><button type="button" onClick={onClose} aria-label="Back">&larr; Back</button></header>
    <div className={styles.dialogBody}>{children}</div>
  </section>;
}

export function ParchmentNote({ children, speaker = "mara" }: { children: ReactNode; speaker?: "mara" | "aldren" }) {
  return <div className={styles.parchmentNote} role="status"><span className={styles.seal} aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M10 1c.8 5.2 3.8 8.2 9 9-5.2.8-8.2 3.8-9 9-.8-5.2-3.8-8.2-9-9 5.2-.8 8.2-3.8 9-9Z" fill="currentColor" /></svg></span><p>{children}</p><small>— {speaker === "mara" ? "Mara" : "Aldren"}</small></div>;
}
