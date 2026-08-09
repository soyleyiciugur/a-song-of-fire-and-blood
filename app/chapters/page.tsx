// ─── C:\Users\Locpick-13\a-song-of-fire-and-blood\app\chapters\page.tsx ───
//
// Requires: app/chapters/chapters-hub.module.css
//
// Language support: reads/writes localStorage key "asofiab-lang" ("en"|"tr").
// Chapter data: pulls from data/chapters.json via getAllChapters().
// TR fields used: chapter.titleTr, chapter.synopsisTr (optional; falls back to EN).
//
// This revision replaces the split left/right ToC pages with the open
// book showing exactly two real pages:
//   left  = inside cover (title + short description — unchanged)
//   right = one full, scrollable table of contents
// Hovering a chapter title in the ToC opens a floating "bubble" to the
// right of the page showing that chapter's synopsis. The bubble's
// vertical position is computed from the hovered row's actual position
// (via getBoundingClientRect) relative to the page, so it always lines
// up with the row you're hovering even while the list is scrolled.
"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAllChapters } from "@/data/chapters";
import styles from "./chapters-hub.module.css";

// ─── types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "tr";
type Phase = "cover" | "opening" | "toc" | "closing";

type Chapter = {
  slug: string;
  title: string;
  synopsis: string;
  image: string;
  content: string[];
  titleTr?: string;
  synopsisTr?: string;
};

type BubbleState = {
  slug: string;
  title: string;
  synopsis: string;
  top: number; // px, relative to the ToC page container
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function chapterTitle(ch: Chapter, lang: Lang) {
  return lang === "tr" && ch.titleTr ? ch.titleTr : ch.title;
}

function chapterSynopsis(ch: Chapter, lang: Lang) {
  return lang === "tr" && ch.synopsisTr ? ch.synopsisTr : ch.synopsis;
}

// ─── component ────────────────────────────────────────────────────────────────

function ChaptersHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chapters = getAllChapters() as Chapter[];

  // ── state
  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>(
    searchParams.get("openToc") === "1" ? "toc" : "cover"
  );
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [bubble, setBubble] = useState<BubbleState | null>(null);

  // bookmark
  const [bookmark, setBookmark] = useState<{ slug: string; page: number } | null>(null);

  const bookRef = useRef<HTMLDivElement>(null);
  const tocPageRef = useRef<HTMLDivElement>(null);

  // ── init: read persisted lang & bookmark
  useEffect(() => {
    try {
      const saved = localStorage.getItem("asofiab-lang") as Lang | null;
      if (saved === "en" || saved === "tr") setLang(saved);
      const bm = localStorage.getItem("asofiab-bookmark");
      if (bm) setBookmark(JSON.parse(bm));
    } catch {}
  }, []);

  const selectLang = useCallback((next: Lang) => {
    setLang(next);
    try { localStorage.setItem("asofiab-lang", next); } catch {}
  }, []);

  const openBook = useCallback(() => {
    if (phase !== "cover") return;
    setPhase("opening");
    setTimeout(() => setPhase("toc"), 900);
  }, [phase]);

  const closeBook = useCallback(() => {
    if (phase !== "toc") return;
    setBubble(null);
    setPhase("closing");
    setTimeout(() => setPhase("cover"), 700);
  }, [phase]);

  const goToChapter = useCallback((slug: string) => {
    setBubble(null);
    setPendingSlug(slug);
    setPhase("closing");
    setTimeout(() => {
      try { localStorage.setItem("asofiab-lang", lang); } catch {}
      router.push(`/chapters/${slug}?lang=${lang}`);
    }, 700);
  }, [router, lang]);

  const continueReading = useCallback(() => {
    if (!bookmark) return;
    router.push(`/chapters/${bookmark.slug}?lang=${lang}&page=${bookmark.page}`);
  }, [bookmark, lang, router]);

  const handleSceneClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) closeBook();
  }, [closeBook]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase === "toc") closeBook();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, closeBook]);

  // ── hover bubble: compute the hovered row's vertical position
  // relative to the page container, so the bubble lines up with it
  // regardless of scroll position.
  const showBubble = useCallback((ch: Chapter, rowEl: HTMLElement) => {
    const pageEl = tocPageRef.current;
    if (!pageEl) return;
    const rowRect = rowEl.getBoundingClientRect();
    const pageRect = pageEl.getBoundingClientRect();
    const top = rowRect.top - pageRect.top + rowRect.height / 2;
    setBubble({
      slug: ch.slug,
      title: chapterTitle(ch, lang),
      synopsis: chapterSynopsis(ch, lang),
      top,
    });
  }, [lang]);

  const hideBubble = useCallback(() => setBubble(null), []);

  // clear the bubble if the list is scrolled so it doesn't hang in a
  // stale position
  const handleListScroll = useCallback(() => setBubble(null), []);

  const bookmarkChapter = bookmark ? chapters.find(c => c.slug === bookmark.slug) : null;
  const coverOpen = phase !== "cover";

  return (
    <div
      className={[styles.scene, phase === "toc" ? styles.sceneClosable : ""].filter(Boolean).join(" ")}
      onClick={handleSceneClick}
    >
      {/* ── ambient particles ── */}
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={styles.particle} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>

      {/* ── language toggle ── */}
      <div className={styles.langToggle}>
        <button
          className={[styles.langBtn, lang === "en" ? styles.langBtnActive : ""].filter(Boolean).join(" ")}
          onClick={() => selectLang("en")}
          aria-pressed={lang === "en"}
        >
          EN
        </button>
        <button
          className={[styles.langBtn, lang === "tr" ? styles.langBtnActive : ""].filter(Boolean).join(" ")}
          onClick={() => selectLang("tr")}
          aria-pressed={lang === "tr"}
        >
          TR
        </button>
      </div>

      {/* ── continue reading banner ── */}
      {bookmark && bookmarkChapter && phase === "cover" && (
        <div className={styles.continueBanner}>
          <span className={styles.continueLabel}>
            {lang === "en" ? "Continue reading" : "Okumaya devam et"}
          </span>
          <button className={styles.continueBtn} onClick={continueReading}>
            {chapterTitle(bookmarkChapter, lang)}
            <span className={styles.continueArrow}>→</span>
          </button>
        </div>
      )}

      {/* ════════════════ THE BOOK ════════════════ */}
      <div
        ref={bookRef}
        className={[
          styles.bookWrap,
          phase === "opening" ? styles.bookOpening : "",
          phase === "toc" ? styles.bookOpen : "",
          phase === "closing" ? styles.bookClosing : "",
        ].filter(Boolean).join(" ")}
        onClick={(e) => {
          if (phase === "cover") {
            openBook();
          } else {
            e.stopPropagation();
          }
        }}
        role={phase === "cover" ? "button" : undefined}
        aria-label={phase === "cover" ? (lang === "en" ? "Open the book" : "Kitabı aç") : undefined}
        tabIndex={phase === "cover" ? 0 : undefined}
        onKeyDown={phase === "cover" ? (e) => e.key === "Enter" && openBook() : undefined}
      >
        {/* ── spine ── */}
        <div className={styles.spine}>
          <span className={styles.spineText}>A Song of Fire and Blood</span>
          <span className={styles.spineOrnament}>✦ ✦ ✦</span>
        </div>

        {/* ── COVER CARD: front cover + inside-left page ── */}
        <div
          className={[styles.coverCard, coverOpen ? styles.coverCardFlipped : ""].filter(Boolean).join(" ")}
        >
          {/* ── FRONT FACE ── */}
          <div className={styles.cover}>
            <div className={styles.coverBorder} />
            <div className={styles.coverInner}>
              <div className={styles.coverEyebrow}>
                {lang === "en" ? "The Chronicles" : "Vakayiname"}
              </div>
              <h1 className={styles.coverTitle}>
                A Song of<br />Fire &amp; Blood
              </h1>
              <div className={styles.coverDivider}>✦</div>
              <p className={styles.coverSub}>
                {lang === "en"
                  ? "A record of truth, betrayal, and blood"
                  : "Hakikat, ihanet ve kanın kaydı"}
              </p>
              <div className={styles.coverPrompt}>
                {lang === "en" ? "— open to begin —" : "— açmak için tıkla —"}
              </div>
            </div>
            <div className={styles.coverSheen} aria-hidden />
          </div>

          {/* ── BACK FACE (inside-left page) — unchanged: title + description ── */}
          <div className={styles.coverBack}>
            <div className={styles.pageTexture} />
            <div className={styles.insideLeft}>
              <h2 className={styles.insideTitle}>A Song of Fire &amp; Blood</h2>
              <p className={styles.insideSub}>
                {lang === "en"
                  ? "A record of truth, betrayal, and blood"
                  : "Hakikat, ihanet ve kanın kaydı"}
              </p>
            </div>
          </div>
        </div>

        {/* ── TABLE OF CONTENTS: ONE full page to the right of the cover,
              single scrollable list, hover synopsis bubble ── */}
        <div className={styles.tocSpread}>
          <div className={styles.tocPage} ref={tocPageRef}>
            <div className={styles.pageTexture} />
            <div className={styles.tocPageInner}>
              <div className={styles.tocHeader}>
                {lang === "en" ? "Contents" : "İçindekiler"}
              </div>
              <div className={styles.tocDividerLine} />
              <ul
                className={styles.tocList}
                onScroll={handleListScroll}
              >
                {chapters.map((ch) => (
                  <li
                    key={ch.slug}
                    className={[
                      styles.tocEntry,
                      bubble?.slug === ch.slug ? styles.tocEntryHovered : "",
                      pendingSlug === ch.slug ? styles.tocEntryActive : "",
                    ].filter(Boolean).join(" ")}
                    onMouseEnter={(e) => showBubble(ch, e.currentTarget)}
                    onMouseLeave={hideBubble}
                    onFocus={(e) => showBubble(ch, e.currentTarget)}
                    onBlur={hideBubble}
                    onClick={() => goToChapter(ch.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && goToChapter(ch.slug)}
                  >
                    <span className={styles.tocEntryTitle}>{chapterTitle(ch, lang)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* floating synopsis bubble — sibling of the scrolling list,
                so its own overflow never clips it */}
            {bubble && (
              <div
                className={styles.tocBubble}
                style={{ top: bubble.top }}
                aria-hidden
              >
                <div className={styles.tocBubbleTitle}>{bubble.title}</div>
                <p className={styles.tocBubbleText}>{bubble.synopsis}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── back cover ── */}
        <div className={styles.backCover}>
          <div className={styles.backCoverInner}>
            <span className={styles.backOrnament}>✦</span>
          </div>
        </div>

      </div>
      {/* ════════════════ end book ════════════════ */}

      {/* ── cover hint tooltip on hover ── */}
      {phase === "cover" && (
        <p className={styles.hint} aria-hidden>
          {lang === "en" ? "Click the book to open" : "Kitabı açmak için tıklayın"}
        </p>
      )}
    </div>
  );
}

export default function ChaptersHub() {
  return (
    <Suspense fallback={null}>
      <ChaptersHubContent />
    </Suspense>
  );
}