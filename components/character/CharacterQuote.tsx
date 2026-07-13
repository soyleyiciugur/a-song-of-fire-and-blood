// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\character\CharacterQuote.tsx
import Link from "next/link";
import characters from "@/data/characters/characters.json";

type Quote = {
  text: string;
  note?: string | null; // Yeni alan eklendi
  speakerId?: string;
  speakerName: string;
  chapterSlug?: string;
  chapterTitle?: string;
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
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? 12 : 16 }}>
      {quotes.map((entry, index) => {
        const speakerHasProfile = Boolean(
          entry.speakerId &&
            (characters as { id: string }[]).some((c) => c.id === entry.speakerId)
        );
        const attribution = showAttribution && entry.speakerId ? (
          speakerHasProfile ? (
            <Link href={`/characters/${entry.speakerId}`} style={{ color: "var(--gold)", textDecoration: "none" }}>
              {entry.speakerName}
            </Link>
          ) : (
            <span style={{ color: "var(--text)", cursor: "default" }}>{entry.speakerName}</span>
          )
        ) : showAttribution ? (
          <span style={{ color: "var(--muted)" }}>{entry.speakerName}</span>
        ) : null;

        const hasChapter = Boolean(entry.chapterSlug && entry.chapterTitle);

        return (
          <blockquote
            key={`${entry.text}-${index}`}
            style={{
              margin: 0,
              padding: compact ? "16px 18px" : "20px 24px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontStyle: "italic",
                lineHeight: 1.8,
                color: "var(--text)",
                fontSize: compact ? 15 : 17,
              }}
            >
              <q>{entry.text}</q>
            </p>

            {/* NOT ALANI BURADA: Tırnak dışı ve alt satır */}
            {entry.note && (
              <small
                style={{
                  display: "block",
                  marginTop: 10,
                  color: "var(--muted)",
                  fontStyle: "normal",
                  fontSize: compact ? 13 : 14,
                }}
              >
                ({entry.note})
              </small>
            )}

            {(showAttribution && attribution) || hasChapter ? (
              <footer
                style={{
                  marginTop: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: showAttribution && attribution ? "flex-end" : "flex-start",
                  color: "var(--muted)",
                  fontSize: compact ? 13 : 14,
                  gap: 6,
                }}
              >
                {showAttribution && attribution ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>-</span>
                    {attribution}
                  </div>
                ) : null}
                {hasChapter ? (
                  <div style={{ fontSize: "0.9em" }}>
                    <Link href={`/chapters/${entry.chapterSlug}`} style={{ color: "var(--gold)", textDecoration: "none" }}>
                      {entry.chapterTitle}
                    </Link>
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