"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./direct-raven.module.css";

export default function RavenAttachment({ path, onLoad }: { path: string; onLoad?: () => void }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    const sign = async () => {
      const { data, error } = await supabase.storage.from("raven-media").createSignedUrl(path, 3600);
      if (active) {
        setUrl(data?.signedUrl ?? "");
        setFailed(!!error);
      }
    };
    void sign();
    const timer = setInterval(() => void sign(), 45 * 60 * 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [path, supabase]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [lightboxOpen]);

  if (!url) return <small>{failed ? "Image unavailable." : "Loading image…"}</small>;

  return <>
    <button
      type="button"
      className={`${styles.attachment} ${styles.attachmentButton}`}
      onClick={() => setLightboxOpen(true)}
      aria-label="Open image"
    >
      <img src={url} alt="Shared image" onLoad={onLoad} />
    </button>
    {lightboxOpen && typeof document !== "undefined" && createPortal(
      <div
        className={styles.ravenImageLightbox}
        role="presentation"
        onPointerDown={() => setLightboxOpen(false)}
      >
        <div
          className={styles.ravenImageLightboxInner}
          role="dialog"
          aria-modal="true"
          aria-label="Shared image"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <img src={url} alt="Shared image" />
          <button type="button" className={styles.ravenImageLightboxClose} aria-label="Close image" onClick={() => setLightboxOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>,
      document.body,
    )}
  </>;
}
