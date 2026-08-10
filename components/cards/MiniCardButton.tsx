"use client";

import styles from "./MiniCardButton.module.css";
import { CARD_TYPE_ICON, type Card } from "@/lib/cards";

export function MiniCardButton({
  card,
  onSelect,
}: {
  card: Card;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      className={`${styles.mini} ${styles[card.tierId]}`}
      onClick={() => onSelect(card.id)}
    >
      <span className={styles.icon}>{CARD_TYPE_ICON[card.cardType]}</span>
      <span className={styles.name}>{card.name}</span>
    </button>
  );
}