"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import styles from "./chronicleTimeline.module.css";

export default function ChronicleMarker({ position, href, label, children }: { position: number; href: string; label: string; children: ReactNode }) {
  const trigger = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const keep = () => { if (timer.current) clearTimeout(timer.current); };
  const show = () => { keep(); const rect = trigger.current?.getBoundingClientRect(); if (rect) setAnchor({ x: Math.max(130, Math.min(window.innerWidth - 130, rect.left + rect.width / 2)), y: rect.top }); };
  const hide = () => { keep(); timer.current = setTimeout(() => setAnchor(null), 120); };
  useEffect(() => {
    const close = () => setAnchor(null);
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("keydown", escape);
    return () => { keep(); window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); window.removeEventListener("keydown", escape); };
  }, []);
  return <div ref={trigger} className={styles.marker} style={{ left: `${position}%` }} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
    <Link href={href} className={styles.dot} aria-label={label} />
    {anchor && createPortal(<div className={styles.floatingTooltip} style={{ left: anchor.x, top: anchor.y - 12 }} onMouseEnter={keep} onMouseLeave={hide} onFocus={keep} onBlur={hide}>{children}</div>, document.body)}
  </div>;
}
