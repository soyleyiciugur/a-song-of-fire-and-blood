"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./androidInstallPrompt.module.css";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

const DISMISS_KEY = "asofab:android-install-dismissed-at";
const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function AndroidInstallPrompt() {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAndroid() || isStandalone()) return;
    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_FOR_MS) return;
    } catch { /* Storage can be unavailable in private browsing. */ }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferred.current = event as BeforeInstallPromptEvent;
      timer = setTimeout(() => setVisible(true), 900);
    };
    const onInstalled = () => {
      deferred.current = null;
      setVisible(false);
      try { localStorage.removeItem(DISMISS_KEY); } catch {}
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  }

  async function install() {
    const event = deferred.current;
    if (!event) return;
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      deferred.current = null;
      if (choice.outcome === "accepted") {
        setVisible(false);
        try { localStorage.removeItem(DISMISS_KEY); } catch {}
      } else {
        dismiss();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!visible) return null;

  return (
    <aside className={styles.installCard} role="dialog" aria-label="Install ASOFAB on Android">
      <button className={styles.close} type="button" onClick={dismiss} aria-label="Dismiss install suggestion">×</button>
      <div className={styles.seal} aria-hidden="true">✦</div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>The Rookery · Android</span>
        <strong>Keep the realm close at hand</strong>
        <p>Set ASOFAB upon your Home Screen for a full-screen app, quicker return, and ravens that may find you while it is closed.</p>
      </div>
      <button className={styles.install} type="button" onClick={install} disabled={busy}>
        {busy ? "Preparing…" : "Install the Rookery"}
      </button>
    </aside>
  );
}
