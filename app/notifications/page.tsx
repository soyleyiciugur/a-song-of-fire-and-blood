"use client";

import PageTitleIcon from "@/components/nav/PageTitleIcon";
import NotificationPortrait from "@/components/notifications/NotificationPortrait";
import NotificationSourceIcon from "@/components/notifications/NotificationSourceIcon";
import { MASCOT_META, type NotificationMascot, type NotificationSource, type SiteNotification } from "@/lib/notifications/types";
import { notificationSourceLabel } from "@/lib/notifications/source";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./notifications.module.css";

const PAGE_SIZE = 40;

function isMascot(value: unknown): value is NotificationMascot { return value === "mara" || value === "aldren"; }
function isSource(value: unknown): value is NotificationSource { return ["tavern", "ravens-eye", "direct-raven", "guild-parley", "chronicle", "realm"].includes(String(value)); }

function normalize(row: Record<string, unknown>): SiteNotification | null {
  if (!isMascot(row.mascot) || !isSource(row.source) || typeof row.id !== "string" || typeof row.user_id !== "string") return null;
  return {
    id: row.id,
    user_id: row.user_id,
    actor_id: typeof row.actor_id === "string" ? row.actor_id : null,
    kind: row.kind as SiteNotification["kind"],
    source: row.source,
    mascot: row.mascot,
    title: String(row.title ?? "Word from the realm"),
    body: String(row.body ?? "A raven has arrived."),
    href: typeof row.href === "string" && row.href.startsWith("/") ? row.href : "/notifications",
    source_label: typeof row.source_label === "string" ? row.source_label : null,
    context: row.context && typeof row.context === "object" ? row.context as Record<string, unknown> : {},
    created_at: String(row.created_at ?? new Date().toISOString()),
    read_at: typeof row.read_at === "string" ? row.read_at : null,
  };
}

function ageLabel(value: string, now = Date.now()) {
  const elapsed = Math.max(0, now - Date.parse(value));
  const minute = 60_000, hour = 60 * minute, day = 24 * hour;
  if (elapsed < minute) return `${Math.max(1, Math.floor(elapsed / 1000))}s`;
  if (elapsed < hour) return `${Math.floor(elapsed / minute)}m`;
  if (elapsed < day) return `${Math.floor(elapsed / hour)}h`;
  if (elapsed < 7 * day) return `${Math.floor(elapsed / day)}d`;
  const date = new Date(value), current = new Date(now);
  return date.getFullYear() === current.getFullYear() ? `${date.getDate()}/${date.getMonth() + 1}` : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function groupLabel(value: string, now = new Date()) {
  const date = new Date(value);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const delta = Math.round((today - target) / 86_400_000);
  if (delta === 0) return "Today";
  if (delta === 1) return "Yesterday";
  if (delta < 7) return "This week";
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: date.getFullYear() === now.getFullYear() ? undefined : "numeric" }).format(date);
}

function ctaLabel(source: NotificationSource) {
  if (source === "tavern") return "Enter the tavern";
  if (source === "ravens-eye") return "Follow the sighting";
  if (source === "direct-raven") return "Read the raven";
  if (source === "guild-parley") return "Enter the parley";
  if (source === "chronicle") return "Open the Chronicle";
  return "See the notice";
}

function Notifications() {
  const params = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [extra, setExtra] = useState<SiteNotification | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openId = params.get("open");

  const load = useCallback(async (id: string | null, requestedLimit = limit) => {
    setLoading(true);
    setError("");
    setExtra(null);
    if (!id) {
      setItems([]); setHasMore(false); setLoading(false); return;
    }
    const { data, error: readError } = await supabase.from("site_notifications").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(requestedLimit + 1);
    if (readError) {
      setError("The ravens could not be gathered. Please try again.");
      setLoading(false);
      return;
    }
    const normalized = (data ?? []).map((row) => normalize(row as unknown as Record<string, unknown>)).filter((row): row is SiteNotification => Boolean(row));
    setHasMore(normalized.length > requestedLimit);
    setItems(normalized.slice(0, requestedLimit));
    setLoading(false);

    // Visiting the personal notification ledger counts as reading the gathered ravens.
    const readAt = new Date().toISOString();
    const { error: markError } = await supabase.from("site_notifications").update({ read_at: readAt }).eq("user_id", id).is("read_at", null);
    if (!markError) {
      try { if ("clearAppBadge" in navigator) await navigator.clearAppBadge(); } catch { /* iOS may withhold badging until permission exists. */ }
      window.dispatchEvent(new CustomEvent("asofab:notifications-changed", { detail: { unread: 0 } }));
    }
  }, [limit, supabase]);

  useEffect(() => {
    let alive = true;
    const resolveUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      setUserId(user?.id ?? null);
      setAuthReady(true);
    };
    void resolveUser();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setUserId(session?.user.id ?? null);
      setAuthReady(true);
      setLimit(PAGE_SIZE);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!authReady) return;
    const timer = window.setTimeout(() => void load(userId, limit), 0);
    return () => window.clearTimeout(timer);
  }, [authReady, limit, load, userId]);

  useEffect(() => {
    if (!userId) return;
    const refresh = () => void load(userId, limit);
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    const channel = supabase.channel(`site-notifications-page:${userId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "site_notifications", filter: `user_id=eq.${userId}` }, refresh).subscribe();
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible); void supabase.removeChannel(channel); };
  }, [limit, load, supabase, userId]);

  useEffect(() => {
    if (!openId || !userId || items.some((item) => item.id === openId)) return;
    let active = true;
    void supabase.from("site_notifications").select("*").eq("user_id", userId).eq("id", openId).maybeSingle().then(({ data }) => {
      if (!active) return;
      setExtra(data ? normalize(data as unknown as Record<string, unknown>) : null);
    });
    return () => { active = false; };
  }, [items, openId, supabase, userId]);

  const activeNotification = openId ? items.find((item) => item.id === openId) ?? extra : null;

  useEffect(() => {
    if (!activeNotification) return;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeLightbox(); };
    window.addEventListener("keydown", onKey);
    const frame = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown", onKey); cancelAnimationFrame(frame); };
    // closeLightbox intentionally reads current URL state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNotification?.id]);

  useEffect(() => {
    if (params.get("tab") === "updates") router.replace("/update-notes");
  }, [params, router]);

  function setOpen(id: string) {
    const next = new URLSearchParams(params.toString());
    next.set("open", id);
    next.delete("tab");
    router.replace(`/notifications?${next.toString()}`, { scroll: false });
  }

  function closeLightbox() {
    const next = new URLSearchParams(params.toString());
    next.delete("open");
    next.delete("tab");
    const query = next.toString();
    router.replace(`/notifications${query ? `?${query}` : ""}`, { scroll: false });
  }

  const grouped = useMemo(() => {
    const groups = new Map<string, SiteNotification[]>();
    for (const item of items) {
      const label = groupLabel(item.created_at);
      groups.set(label, [...(groups.get(label) ?? []), item]);
    }
    return [...groups];
  }, [items]);

  return <main className={styles.page}>
    <div className={styles.topRow}>
      <Link href="/" className={styles.back}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        Back to Home
      </Link>
      {userId && <Link className={styles.settingsLink} href="/settings#raven-notifications"><span aria-hidden="true">⚙</span> Raven settings</Link>}
    </div>

    <header className={styles.hero}>
      <span className={styles.heroEyebrow}>The innkeepers have kept your ravens</span>
      <h1 className="realm-page-title">Notifications<PageTitleIcon name="notifications" /></h1>
      <p>Words meant for you, tidings from the Gutter, and other matters the realm has decided you ought to hear about.</p>
    </header>

    {!authReady || loading && userId ? <div className={styles.loadingLedger}><span aria-hidden="true">✦</span><p>Gathering the ravens…</p></div> : null}

    {authReady && !userId && <section className={styles.signedOut}>
      <span className={styles.signedOutSigil} aria-hidden="true">✦</span>
      <h2>No name upon the ledger</h2>
      <p>Sign in to keep unread state, notification history, and your Mara/Aldren delivery pattern tied to your account across every device.</p>
      <div><Link href="/login">Sign in</Link><Link href="/register">Join the realm</Link></div>
    </section>}

    {error && userId && <p className={styles.error} role="status">{error} <button type="button" onClick={() => void load(userId, limit)}>Try again</button></p>}

    {userId && !loading && !error && !items.length && <section className={styles.empty}>
      <span aria-hidden="true">✦</span><h2>The rookery is quiet</h2><p>No tidings await you. For once, the realm appears capable of carrying on without your attention.</p>
    </section>}

    {userId && grouped.map(([label, notifications]) => <section className={styles.timeGroup} key={label} aria-label={label}>
      <h2 className={styles.timeHeading}>{label}</h2>
      <ol className={styles.feed}>
        {notifications.map((item) => <li key={item.id}>
          <button type="button" className={`${styles.card} ${!item.read_at ? styles.unreadCard : ""}`} onClick={() => setOpen(item.id)}>
            <NotificationPortrait mascot={item.mascot} source={item.source} size={52} />
            <span className={styles.cardContent}>
              <span className={styles.cardTopline}>
                <span className={styles.source}><NotificationSourceIcon source={item.source} size={12} /><b>{notificationSourceLabel(item.source)}</b>{item.source_label && <em>· {item.source_label}</em>}</span>
                <time dateTime={item.created_at}>{ageLabel(item.created_at)}</time>
              </span>
              <strong className={styles.cardTitle}>{item.title}</strong>
              <span className={styles.cardBody}>{item.body}</span>
              <span className={styles.deliveredBy}>— {MASCOT_META[item.mascot].name}</span>
            </span>
            {!item.read_at && <span className={styles.unreadDot} aria-label="Unread" />}
            <svg className={styles.openArrow} width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5l7 7-7 7" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </li>)}
      </ol>
    </section>)}

    {userId && hasMore && <button className={styles.more} type="button" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Gather older ravens</button>}

    {activeNotification && <div className={styles.lightboxBackdrop} role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) closeLightbox(); }}>
      <section className={styles.lightbox} role="dialog" aria-modal="true" aria-labelledby="notification-lightbox-title">
        <button ref={closeRef} className={styles.closeButton} type="button" aria-label="Close notification" onClick={closeLightbox}>×</button>
        <div className={styles.lightboxOrnament} aria-hidden="true"><span>✦</span></div>
        <NotificationPortrait mascot={activeNotification.mascot} source={activeNotification.source} size={92} className={styles.lightboxPortrait} />
        <span className={styles.lightboxSource}><NotificationSourceIcon source={activeNotification.source} size={13} /> {notificationSourceLabel(activeNotification.source)}</span>
        <h2 id="notification-lightbox-title">{activeNotification.title}</h2>
        <p className={styles.lightboxBody}>{activeNotification.body}</p>
        <p className={styles.lightboxSignature}>— {MASCOT_META[activeNotification.mascot].name}</p>
        {activeNotification.source_label && <p className={styles.lightboxContext}>{activeNotification.source_label}</p>}
        <time className={styles.lightboxTime} dateTime={activeNotification.created_at}>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(activeNotification.created_at))}</time>
        <div className={styles.lightboxActions}>
          {activeNotification.href !== "/notifications" && <Link className={styles.primaryAction} href={activeNotification.href}>{ctaLabel(activeNotification.source)} <span aria-hidden="true">→</span></Link>}
          <button type="button" className={styles.dismissAction} onClick={closeLightbox}>Return to the rookery</button>
        </div>
      </section>
    </div>}
  </main>;
}

export default function NotificationsPage() {
  return <Suspense fallback={<main className={styles.page}><div className={styles.loadingLedger}><span aria-hidden="true">✦</span><p>Gathering the ravens…</p></div></main>}><Notifications /></Suspense>;
}
