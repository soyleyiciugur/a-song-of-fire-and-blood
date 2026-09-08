import Link from "next/link";
import characters from "@/data/characters/characters.json";
import styles from "./characterContent.module.css";

type Quote = {
  text: string;
  note?: string | null;
  speakerId?: string;
  speakerName: string;
  chapterSlug?: string | null;
  chapterTitle?: string | null;
};

type Props = {
  quote?: Quote | Quote[];
  compact?: boolean;
  showAttribution?: boolean;
};

export default function CharacterQuote({
  quote,
  compact = false,
  showAttribution = false,
}: Props) {
  const quotes = Array.isArray(quote) ? quote : quote ? [quote] : [];

  if (!quotes.length) return null;

  return (
    <div className={styles.quoteStack}>
      {quotes.map((entry, index) => {
        const speakerHasProfile = Boolean(
          entry.speakerId &&
            (characters as { id: string }[]).some(
              (character) => character.id === entry.speakerId
            )
        );

        const attribution = showAttribution ? (
          entry.speakerId && speakerHasProfile ? (
            <Link
              href={`/characters/${entry.speakerId}`}
              className={styles.quoteLink}
            >
              {entry.speakerName}
            </Link>
          ) : (
            <span>{entry.speakerName}</span>
          )
        ) : null;

        const hasChapter = Boolean(entry.chapterSlug && entry.chapterTitle);

        return (
          <blockquote
            key={`${entry.text}-${index}`}
            className={styles.quoteCard}
          >
            <p
              className={`${styles.quoteText} ${
                compact ? styles.quoteTextCompact : ""
              }`}
            >
              <q>{entry.text}</q>
            </p>

            {entry.note && (
              <small className={styles.quoteNote}>({entry.note})</small>
            )}

            {(showAttribution && attribution) || hasChapter ? (
              <footer className={styles.quoteFooter}>
                {hasChapter ? (
                  <Link
                    href={`/chapters/${entry.chapterSlug}`}
                    className={styles.quoteLink}
                  >
                    {entry.chapterTitle}
                  </Link>
                ) : (
                  <span />
                )}

                {showAttribution && attribution ? (
                  <div className={styles.quoteAttribution}>
                    <span>—</span>
                    {attribution}
                  </div>
                ) : null}
              </footer>
            ) : null}
          </blockquote>
        );
      })}
    </div>
  );
}
