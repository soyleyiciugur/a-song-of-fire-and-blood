"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./CharacterCard.module.css";
import { CARD_TYPE_ICON, type Card } from "@/lib/cards";

const EXTS = ["webp", "png", "jpg", "jpeg"];

function usePortrait(card: Card) {
  const [extIndex, setExtIndex] = useState(0);

  // Character cards use character portraits.
  // All other card types use dedicated card artwork.
  const folder = card.cardType === "character" ? "characters" : "cards";

  const imageId =
    card.cardType === "character"
      ? (card.linkedCharacterId ?? card.id)
      : card.id;

  const src = `/images/${folder}/${imageId}.${EXTS[extIndex]}`;

  const onError =
    extIndex < EXTS.length - 1
      ? () => setExtIndex((i) => i + 1)
      : undefined;

  return { src, onError };
}

export function CharacterCard({
  card,
  onSelect,
}: {
  card: Card;
  onSelect: (id: string) => void;
}) {
  const { src, onError } = usePortrait(card);

  return (
    <button
      type="button"
      className={`${styles.card} ${styles[card.tierId]}`}
      onClick={() => onSelect(card.id)}
    >
      {/* Badges sit above portrait via z-index */}
      <span className={styles.typeBadge}>
        {CARD_TYPE_ICON[card.cardType]}
      </span>

      <span className={styles.tierBadge}>
        {card.tierId.toUpperCase().replace("-PLUS", "+")}
      </span>

      <div className={styles.portrait}>
        <Image
          src={src}
          alt={card.name}
          fill
          sizes="(max-width: 768px) 50vw, 220px"
          style={{
            objectFit: "cover",
            objectPosition: "top center",
          }}
          onError={onError}
        />

        <div className={styles.portraitFade} />
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.name}>{card.name}</h3>

        <p className={styles.subtitle}>{card.subtitle}</p>

        <div className={styles.statRow}>
          <span className={styles.stat}>⚔ {card.power}</span>
          <span className={styles.stat}>♛ {card.influence}</span>
        </div>

        {card.keywords.length > 0 && (
          <div className={styles.keywords}>
            {card.keywords.slice(0, 3).map((k) => (
              <span key={k} className={styles.keyword}>
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}