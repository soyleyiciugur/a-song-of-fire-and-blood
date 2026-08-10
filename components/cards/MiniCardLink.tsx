import Link from "next/link";
import styles from "./MiniCardLink.module.css";
import { CARD_TYPE_ICON, type Card } from "@/lib/cards";

export function MiniCardLink({ card }: { card: Card }) {
  return (
    <Link href={`/cards/${card.id}`} className={`${styles.mini} ${styles[card.tierId]}`}>
      <span className={styles.icon}>{CARD_TYPE_ICON[card.cardType]}</span>
      <span className={styles.name}>{card.name}</span>
    </Link>
  );
}