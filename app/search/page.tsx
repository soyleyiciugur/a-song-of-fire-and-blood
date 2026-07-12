// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\search\page.tsx
import Link from "next/link";

import MiniPortrait from "@/components/MiniPortrait";
import SigilImage from "@/components/SigilImage";
import { searchIndex, type SearchResult } from "@/lib/search";

import styles from "./search.module.css";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  character: "Characters",
  chapter: "Chapters",
  house: "Houses",
  dragon: "Dragons",
};

const TYPE_ORDER: SearchResult["type"][] = ["character", "chapter", "house", "dragon"];

// A small wax-seal medallion with the chapter number pressed into it — the
// same raven-letter/seal motif used for correspondence across Westeros.
// Unlike a Roman numeral, an Arabic number stays legible at any chapter
// count, so the font just steps down a size as the digit count grows.
// The number is a plain HTML span centered with flexbox on top of the SVG
// seal, rather than SVG <text> — SVG baseline centering is font/browser
// dependent and drifted for some digits, flexbox centering is exact.
function ChapterThumb({ number }: { number: number }) {
  const digits = String(number).length;
  const fontSize = digits <= 1 ? 15 : digits === 2 ? 13 : digits === 3 ? 10.5 : 8.5;

  return (
    <div className={styles.chapterThumb}>
      <svg viewBox="0 0 44 44" width={44} height={44}>
        {/* drip at the base of the seal */}
        <ellipse cx="22" cy="35" rx="5" ry="4" fill="#5c0f14" />
        {/* main wax body */}
        <circle cx="22" cy="21" r="17" fill="#7a1620" />
        <circle cx="22" cy="21" r="17" fill="none" stroke="#4a0d12" strokeWidth="1.5" />
        {/* pressed inner rim, like a seal stamp impression */}
        <circle cx="22" cy="21" r="13" fill="none" stroke="var(--gold)" strokeWidth="1" opacity="0.7" />
        {/* subtle highlight for a molded, glossy wax look */}
        <ellipse cx="17" cy="15" rx="6" ry="4" fill="#a53442" opacity="0.35" />
      </svg>
      <span
        className={styles.chapterThumbNumber}
        style={{ fontSize }}
      >
        {number}
      </span>
    </div>
  );
}

function renderThumbnail(item: SearchResult) {
  if (!item.thumbnail) return null;

  if (item.thumbnail.kind === "character") {
    return <MiniPortrait id={item.id} alt={item.thumbnail.alt} size={44} />;
  }

  if (item.thumbnail.kind === "house") {
    return (
      <SigilImage
        src={item.thumbnail.src}
        alt={item.thumbnail.alt}
        size={44}
        shape="rounded"
      />
    );
  }

  if (item.thumbnail.kind === "chapter") {
    return <ChapterThumb number={item.thumbnail.number} />;
  }

  return (
    <div className={styles.dragonThumb}>
      <img src={item.thumbnail.src} alt={item.thumbnail.alt} width={44} height={44} />
    </div>
  );
}

function groupResults(results: SearchResult[]) {
  const groups = new Map<SearchResult["type"], SearchResult[]>();

  for (const type of TYPE_ORDER) groups.set(type, []);

  for (const result of results) {
    groups.get(result.type)?.push(result);
  }

  return TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: groups.get(type) ?? [],
  })).filter((group) => group.items.length > 0);
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  const results = searchIndex(q, 50);
  const grouped = groupResults(results);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Search</h1>

        <p className={styles.subheading}>
          {q ? (
            <>
              Results for <q>{q}</q>
            </>
          ) : (
            "Type something in the search bar above to look through the realm."
          )}
        </p>

        {q && grouped.length === 0 && (
          <p className={styles.empty}>
            Nothing in the records matches <q>{q}</q>.
          </p>
        )}

        <div className={styles.groups}>
          {grouped.map((group) => (
            <section key={group.type} className={styles.group}>
              <h2 className={styles.groupHeading}>{group.label}</h2>

              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={`${item.type}-${item.id}`}>
                    <Link href={item.href} className={styles.card}>
                      {item.thumbnail && (
                        <div className={styles.thumbnail}>{renderThumbnail(item)}</div>
                      )}

                      <div className={styles.cardText}>
                        <span className={styles.cardTitle}>{item.title}</span>

                        {item.subtitle && (
                          <span className={styles.cardSubtitle}>{item.subtitle}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}