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
// READING PROGRESS:
//   The chapter boundary advances only through Mark as read. Page turns update
//   the saved position only while reading that already-selected chapter.
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
//  #NEW "Read full chapter" toggle: switches from the page-flip book
//      view to a single scrollable parchment page with the whole
//      chapter's text, set in Geist (the site's normal readable body
//      font) instead of the decorative House of the Dragon face used
//      by the book. Lives in the persistent top controls row, next to
//      the language toggle, so it's reachable from any spread. Esc
//      still returns to the hub from either view; toggling view mode
//      does not lose your place in the book (spreadIndex is untouched).
//      Styling for this view lives in ./full-chapter.module.css.

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
import ChapterCover from "@/components/ChapterCover";
import { getAllChapters } from "@/data/chapters";
import styles from "./chapter-reader.module.css";
import fc from "./full-chapter.module.css";
import { useReadingProgress } from "@/components/reading/ReadingProgressProvider";
import ChapterCompanion from "@/components/reading/ChapterCompanion";

// ─── types ────────────────────────────────────────────────────────────────────

type Lang = "en" | "tr";
type ViewMode = "book" | "scroll";

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

// ─── pagination engine (book view only) ────────────────────────────────────────
// Splits body paragraphs into single-column "pages" that each fit the
// measured column height. Two of these columns make up one on-screen
// spread (left + right), except for the fixed first spread (bug #11),
// which never holds body text.

function paginateContent(
  blocks: string[],
  columnHeightPx: number,
  rulerEl: HTMLElement,
  mobile: boolean
): string[][] {
  const pages: string[][] = [];
  let current: string[] = [];
  let usedHeight = 0;

  const measure = (block: string) => {
    rulerEl.innerHTML = "";
    const el = document.createElement("p");
    el.style.cssText = `
      margin: 0 0 ${mobile ? "0.8em" : "0.85em"} 0;
      font-family: "House of the Dragon", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
      font-size: ${mobile ? "0.88rem" : "0.93rem"};
      line-height: ${mobile ? "1.72" : "1.85"};
      width: 100%;
      box-sizing: border-box;
      white-space: normal;
      overflow-wrap: anywhere;
    `;

    const imgMatch = block.match(IMAGE_RE);
    if (imgMatch) {
      el.style.height = mobile ? "180px" : "220px";
      el.style.display = "block";
    } else if (block === DIVIDER_MARKER) {
      el.style.height = "28px";
      el.style.textAlign = "center";
      el.textContent = block;
    } else {
      el.textContent = block;
    }

    rulerEl.appendChild(el);
    const computed = getComputedStyle(el);
    return el.getBoundingClientRect().height + parseFloat(computed.marginBottom || "0");
  };

  const pushPage = () => {
    if (current.length) pages.push(current);
    current = [];
    usedHeight = 0;
  };

  const splitOversizedParagraph = (block: string) => {
    let words = block.split(/\s+/).filter(Boolean);
    while (words.length) {
      let low = 1;
      let high = words.length;
      let fit = 0;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const candidate = words.slice(0, mid).join(" ");
        if (measure(candidate) <= columnHeightPx) {
          fit = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      // Extremely long unbroken tokens still need to make progress.
      if (fit === 0) fit = 1;
      const chunk = words.slice(0, fit).join(" ");
      current.push(chunk);
      usedHeight = measure(chunk);
      words = words.slice(fit);
      if (words.length) pushPage();
    }
  };

  for (const rawBlock of blocks) {
    const block = rawBlock.trim();
    if (!block) continue;

    const height = measure(block);

    // Images, dividers and normal JSON paragraph blocks are atomic whenever
    // they can fit on an empty page. If a complete paragraph would cross the
    // bottom reading boundary, move the whole paragraph to the next page.
    if (height <= columnHeightPx) {
      if (current.length && usedHeight + height > columnHeightPx) pushPage();
      current.push(block);
      usedHeight += height;
      continue;
    }

    // Only paragraphs taller than a page by themselves are split. This keeps
    // ordinary source paragraphs intact while preventing genuinely huge blocks
    // from overflowing the paper. Images/dividers stay atomic.
    if (IMAGE_RE.test(block) || block === DIVIDER_MARKER) {
      if (current.length) pushPage();
      current.push(block);
      usedHeight = Math.min(height, columnHeightPx);
      pushPage();
      continue;
    }

    if (current.length) pushPage();
    splitOversizedParagraph(block);
  }

  pushPage();
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

// ─── full-chapter scroll view renderer ─────────────────────────────────────────
// Same block parsing as the book view, but rendered as one continuous
// column in Geist, with a drop cap on the first real paragraph only.

function renderFullChapterBlocks(blocks: Block[]) {
  let usedDropCap = false;
  return blocks.map((block, i) => {
    if (block.type === "image") {
      return (
        <div key={i} className={fc.fcInlineImageWrap}>
          <Image
            src={block.src}
            alt=""
            width={420}
            height={260}
            className={fc.fcInlineImage}
          />
        </div>
      );
    }
    if (block.text === DIVIDER_MARKER) {
      return <div key={i} className={fc.fcSectionDivider}>{block.text}</div>;
    }
    if (!usedDropCap && block.text.trim().length > 0) {
      usedDropCap = true;
      const first = block.text.trim();
      const dropChar = first.charAt(0);
      const rest = first.slice(1);
      return (
        <p key={i} className={fc.fcParagraph}>
          <span className={fc.fcDropCap}>{dropChar}</span>
          {rest}
        </p>
      );
    }
    return (
      <p key={i} className={fc.fcParagraph}>
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
  const { progress, setProgress, clearProgress, updatePosition } = useReadingProgress();

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

  // ── view mode: page-flip book vs. single-scroll full chapter.
  // Not persisted to localStorage or the URL on purpose — reopening a
  // chapter should default back to the book view; the scroll view is a
  // one-off reading convenience for the current visit.
  const [viewMode, setViewMode] = useState<ViewMode>("book");
  const [chapterListOpen, setChapterListOpen] = useState(false);

  const toggleViewMode = useCallback(() => {
    setViewMode((m) => (m === "book" ? "scroll" : "book"));
  }, []);

  // ── pagination state (book view)
  // `columnPages` holds only BODY text, split into single-column chunks.
  // Spread 0 is always the fixed image/title/synopsis spread (bug #11);
  // spread N (N>=1) shows columnPages[2N-2] on the left and
  // columnPages[2N-1] on the right (bug #10 — right page now has content).
  const [columnPages, setColumnPages] = useState<string[][]>([]);
  const [spreadIndex, setSpreadIndex] = useState<number>(0);
  const [turning, setTurning] = useState<"next" | "prev" | null>(null);
  const [pageInputValue, setPageInputValue] = useState<string>("1");
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePageIndex, setMobilePageIndex] = useState(0);
  const readerInteractionRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // ── DOM refs
  const pageAreaRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  const totalSpreads = Math.max(1, 1 + Math.ceil(columnPages.length / 2));
  const totalPages = totalSpreads * 2;
  const mobileTotalPages = Math.max(2, 2 + columnPages.length);

  // ── build pages whenever chapter changes (book view only — no need to
  // paginate while in scroll view, but we still keep this running so the
  // book view is ready the instant the user switches back)
  const prevChapterSlugRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (viewMode !== "book") return;
    if (!chapter || !rulerRef.current || !pageAreaRef.current) return;

    const pageArea = pageAreaRef.current;
    const ruler = rulerRef.current;

    const buildPages = () => {
      const style = getComputedStyle(pageArea);
      const paddingX = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
      const paddingY = parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0");
      const contentWidth = Math.max(120, pageArea.clientWidth - paddingX);
      const contentHeight = Math.max(120, pageArea.clientHeight - paddingY);
      ruler.style.width = `${contentWidth}px`;

      const blocks = chapterContent(chapter, lang);
      const built = paginateContent(blocks, contentHeight, ruler, isMobile);
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
        setSpreadIndex((prev) => Math.max(0, Math.min(prev, total - 1)));
      }
    };

    buildPages();
    const observer = new ResizeObserver(buildPages);
    observer.observe(pageArea);
    return () => observer.disconnect();
  }, [chapter, lang, viewMode, isMobile, searchParams]);

  useEffect(() => {
    setMobilePageIndex((prev) => Math.max(0, Math.min(prev, mobileTotalPages - 1)));
  }, [mobileTotalPages]);

  useEffect(() => {
    if (!isMobile) return;
    setMobilePageIndex(Math.max(0, Math.min(spreadIndex * 2, mobileTotalPages - 1)));
  }, [isMobile]); // intentionally only when entering/leaving mobile layout

  // keep the editable page-number field in sync — shows the LEFT page
  // number of the current spread
  useEffect(() => {
    setPageInputValue(String(spreadIndex * 2 + 1));
  }, [spreadIndex]);

  // Only update the saved page inside the current reading-boundary chapter.
  // Merely visiting an older or newer chapter must not move the boundary.
  useEffect(() => {
    if (!chapter || viewMode !== "book" || !readerInteractionRef.current) return;
    const timer = window.setTimeout(() => void updatePosition(chapter.slug, spreadIndex), 350);
    return () => window.clearTimeout(timer);
  }, [chapter, spreadIndex, updatePosition, viewMode]);

  useEffect(() => {
    if (!chapter || viewMode !== "book" || !isMobile || !readerInteractionRef.current) return;
    const timer = window.setTimeout(() => void updatePosition(chapter.slug, Math.floor(mobilePageIndex / 2)), 350);
    return () => window.clearTimeout(timer);
  }, [chapter, isMobile, mobilePageIndex, updatePosition, viewMode]);

  // ── spread turn logic
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goToSpread = useCallback((target: number) => {
    if (target < 0 || target >= totalSpreads) return;
    readerInteractionRef.current = true;
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

  const goNextMobilePage = useCallback(() => {
    readerInteractionRef.current = true;
    setMobilePageIndex((prev) => Math.min(prev + 1, mobileTotalPages - 1));
  }, [mobileTotalPages]);

  const goPrevMobilePage = useCallback(() => {
    readerInteractionRef.current = true;
    setMobilePageIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // ── chapter nav
  const prevChapter = chapterIndex > 0 ? allChapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex < allChapters.length - 1 ? allChapters[chapterIndex + 1] : null;

  const isFirstSpread = spreadIndex === 0;
  const isLastSpread = spreadIndex === totalSpreads - 1;

  const goChapter = useCallback((slug: string) => {
    setChapterListOpen(false);
    router.push(`/chapters/${slug}?lang=${lang}`);
  }, [router, lang]);

  // ── Esc sends you back to the hub with the ToC already open, from
  // either view mode. Arrow keys only drive page-turns in book view.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (viewMode === "book") {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          if (isMobile) goNextMobilePage();
          else goNextSpread();
        }
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          if (isMobile) goPrevMobilePage();
          else goPrevSpread();
        }
      }
      if (e.key === "Escape") {
        if (chapterListOpen) {
          setChapterListOpen(false);
        } else {
          router.push(`/chapters?openToc=1&lang=${lang}`);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNextSpread, goPrevSpread, goNextMobilePage, goPrevMobilePage, isMobile, router, lang, viewMode, chapterListOpen]);

  // page-number input handlers (bug #12) — input is a PAGE number,
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

  // ── current spread's left/right blocks (book view)
  const { leftBlocks, rightBlocks } = useMemo(() => {
    if (isFirstSpread) return { leftBlocks: [] as Block[], rightBlocks: [] as Block[] };
    const colIdx = (spreadIndex - 1) * 2;
    const left = (columnPages[colIdx] || []).map(parseBlock);
    const right = (columnPages[colIdx + 1] || []).map(parseBlock);
    return { leftBlocks: left, rightBlocks: right };
  }, [columnPages, spreadIndex, isFirstSpread]);

  const mobileBodyBlocks = useMemo(() => {
    if (mobilePageIndex < 2) return [] as Block[];
    return (columnPages[mobilePageIndex - 2] || []).map(parseBlock);
  }, [columnPages, mobilePageIndex]);

  const isFirstMobilePage = mobilePageIndex === 0;
  const isLastMobilePage = mobilePageIndex === mobileTotalPages - 1;

  // ── full chapter blocks (scroll view) — the whole chapter, unpaginated
  const fullChapterBlocks: Block[] = useMemo(() => {
    if (!chapter) return [];
    return chapterContent(chapter, lang).map(parseBlock);
  }, [chapter, lang]);

  // ── not found
  if (!chapter) {
    return (
      <div className={styles.notFound}>
        {lang === "en" ? "Chapter not found." : "Bölüm bulunamadı."}
      </div>
    );
  }

  const displayTitle = chapterTitle(chapter, lang);
  const alreadyRead = Boolean(progress?.chapterSlug && chapterIndex <= allChapters.findIndex((item) => item.slug === progress.chapterSlug));
  const toggleReadState = () => {
    const page = isMobile ? Math.floor(mobilePageIndex / 2) : spreadIndex;
    if (!alreadyRead) {
      void setProgress(chapter.slug, page);
      return;
    }
    const previousChapter = allChapters[chapterIndex - 1];
    if (previousChapter) void setProgress(previousChapter.slug, 0);
    else void clearProgress();
  };

  // ── shared top controls (language toggle, back link, view toggle) ──
  const topControls = (
    <>
      <div className={styles.readerControls}>
        <button
          type="button"
          className={styles.backLink}
          onClick={() => setChapterListOpen(true)}
          aria-expanded={chapterListOpen}
          aria-controls="chapter-list-panel"
        >
          ☰ {lang === "en" ? "Chapter list" : "Bölüm listesi"}
        </button>

        <div className={styles.langToggle}>
        <button
          type="button"
          className={`${fc.fcToggleBtn} ${styles.readStateButton}`}
          onClick={toggleReadState}
          aria-pressed={alreadyRead}
        >
          <span className={`${styles.readStateIcon} ${alreadyRead ? styles.readStateIconRead : styles.readStateIconUnread}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path className={styles.bookOutline} d="M4.5 4.5c2.8-.7 5.2-.25 7.5 1.35v13.2c-2.3-1.6-4.7-2.05-7.5-1.35V4.5Zm15 0c-2.8-.7-5.2-.25-7.5 1.35v13.2c2.3-1.6 4.7-2.05 7.5-1.35V4.5Z" />
              {alreadyRead
                ? <path className={styles.stateMark} d="m7.7 11.7 2.8 2.8 5.8-6" />
                : <path className={styles.stateMark} d="m8.4 8 7.2 7.2m0-7.2-7.2 7.2" />}
            </svg>
          </span>
          <span className={styles.readStateLabel}>
            {alreadyRead
              ? (lang === "en" ? "Mark as unread" : "Okunmadı işaretle")
              : (lang === "en" ? "Mark as read" : "Okundu işaretle")}
          </span>
        </button>
        <button
          className={fc.fcToggleBtn}
          onClick={toggleViewMode}
          aria-pressed={viewMode === "scroll"}
        >
          {viewMode === "book"
            ? (lang === "en" ? "Parchment" : "Parşömen")
            : (lang === "en" ? "Book" : "Kitap")}
        </button>
        <button
          className={[styles.langBtn, lang === "en" ? styles.langBtnActive : ""].filter(Boolean).join(" ")}
          onClick={() => selectLang("en")}
          aria-pressed={lang === "en"}
          title="The Common Tongue"
          aria-label="The Common Tongue"
        >
          EN
        </button>
        <button
          className={[styles.langBtn, lang === "tr" ? styles.langBtnActive : ""].filter(Boolean).join(" ")}
          onClick={() => selectLang("tr")}
          aria-pressed={lang === "tr"}
          title="Türkçe"
          aria-label="Türkçe"
        >
          TR
        </button>
        </div>
      </div>

      {chapterListOpen && (
        <div
          className={styles.chapterListOverlay}
          role="presentation"
          onClick={() => setChapterListOpen(false)}
        >
          <aside
            id="chapter-list-panel"
            className={styles.chapterListPanel}
            role="dialog"
            aria-modal="true"
            aria-label={lang === "en" ? "Chapter list" : "Bölüm listesi"}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.chapterListHeader}>
              <div>
                <span className={styles.chapterListKicker}>
                  {lang === "en" ? "The Chronicle" : "Kronik"}
                </span>
                <h2>{lang === "en" ? "Chapter list" : "Bölüm listesi"}</h2>
              </div>
              <button
                type="button"
                className={styles.chapterListClose}
                onClick={() => setChapterListOpen(false)}
                aria-label={lang === "en" ? "Close chapter list" : "Bölüm listesini kapat"}
              >
                ×
              </button>
            </div>
            <ol className={styles.chapterList}>
              {allChapters.map((item, index) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    className={`${styles.chapterListItem} ${item.slug === chapter.slug ? styles.chapterListItemActive : ""}`}
                    onClick={() => goChapter(item.slug)}
                  >
                    <span className={styles.chapterListNumber}>{String(index + 1).padStart(2, "0")}</span>
                    <span>{chapterTitle(item, lang)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
    </>
  );

  // ════════════════ SCROLL VIEW (full chapter, single page) ════════════════
  if (viewMode === "scroll") {
    return (
      <>
        {topControls}

        <div className={fc.fcScene}>
          <article className={fc.fcParchment}>
          <div className={fc.fcSeal} aria-hidden>
            <span className={fc.fcSealGlyph}>✦</span>
          </div>

          <header className={fc.fcHeader}>
            {chapter.image && (
              <div className={fc.fcImageWrap}>
                <ChapterCover
                  key={chapter.image}
                  src={chapter.image}
                  alt={displayTitle}
                  width={480}
                  height={280}
                  className={fc.fcImage}
                  priority
                />
              </div>
            )}
            <div className={fc.fcEyebrow}>
              {lang === "en" ? "A Song of Fire & Blood" : "Ateş ve Kanın Şarkısı"}
            </div>
            <h1 className={fc.fcTitle}>{displayTitle}</h1>
            <div className={fc.fcDivider}>✦</div>
            <p className={fc.fcSynopsis}>{chapterSynopsis(chapter, lang)}</p>
          </header>

          <div className={fc.fcBody}>
            {renderFullChapterBlocks(fullChapterBlocks)}
          </div>

          <footer className={fc.fcFooter}>
            {prevChapter ? (
              <button
                className={fc.fcFooterLink}
                onClick={() => goChapter(prevChapter.slug)}
              >
                ← {chapterTitle(prevChapter as Chapter, lang)}
              </button>
            ) : (
              <span className={fc.fcFooterLinkDisabled}>—</span>
            )}

            <button className={fc.fcBackToBook} onClick={toggleViewMode}>
              {lang === "en" ? "Book" : "Kitap"}
            </button>

            {nextChapter ? (
              <button
                className={fc.fcFooterLink}
                onClick={() => goChapter(nextChapter.slug)}
              >
                {chapterTitle(nextChapter as Chapter, lang)} →
              </button>
            ) : (
              <span className={fc.fcFooterLinkDisabled}>—</span>
            )}
          </footer>
          </article>
        </div>
        <ChapterCompanion chapterSlug={chapter.slug} />
      </>
    );
  }

  // ════════════════ BOOK VIEW (page-flip, default) ════════════════
  return (
    <>
      {topControls}

      <div className={styles.scene}>
        <div
          ref={rulerRef}
          aria-hidden
          className={styles.paginationRuler}
        />

        {isMobile ? (
          <div className={[styles.book, styles.mobileBook].join(" ")}>
            <div
              className={[
                styles.mobilePage,
                turning === "next" ? styles.turningNext : "",
                turning === "prev" ? styles.turningPrev : "",
              ].filter(Boolean).join(" ")}
            >
              <div className={styles.pageTexture} />

              {mobilePageIndex === 0 ? (
                <div className={styles.pageContent} ref={pageAreaRef}>
                  <div className={styles.chapterHeader}>
                    {chapter.image && (
                      <div className={styles.chapterImageWrap}>
                        <ChapterCover
                          key={chapter.image}
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
              ) : mobilePageIndex === 1 ? (
                <div className={styles.synopsisBlock} ref={pageAreaRef}>
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
                <div className={styles.pageContent} ref={pageAreaRef}>
                  {renderBlocks(mobileBodyBlocks)}
                </div>
              )}

              <div className={styles.mobilePageFooter}>
                <span className={styles.pageNumForm}>
                  {lang === "en"
                    ? `Page ${mobilePageIndex + 1} of ${mobileTotalPages}`
                    : `Sayfa ${mobilePageIndex + 1} / ${mobileTotalPages}`}
                </span>
              </div>

              <button
                type="button"
                className={[
                  styles.pageCorner,
                  styles.pageCornerLeft,
                  isFirstMobilePage && !prevChapter ? styles.pageCornerDisabled : "",
                ].filter(Boolean).join(" ")}
                onClick={() => {
                  if (isFirstMobilePage) {
                    if (prevChapter) goChapter(prevChapter.slug);
                  } else {
                    goPrevMobilePage();
                  }
                }}
                aria-label={
                  isFirstMobilePage
                    ? (lang === "en" ? "Previous chapter" : "Önceki bölüm")
                    : (lang === "en" ? "Previous page" : "Önceki sayfa")
                }
              />

              <button
                type="button"
                className={[
                  styles.pageCorner,
                  styles.pageCornerRight,
                  isLastMobilePage && !nextChapter ? styles.pageCornerDisabled : "",
                ].filter(Boolean).join(" ")}
                onClick={() => {
                  if (isLastMobilePage) {
                    if (nextChapter) goChapter(nextChapter.slug);
                  } else {
                    goNextMobilePage();
                  }
                }}
                aria-label={
                  isLastMobilePage
                    ? (lang === "en" ? "Next chapter" : "Sonraki bölüm")
                    : (lang === "en" ? "Next page" : "Sonraki sayfa")
                }
              />
            </div>
          </div>
        ) : (
          <div className={styles.book}>
            <div className={styles.spine}>
              <span className={styles.spineTitle}>{displayTitle}</span>
            </div>

            <div
              className={[
                styles.spread,
                turning === "next" ? styles.turningNext : "",
                turning === "prev" ? styles.turningPrev : "",
              ].filter(Boolean).join(" ")}
            >
              <div className={styles.pageLeft}>
                <div className={styles.pageTexture} />

                {isFirstSpread ? (
                  <div className={styles.pageContent} ref={pageAreaRef}>
                    <div className={styles.chapterHeader}>
                      {chapter.image && (
                        <div className={styles.chapterImageWrap}>
                          <ChapterCover
                            key={chapter.image}
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

              <div className={styles.gutter} aria-hidden />

              <div className={styles.pageRight}>
                <div className={styles.pageTexture} />

                {isFirstSpread ? (
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
                  <div className={styles.pageContentRight}>
                    {renderBlocks(rightBlocks)}
                  </div>
                )}

                <div className={styles.pageFooterRight}>
                  <span className={styles.pageNumForm}>
                    {lang === "en"
                      ? `Page ${spreadIndex * 2 + 2} of ${totalPages}`
                      : `Sayfa ${spreadIndex * 2 + 2} / ${totalPages}`}
                  </span>
                </div>

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
          </div>
        )}
      </div>
      <ChapterCompanion chapterSlug={chapter.slug} />
    </>
  );
}
