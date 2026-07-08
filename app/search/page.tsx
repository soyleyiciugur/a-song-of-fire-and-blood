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
