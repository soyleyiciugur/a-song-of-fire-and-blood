// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\scroll\ScrollDisplay.tsx
import Link from "next/link";
import type { Scroll } from "@/types/scroll";
import styles from "./scroll.module.css";

interface ScrollDisplayProps {
  scroll: Scroll;
  relatedCharacters?: { id: string; name: string }[];
}

export default function ScrollDisplay({
  scroll,
  relatedCharacters = [],
}: ScrollDisplayProps) {
  const paragraphs = scroll.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const [firstParagraph, ...restParagraphs] = paragraphs;
  const [dropCap, ...restOfFirst] = firstParagraph ?? [""];

  return (
    <div className={styles.scrollOuter}>
      <div className={styles.rodTop} aria-hidden="true" />

      <article className={styles.parchment}>
        <div className={styles.sealBadge} aria-hidden="true">
          <span className={styles.sealGlyph}>
            {"🔗"}
          </span>
        </div>

        <header className={styles.header}>
          <p className={styles.category}>{scroll.category}</p>
          <h1 className={styles.title}>{scroll.title}</h1>
          {scroll.subtitle && (
            <p className={styles.subtitle}>{scroll.subtitle}</p>
          )}
          <div className={styles.divider} aria-hidden="true">
            ✦
          </div>
          <p className={styles.byline}>
            {scroll.author}
            {scroll.authorTitle && (
              <span className={styles.authorTitle}>
                , {scroll.authorTitle}
              </span>
            )}
          </p>
        </header>

        <div className={styles.body}>
          {firstParagraph && (
            <p>
              <span className={styles.dropCap}>{dropCap}</span>
              {restOfFirst.join("")}
            </p>
          )}
          {restParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {(relatedCharacters.length > 0 || scroll.relatedHouses.length > 0) && (
          <footer className={styles.references}>
            <p className={styles.referencesLabel}>Referenced within</p>
            <ul className={styles.referencesList}>
              {scroll.relatedHouses.map((houseId) => (
                <li key={houseId} className={styles.referenceHouse}>
                  <Link href={`/houses/${houseId}`}>
                    {/* Capitalizes the first letter, e.g., "targaryen" -> "House Targaryen" */}
                    House {houseId.charAt(0).toUpperCase() + houseId.slice(1)}
                  </Link>
                </li>
              ))}
              {relatedCharacters.map((character) => (
                <li key={character.id}>
                  <Link href={`/characters/${character.id}`}>
                    {character.name}
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </article>

      <div className={styles.rodBottom} aria-hidden="true" />
    </div>
  );
}
