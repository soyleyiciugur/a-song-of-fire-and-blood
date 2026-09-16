"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import RavenIcon from "./RavenIcon";
import styles from "./page-raven-share.module.css";

type ShareTarget = {
  id: string;
  kind: "raven" | "guild";
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  initials: string;
  updatedAt: string;
};

const HIDDEN_PREFIXES = ["/messages", "/login", "/signup", "/admin", "/settings", "/notifications"];

function CloseGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function SearchGlyph() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="m15 15 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function pageTitle() {
  if (typeof document === "undefined") return "A Song of Fire and Blood";
  const heading = document.querySelector<HTMLElement>("main h1")?.textContent?.replace(/\s+/g, " ").trim();
  if (heading) return heading;
  return document.title.replace(/\s*\|\s*A Song of Fire and Blood\s*$/i, "").trim() || "A Song of Fire and Blood";
}

function pageDescription() {
  if (typeof document === "undefined") return "";
  const main = document.querySelector("main");
  const heading = main?.querySelector("h1");
  const candidates = [
    heading?.parentElement?.querySelector("p")?.textContent,
    main?.querySelector("p")?.textContent,
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
  ];
  return candidates.find((value) => value?.trim())?.replace(/\s+/g, " ").trim().slice(0, 260) ?? "";
}

export default function PageRavenShare() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [targets, setTargets] = useState<ShareTarget[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [greatGameActive, setGreatGameActive] = useState(false);

  useEffect(() => {
    const sync = () => setGreatGameActive(document.documentElement.dataset.greatGameSessionActive === "1");
    sync();
    window.addEventListener("great-game-session-change", sync);
    return () => window.removeEventListener("great-game-session-change", sync);
  }, []);

  const hidden = HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) || pathname === "/ravens-eye/reels" || (pathname === "/cards/play" && greatGameActive);

  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = before; window.removeEventListener("keydown", onKey); };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetch("/api/direct-raven/share-page", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (response.status === 401) {
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
          setOpen(false);
          return;
        }
        if (!response.ok) throw new Error(payload.error || "Raven paths could not be loaded.");
        setTargets(Array.isArray(payload.targets) ? payload.targets : []);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus(error instanceof Error ? error.message : "Raven paths could not be loaded.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [open, pathname, router]);

  const visibleTargets = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? targets.filter((target) => `${target.title} ${target.subtitle}`.toLowerCase().includes(needle)) : targets;
  }, [query, targets]);

  if (hidden) return null;

  const openSheet = () => {
    setLoading(true);
    setStatus("");
    setOpen(true);
  };

  const toggleTarget = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);

  const send = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    setStatus("");
    try {
      const href = `${pathname}${window.location.search}${window.location.hash}`;
      const response = await fetch("/api/direct-raven/share-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageHref: href, pageTitle: pageTitle(), pageDescription: pageDescription(), conversationIds: selected, message }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The page could not be sent.");
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
      await Promise.allSettled(messages.map((item: { id: string }) => fetch("/api/notifications/direct-raven", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: item.id }),
      })));
      const count = messages.length || Number(payload.sent ?? 0);
      setStatus(count === 1 ? "Page sent by raven." : `Page sent down ${count} Raven paths.`);
      window.setTimeout(() => {
        setOpen(false); setSelected([]); setQuery(""); setMessage(""); setStatus("");
      }, 700);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The page could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return <>
    <button type="button" className={styles.floatingButton} onClick={openSheet} aria-label="Send this page by raven" title="Send by raven">
      <RavenIcon size={20} />
    </button>
    {open && <div className={styles.backdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <aside className={styles.sheet} role="dialog" aria-modal="true" aria-label="Send this page by raven">
        <header className={styles.header}>
          <div><span>Direct Raven</span><strong>Share this page</strong></div>
          <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close"><CloseGlyph /></button>
        </header>
        <div className={styles.preview}><span className={styles.previewIcon}><RavenIcon size={19} /></span><div><small>Page</small><strong>{pageTitle()}</strong><span>{pathname}</span></div></div>
        <label className={styles.message}><span>Add a message</span><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1200))} maxLength={1200} rows={2} placeholder="Add a few words to the raven…" /></label>
        <label className={styles.search}><SearchGlyph /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ravens and parleys" /></label>
        <div className={styles.targets}>
          {loading && <p className={styles.empty}>Calling the rookery…</p>}
          {!loading && !visibleTargets.length && !status && <p className={styles.empty}>No Raven paths found.</p>}
          {visibleTargets.map((target) => {
            const checked = selected.includes(target.id);
            return <button type="button" key={target.id} className={`${styles.target} ${checked ? styles.targetSelected : ""}`} onClick={() => toggleTarget(target.id)} aria-pressed={checked}>
              <span className={styles.avatar}>{target.avatarUrl ? <img src={target.avatarUrl} alt="" /> : target.initials}</span>
              <span className={styles.identity}><strong>{target.title}</strong><small>{target.subtitle}</small></span>
              <span className={styles.check} aria-hidden="true">{checked ? <svg viewBox="0 0 24 24"><path d="m6.5 12.5 3.3 3.3 7.7-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}</span>
            </button>;
          })}
        </div>
        {status && <p className={styles.status} role="status">{status}</p>}
        <footer className={styles.footer}><button type="button" disabled={!selected.length || sending} onClick={() => void send()}><RavenIcon size={16} />{sending ? "Sending…" : selected.length > 1 ? `Send to ${selected.length}` : "Send"}</button></footer>
      </aside>
    </div>}
  </>;
}
