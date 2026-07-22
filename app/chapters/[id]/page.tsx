"use client";

// ─── C:\Users\Locpick-13\a-song-of-fire-and-blood\app\chapters\[id]\page.tsx ───
//
// Replaces the old [id]/page.tsx entirely.
// This is a CLIENT component — all pagination happens in the browser.
//
// IMAGE SUPPORT:
//   In chapters.json, any paragraph whose text starts with "[IMAGE:" will be
//   rendered as an image instead of text. Format:  [IMAGE:filename.webp]
//   The image will be looked up at /images/chapters/filename.webp
//
// LANGUAGE:
//   Reads ?lang= from URL (set by hub) and falls back to localStorage.
//   Falls back to EN if no TR fields exist on chapter data.
//
// BOOKMARKING:
//   On every spread turn, writes { slug, spread } to localStorage
//   "asofiab-bookmark".
//
// Fixes in this revision:
//  #1  lang toggle is two independent buttons, doesn't swap position.
//  #5  Esc sends you back to the hub with the table of contents already
//      open (?openToc=1), rather than the closed cover.
//  #10 the right page is no longer empty — content is paginated across
//      BOTH pages of a spread (a "spread" = one left column + one right
//      column of text).
//  #11 the very first spread is fixed: chapter image on the left,
//      title + synopsis on the right. Chapter navigation labels added.
//  #12 "Page X of Y" is an editable field; typing a number and pressing
//      Enter jumps straight to that spread. (Now using real book numbering 1-2, 3-4)
//  #13 prev/next (both in-chapter and chapter-to-chapter) are corner-curl
//      hit areas layered over the page itself, not visible buttons.

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getAllChapters } from "@/data/chapters";
import styles from "./chapter-reader.module.css";

// ─── types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "tr";

type Chapter = {
  slug: string;
  title: string;
  synopsis: string;
  image: string;
  content: string[];
  titleTr?: string;
  synopsisTr?: string;
  contentTr?: string[];
};

type Block = { type: "text"; text: string } | { type: "image"; src: string };

// ─── helpers ──────────────────────────────────────────────────────────────────

const IMAGE_RE = /^\[IMAGE:(.+?)\]$/;

function parseBlock(raw: string): Block {
  const m = raw.match(IMAGE_RE);
  if (m) return { type: "image", src: `/images/chapters/${m[1]}` };
  return { type: "text", text: raw };
}

function chapterTitle(ch: Chapter, lang: Lang) {
  return lang === "tr" && ch.titleTr ? ch.titleTr : ch.title;
}

function chapterSynopsis(ch: Chapter, lang: Lang) {
  return lang === "tr" && ch.synopsisTr ? ch.synopsisTr : ch.synopsis;
}

function chapterContent(ch: Chapter, lang: Lang): string[] {
  if (lang === "tr" && ch.contentTr && ch.contentTr.length > 0) return ch.contentTr;
  return ch.content;
}

// Ornamental dividers already in chapter text — keep them as-is
const DIVIDER_MARKER = "✧ ✦ ✧";

// ─── pagination engine ────────────────────────────────────────────────────────
// Splits body paragraphs into single-column "pages" that each fit the
// measured column height. Two of these columns make up one on-screen
// spread (left + right), except for the fixed first spread (bug #11),
// which never holds body text.

function paginateContent(
  blocks: string[],
  columnHeightPx: number,
  rulerEl: HTMLElement
): string[][] {
  const pages: string[][] = [];
  let current: string[] = [];
  let usedHeight = 0;

  for (const block of blocks) {
    rulerEl.innerHTML = "";
    const el = document.createElement("p");
    el.className = "ruler-para";
    el.style.cssText = `
      margin: 0 0 1em 0;
      font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
      font-size: 0.93rem;
      line-height: 1.85;
      width: 100%;
    `;
    const imgMatch = block.match(IMAGE_RE);
    if (imgMatch) {
      el.style.height = "220px";
      el.style.display = "block";
    } else if (block === DIVIDER_MARKER) {
      el.style.height = "28px";
      el.style.textAlign = "center";
      el.textContent = block;
    } else {
      el.textContent = block;
    }
    rulerEl.appendChild(el);
    const h = el.getBoundingClientRect().height + 16; // +margin

    if (usedHeight + h > columnHeightPx && current.length > 0) {
      pages.push(current);
      current = [block];
      usedHeight = h;
    } else {
      current.push(block);
      usedHeight += h;
    }
  }

  if (current.length > 0) pages.push(current);
  return pages.length > 0 ? pages : [[]];
}

function renderBlocks(blocks: Block[]) {
  return blocks.map((block, i) => {
    if (block.type === "image") {
      return (
        <div key={i} className={styles.inlineImageWrap}>
          <Image
            src={block.src}
            alt=""
            width={320}
            height={200}
            className={styles.inlineImage}
          />
        </div>
      );
    }
    if (block.text === DIVIDER_MARKER) {
      return <div key={i} className={styles.sectionDivider}>{block.text}</div>;
    }
    return (
      <p key={i} className={styles.paragraph}>
        {block.text}
      </p>
    );
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ChapterReader() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const allChapters = getAllChapters() as Chapter[];
  const chapterIndex = allChapters.findIndex(c => c.slug === params.id);
  const chapter = allChapters[chapterIndex] as Chapter | undefined;

  // ── language
  const [lang, setLang] = useState<Lang>(() => {
    const fromUrl = searchParams.get("lang");
    if (fromUrl === "en" || fromUrl === "tr") return fromUrl;
    try {
      const saved = localStorage.getItem("asofiab-lang");
      if (saved === "en" || saved === "tr") return saved as Lang;
    } catch {}
    return "en";
  });

  const selectLang = useCallback((next: Lang) => {
    setLang(next);
    try { localStorage.setItem("asofiab-lang", next); } catch {}
  }, []);

  // ── pagination state
  // `columnPages` holds only BODY text, split into single-column chunks.
  // Spread 0 is always the fixed image/title/synopsis spread (bug #11);
  // spread N (N>=1) shows columnPages[2N-2] on the left and
  // columnPages[2N-1] on the right (bug #10 — right page now has content).
  const [columnPages, setColumnPages] = useState<string[][]>([]);
  const [spreadIndex, setSpreadIndex] = useState<number>(0);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const [pageInputValue, setPageInputValue] = useState<string>("1");

  // ── DOM refs
  const pageAreaRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const totalSpreads = Math.max(1, 1 + Math.ceil(columnPages.length / 2));
  const totalPages = totalSpreads * 2;

  // ── build pages whenever chapter  changes
  const prevChapterSlugRef = useRef<string | null>(null);

useLayoutEffect(() => {
  if (!chapter || !rulerRef.current || !pageAreaRef.current) return;

  const blocks = chapterContent(chapter, lang);
  const h = pageAreaRef.current.getBoundingClientRect().height;
  if (h < 50) return;

  const built = paginateContent(blocks, h * 0.92, rulerRef.current);
  setColumnPages(built);

  const total = 1 + Math.ceil(built.length / 2);
  const chapterChanged = prevChapterSlugRef.current !== chapter.slug;
  prevChapterSlugRef.current = chapter.slug;

  const fromUrl = searchParams.get("page");
  if (fromUrl) {
    const n = parseInt(fromUrl, 10);
    setSpreadIndex(isNaN(n) ? 0 : Math.max(0, Math.min(n, total - 1)));
  } else if (chapterChanged) {
    setSpreadIndex(0);
  } else {
    // lang-only change: clamp current position into the new total,
    // but don't reset to page 1
    setSpreadIndex((prev) => Math.max(0, Math.min(prev, total - 1)));
  }
}, [chapter, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // keep the editable page-number field in sync — now shows the LEFT page
  // number of the current spread
  useEffect(() => {
    setPageInputValue(String(spreadIndex * 2 + 1));
  }, [spreadIndex]);

  // ── save bookmark on spread change
  useEffect(() => {
    if (!chapter) return;
    try {
      localStorage.setItem("asofiab-bookmark", JSON.stringify({
        slug: chapter.slug,
        page: spreadIndex,
      }));
    } catch {}
  }, [chapter, spreadIndex]);

  // ── spread turn logic
const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const goToSpread = useCallback((target: number) => {
  if (target < 0 || target >= totalSpreads) return;
  if (turnTimeoutRef.current) clearTimeout(turnTimeoutRef.current);
  const dir = target > spreadIndex ? "next" : "prev";
  setTurning(dir);
  turnTimeoutRef.current = setTimeout(() => {
    setSpreadIndex(target);
    setTurning(null);
    turnTimeoutRef.current = null;
  }, 480);
}, [spreadIndex, totalSpreads]);

  const goNextSpread = useCallback(() => goToSpread(spreadIndex + 1), [goToSpread, spreadIndex]);
  const goPrevSpread = useCallback(() => goToSpread(spreadIndex - 1), [goToSpread, spreadIndex]);

  // ── chapter nav
  const prevChapter = chapterIndex > 0 ? allChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < allChapters.length - 1 ? allChapters[chapterIndex + 1] : null;

  const isFirstSpread = spreadIndex === 0;
  const isLastSpread = spreadIndex === totalSpreads - 1;

  const goChapter = useCallback((slug: string) => {
    router.push(`/chapters/${slug}?lang=${lang}`);
  }, [router, lang]);

  // ── bug #5: Esc sends you back to the hub with the ToC already open.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNextSpread();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrevSpread();
      if (e.key === "Escape") {
        router.push(`/chapters?openToc=1&lang=${lang}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNextSpread, goPrevSpread, router, lang]);

  // page-number input handlers (bug #12) — input is now a PAGE number,
  // convert to spread by integer division
  const commitPageInput = useCallback(() => {
    const n = parseInt(pageInputValue, 10);
    if (!isNaN(n)) {
      const page = Math.max(1, Math.min(n, totalPages));
      const target = Math.floor((page - 1) / 2);
      goToSpread(target);
    } else {
      setPageInputValue(String(spreadIndex * 2 + 1));
    }
  }, [pageInputValue, totalPages, goToSpread, spreadIndex]);

  // ── current spread's left/right blocks
  const { leftBlocks, rightBlocks } = useMemo(() => {
    if (isFirstSpread) return { leftBlocks: [] as Block[], rightBlocks: [] as Block[] };
    const colIdx = (spreadIndex - 1) * 2;
    const left = (columnPages[colIdx] || []).map(parseBlock);
    const right = (columnPages[colIdx + 1] || []).map(parseBlock);
    return { leftBlocks: left, rightBlocks: right };
  }, [columnPages, spreadIndex, isFirstSpread]);

  // ── not found
  if (!chapter) {
    return (
      <div className={styles.notFound}>
        {lang === "en" ? "Chapter not found." : "Bölüm bulunamadı."}
      </div>
    );
  }

  const displayTitle = chapterTitle(chapter, lang);

  return (
    <div className={styles.scene}>
      {/* hidden ruler for measuring paragraph heights */}
      <div
        ref={rulerRef}
        aria-hidden
        style={{
          position: "fixed",
          visibility: "hidden",
          pointerEvents: "none",
          top: 0,
          left: 0,
          width: "calc((min(920px, 100vw) - 52px) / 2 - 64px)",
          overflow: "hidden",
        }}
      />

      {/* ── language toggle (bug #1) ── */}
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

      {/* ── back to hub — opens straight to the table of contents ── */}
      <a href={`/chapters?openToc=1&lang=${lang}`} className={styles.backLink}>
        ← {lang === "en" ? "All chapters" : "Tüm bölümler"}
      </a>

      {/* ════════ THE OPEN BOOK ════════ */}
      <div className={styles.book}>

        {/* spine */}
        <div className={styles.spine}>
          <span className={styles.spineTitle}>{displayTitle}</span>
        </div>

        {/* page spread */}
        <div
          className={[
            styles.spread,
            turning === "next" ? styles.turningNext : "",
            turning === "prev" ? styles.turningPrev : "",
          ].filter(Boolean).join(" ")}
        >
          {/* ── LEFT PAGE ── */}
          <div className={styles.pageLeft}>
            <div className={styles.pageTexture} />

            {isFirstSpread ? (
              // left page: image only
              <div className={styles.pageContent} ref={pageAreaRef}>
                <div className={styles.chapterHeader}>
                  {chapter.image && (
                    <div className={styles.chapterImageWrap}>
                      <Image
                        src={chapter.image}
                        alt={displayTitle}
                        width={340}
                        height={180}
                        className={styles.chapterImage}
                        priority
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.pageContent} ref={pageAreaRef}>
                {renderBlocks(leftBlocks)}
              </div>
            )}

            {/* left-page footer: editable page number */}
            <div className={styles.pageFooter}>
              <form
                className={styles.pageNumForm}
                onSubmit={(e) => { e.preventDefault(); commitPageInput(); }}
              >
                <span>{lang === "en" ? "Page" : "Sayfa"}</span>
                <input
                  className={styles.pageNumInput}
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onBlur={commitPageInput}
                  aria-label={lang === "en" ? "Go to page" : "Sayfaya git"}
                />
                <span>{lang === "en" ? `of ${totalPages}` : `/ ${totalPages}`}</span>
              </form>
            </div>
            
            {/* bug #13: corner-curl hit area, embedded in the page itself.
                First spread → previous chapter. Otherwise → previous spread. */}
            <div
              className={[
                styles.pageCorner,
                styles.pageCornerLeft,
                (isFirstSpread && !prevChapter) ? styles.pageCornerDisabled : "",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (isFirstSpread) {
                  if (prevChapter) goChapter(prevChapter.slug);
                } else {
                  goPrevSpread();
                }
              }}
              role="button"
              tabIndex={0}
              title={
                isFirstSpread
                  ? (prevChapter
                      ? chapterTitle(prevChapter as Chapter, lang)
                      : (lang === "en" ? "No previous chapter" : "Önceki bölüm yok"))
                  : (lang === "en" ? "Previous page" : "Önceki sayfa")
              }
              aria-label={
                isFirstSpread
                  ? (lang === "en" ? "Previous chapter" : "Önceki bölüm")
                  : (lang === "en" ? "Previous page" : "Önceki sayfa")
              }
            />
            {isFirstSpread && prevChapter && (
              <span className={[styles.cornerLabel, styles.cornerLabelLeft].join(" ")}>
                ← {lang === "en" ? "Previous chapter" : "Önceki bölüm"}
              </span>
            )}
          </div>

          {/* gutter shadow */}
          <div className={styles.gutter} aria-hidden />

          {/* ── RIGHT PAGE ── */}
          <div className={styles.pageRight}>
            <div className={styles.pageTexture} />

            {isFirstSpread ? (
              // right page: title + synopsis only
              <div className={styles.synopsisBlock}>
                <h1 className={styles.chapterTitle}>{displayTitle}</h1>
                <div className={styles.chapterDivider}>✦</div>
                <div className={styles.synopsisLabel}>
                  {lang === "en" ? "Synopsis" : "Özet"}
                </div>
                <p className={styles.synopsisText}>
                  {chapterSynopsis(chapter, lang)}
                </p>
              </div>
            ) : (
              // bug #10: the right page now renders real content instead
              // of being empty.
              <div className={styles.pageContentRight}>
                {renderBlocks(rightBlocks)}
              </div>
            )}

            {/* right-page footer: read-only indicator, one page ahead of the left */}
            <div className={styles.pageFooterRight}>
              <span className={styles.pageNumForm}>
                {lang === "en"
                  ? `Page ${spreadIndex * 2 + 2} of ${totalPages}`
                  : `Sayfa ${spreadIndex * 2 + 2} / ${totalPages}`}
              </span>
            </div>


            {/* bug #13: corner-curl hit area for next page / next chapter */}
            <div
              className={[
                styles.pageCorner,
                styles.pageCornerRight,
                (isLastSpread && !nextChapter) ? styles.pageCornerDisabled : "",
              ].filter(Boolean).join(" ")}
              onClick={() => {
                if (isLastSpread) {
                  if (nextChapter) goChapter(nextChapter.slug);
                } else {
                  goNextSpread();
                }
              }}
              role="button"
              tabIndex={0}
              title={
                isLastSpread
                  ? (nextChapter
                      ? chapterTitle(nextChapter as Chapter, lang)
                      : (lang === "en" ? "No next chapter" : "Sonraki bölüm yok"))
                  : (lang === "en" ? "Next page" : "Sonraki sayfa")
              }
              aria-label={
                isLastSpread
                  ? (lang === "en" ? "Next chapter" : "Sonraki bölüm")
                  : (lang === "en" ? "Next page" : "Sonraki sayfa")
              }
            />
            {isLastSpread && nextChapter && (
              <span className={[styles.cornerLabel, styles.cornerLabelRight].join(" ")}>
                {lang === "en" ? "Next chapter" : "Sonraki bölüm"} →
              </span>
            )}
            
          </div>
        </div>
        {/* end spread */}
      </div>
      {/* end book */}
    </div>
  );
}