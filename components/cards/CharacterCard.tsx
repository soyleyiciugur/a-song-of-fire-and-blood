"use client";

import styles from "./CharacterCard.module.css";
import { CARD_TYPE_ICON, type Card } from "@/lib/cards";

export function CharacterCard({
  card,
  onSelect,
}: {
  card: Card;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[card.tierId]}`}
      onClick={() => onSelect(card.id)}
    >
      <div className={styles.typeBadge}>{CARD_TYPE_ICON[card.cardType]}</div>
      <div className={styles.tierBadge}>
        {card.tierId.toUpperCase().replace("-PLUS", "+")}
      </div>

      <div className={styles.portrait} aria-hidden />

      <h3 className={styles.name}>{card.name}</h3>
      <p className={styles.subtitle}>{card.subtitle}</p>

      <div className={styles.statRow}>
        <span className={styles.stat}>⚔ {card.power}</span>
        <span className={styles.stat}>♛ {card.influence}</span>
      </div>

      {card.keywords.length > 0 && (
        <div className={styles.keywords}>
          {card.keywords.slice(0, 2).map((k) => (
            <span key={k} className={styles.keyword} title={k}>
              {k}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}