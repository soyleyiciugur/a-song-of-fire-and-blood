import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllCards, getCardById, getCardsByIds, getTiers, CARD_TYPE_ICON } from "@/lib/cards";
import { MiniCardLink } from "@/components/cards/MiniCardLink";
import styles from "./page.module.css";

export function generateStaticParams() {
  return getAllCards().map((c) => ({ cardId: c.id }));
}

export default function CardDetailPage({ params }: { params: { cardId: string } }) {
  const card = getCardById(params.cardId);
  if (!card) return notFound();

  const tier = getTiers().find((t) => t.id === card.tierId);
  const nemesisCards = getCardsByIds(card.nemesis);
  const allyCards = getCardsByIds(card.allies);

  return (
    <div className={styles.wrapper}>
      <Link href="/cards" className={styles.backLink}>
        ← Back to Tier List
      </Link>

      <div className={`${styles.detailCard} ${styles[card.tierId]}`}>
        <div className={styles.header}>
          <span className={styles.typeBadge}>
            {CARD_TYPE_ICON[card.cardType]} {card.cardType.toUpperCase()}
          </span>
          <span className={styles.tierBadge}>
            {tier?.label ?? card.tierId}
          </span>
        </div>

        <div className={styles.portrait} aria-hidden />

        <h1 className={styles.name}>{card.name}</h1>
        <p className={styles.subtitle}>{card.subtitle}</p>

        <div className={styles.statBlock}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Power</span>
            <span className={styles.statValue}>{card.power}</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Influence</span>
            <span className={styles.statValue}>{card.influence}</span>
          </div>
        </div>

        <div className={styles.keywords}>
          {card.keywords.map((k) => (
            <span key={k} className={styles.keyword}>{k}</span>
          ))}
        </div>

        {card.flavorQuote && (
          <blockquote className={styles.quote}>&ldquo;{card.flavorQuote}&rdquo;</blockquote>
        )}

        {card.abilities.length > 0 && (
          <div className={styles.section}>
            <h2>Abilities</h2>
            {card.abilities.map((ab) => (
              <div key={ab.name} className={styles.ability}>
                <strong>{ab.name}</strong>
                <p>{ab.description}</p>
              </div>
            ))}
          </div>
        )}

        {nemesisCards.length > 0 && (
          <div className={styles.section}>
            <h2>Nemesis</h2>
            <div className={styles.relRow}>
              {nemesisCards.map((c) => <MiniCardLink key={c.id} card={c} />)}
            </div>
          </div>
        )}

        {allyCards.length > 0 && (
          <div className={styles.section}>
            <h2>Allies</h2>
            <div className={styles.relRow}>
              {allyCards.map((c) => <MiniCardLink key={c.id} card={c} />)}
            </div>
          </div>
        )}

        {card.linkedCharacterId && (
          <Link href={`/characters/${card.linkedCharacterId}`} className={styles.characterLink}>
            View Full Character Profile →
          </Link>
        )}
      </div>
    </div>
  );
}