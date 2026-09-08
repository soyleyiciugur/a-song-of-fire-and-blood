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

  // ── init: read persisted lang & bookmark
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem("asofiab-lang") as Lang | null;
        if (saved === "en" || saved === "tr") setLang(saved);
        const bm = localStorage.getItem("asofiab-bookmark");
        if (bm) setBookmark(JSON.parse(bm));
      } catch {}
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const selectLang = useCallback((next: Lang) => {
    setBubble(null);
    setLang(next);
    try { localStorage.setItem("asofiab-lang", next); } catch {}
  }, []);

  const openBook = useCallback(() => {
    if (phase !== "cover") return;
    setPhase("opening");
  }, [phase]);

  const closeBook = useCallback(() => {
    if (phase !== "toc") return;
    setBubble(null);
    setPhase("closing");
  }, [phase]);

  const goToChapter = useCallback((slug: string) => {
    if (phase !== "toc" || pendingSlug) return;
    setBubble(null);
    setPendingSlug(slug);
    setPhase("closing");
  }, [phase, pendingSlug]);

  const finishTransition = useCallback(() => {
    if (phase === "opening") setPhase("toc");
    if (phase === "closing") {
      if (pendingSlug) {
        router.push(`/chapters/${pendingSlug}?lang=${lang}`);
      } else {
        setPhase("cover");
      }
    }
  }, [phase, pendingSlug, router, lang]);

  useEffect(() => {
    if (phase !== "opening" && phase !== "closing") return;
    // Covers reduced motion and browsers that cancel transition events.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(finishTransition, reduced ? 0 : 1000);
    return () => window.clearTimeout(timer);
  }, [phase, finishTransition]);

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

  // Delay hiding while the pointer crosses neighboring rows.
  const hideTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const showBubble = useCallback((ch: Chapter) => {
    clearHideTimeout();
    setBubble({ slug: ch.slug, title: chapterTitle(ch, lang), synopsis: chapterSynopsis(ch, lang) });
  }, [lang, clearHideTimeout]);

  const hideBubble = useCallback(() => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setBubble(null);
      hideTimeoutRef.current = null;
    }, 140);
  }, [clearHideTimeout]);

  useEffect(() => clearHideTimeout, [clearHideTimeout]);

  // clear the bubble if the list is scrolled so it doesn't hang in a
  // stale position
  const handleListScroll = useCallback(() => {
    clearHideTimeout();
    setBubble(null);
  }, [clearHideTimeout]);

  const bookmarkChapter = bookmark ? chapters.find(c => c.slug === bookmark.slug) : null;
  const coverOpen = phase === "opening" || phase === "toc";

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
        onKeyDown={phase === "cover" ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBook();
          }
        } : undefined}
      >
        {/* ── spine ── */}
        <div className={styles.spine}>
          <span className={styles.spineText}>A Song of Fire and Blood</span>
          <span className={styles.spineOrnament}>✦ ✦ ✦</span>
        </div>

        {/* ── right spine: mirrors the real spine so the open spread reads
              as one bound book behind the ToC page too, not just the
              cover. Purely decorative — no title text, just the same
              leather. Only visible once open (see .bookOpen .spineRight). ── */}
        <div className={styles.spineRight} aria-hidden />

        {/* ── COVER CARD: front cover + inside-left page ── */}
        <div
          className={[styles.coverCard, coverOpen ? styles.coverCardFlipped : ""].filter(Boolean).join(" ")}
          onTransitionEnd={(e) => {
            if (e.target === e.currentTarget && e.propertyName === "transform") finishTransition();
          }}
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
        <div className={styles.tocSpread} inert={phase !== "toc"}>
          <div className={styles.tocPage}>
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
                  <li key={ch.slug} className={styles.tocEntryItem}>
                    <button
                      type="button"
                      disabled={phase !== "toc"}
                      className={[
                        styles.tocEntry,
                        bubble?.slug === ch.slug ? styles.tocEntryHovered : "",
                        pendingSlug === ch.slug ? styles.tocEntryActive : "",
                      ].filter(Boolean).join(" ")}
                      onMouseEnter={() => showBubble(ch)}
                      onMouseLeave={hideBubble}
                      onFocus={() => showBubble(ch)}
                      onBlur={hideBubble}
                      onClick={() => goToChapter(ch.slug)}
                    >
                      <span className={styles.tocEntryTitle}>{chapterTitle(ch, lang)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* The synopsis stays on the facing page without moving the list. */}
          {bubble && (
            <div
              className={styles.tocBubble}
              aria-hidden
            >
              <div className={styles.tocBubbleTitle}>{bubble.title}</div>
              <p className={styles.tocBubbleText}>{bubble.synopsis}</p>
            </div>
          )}
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
