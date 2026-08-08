// ─── C:\Users\Locpick-13\a-song-of-fire-and-blood\app\chapters\page.tsx ───
//
// Requires: app/chapters/chapters-hub.module.css
//
// Language support: reads/writes localStorage key "asofiab-lang" ("en"|"tr").
// Chapter data: pulls from data/chapters.json via getAllChapters().
// TR fields used: chapter.titleTr, chapter.synopsisTr (optional; falls back to EN).
//
// Fixes in this revision:
//  #1 lang toggle no longer swaps position — two independent pill buttons.
//  #1(new) cover text no longer invisible until click: front/back cover
//     faces are now ONE rotating unit (.coverCard).
//  #2 cover's inside face shows the same title/sub as the front (minus
//     "open to begin"), right-reading rather than mirrored.
//  #4 clicking the empty background while the book is open closes it.
//  #5 Esc closes the book if it's open (table of contents).
//  #5(centering) book stays centered when open.
//  #NEW (ToC restructure): the spread used to be inside-cover (left) +
//     ToC-left-half + ToC-right-half — three panels total, with chapters
//     alternating left/right/left/right in reading order and confusing
//     "I"/"II" page numbers on what looked like one page. Now the spread
//     is exactly two panels: left = inside cover, right = ONE single
//     scrollable column listing all chapters top-to-bottom in order,
//     titles only, synopsis revealed on hover (see CSS .tocSynopsis).
"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
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

  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>(
    searchParams.get("openToc") === "1" ? "toc" : "cover"
  );
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [bookmark, setBookmark] = useState<{ slug: string; page: number } | null>(null);

  const bookRef = useRef<HTMLDivElement>(null);

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
    setPhase("closing");
    setTimeout(() => setPhase("cover"), 700);
  }, [phase]);

  const goToChapter = useCallback((slug: string) => {
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
          phase === "toc"     ? styles.bookOpen    : "",
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

        {/* ── TABLE OF CONTENTS — FIRST child so it sits at the lowest
              z-index inside bookWrap. Positioned at left: var(--spine-w)
              so it occupies exactly the same footprint as the cover card.
              The cover card (z-index 6) flips away to reveal this page
              (z-index 5) behind it — one single full-width parchment
              page, no split columns. ── */}
        <div className={styles.tocSpread}>
          <div className={styles.tocPage}>
            <div className={styles.pageTexture} />
            <div className={styles.tocPageInner}>
              <div className={styles.tocHeader}>
                {lang === "en" ? "Contents" : "İçindekiler"}
              </div>
              <div className={styles.tocDividerLine} />
              <ul className={styles.tocList}>
                {chapters.map((ch) => (
                  <li
                    key={ch.slug}
                    className={[
                      styles.tocEntry,
                      hoveredChapter === ch.slug ? styles.tocEntryHovered : "",
                      pendingSlug    === ch.slug ? styles.tocEntryActive  : "",
                    ].filter(Boolean).join(" ")}
                    onMouseEnter={() => setHoveredChapter(ch.slug)}
                    onMouseLeave={() => setHoveredChapter(null)}
                    onClick={() => goToChapter(ch.slug)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && goToChapter(ch.slug)}
                  >
                    <span className={styles.tocEntryTitle}>{chapterTitle(ch, lang)}</span>
                    <span className={styles.tocSynopsis}>{chapterSynopsis(ch, lang)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── spine ── */}
        <div className={styles.spine}>
          <span className={styles.spineText}>A Song of Fire and Blood</span>
          <span className={styles.spineOrnament}>✦ ✦ ✦</span>
        </div>

        {/* ── COVER CARD: one physical card, two faces (z-index 6,
              sits above tocSpread so it can flip away to reveal it) ── */}
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

          {/* ── BACK FACE (inside-left page) ── */}
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

        {/* ── back cover ── */}
        <div className={styles.backCover}>
          <div className={styles.backCoverInner}>
            <span className={styles.backOrnament}>✦</span>
          </div>
        </div>

      </div>
      {/* ════════════════ end book ════════════════ */}

      {/* ── cover hint ── */}
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