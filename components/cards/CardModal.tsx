"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./CardModal.module.css";
import {
  CARD_TYPE_ICON,
  getCardById,
  getCardsByIds,
  getTiers,
} from "@/lib/cards";
import { MiniCardButton } from "./MiniCardButton";

const EXTS = ["webp", "png", "jpg", "jpeg"];

function usePortrait(id: string) {
  const [extIndex, setExtIndex] = useState(0);

  const src = `/images/characters/${id}.${EXTS[extIndex]}`;

  const onError =
    extIndex < EXTS.length - 1
      ? () => setExtIndex((i) => i + 1)
      : undefined;

  return { src, onError };
}

export function CardModal({
  cardId,
  onClose,
  onSelectCard,
}: {
  cardId: string;
  onClose: () => void;
  onSelectCard: (id: string) => void;
}) {
  const card = getCardById(cardId);

  const portraitId =
    card?.linkedCharacterId ??
    (card?.cardType === "character" ? card.id : "");

  const {
    src: portraitSrc,
    onError: portraitOnError,
  } = usePortrait(portraitId);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  if (!card) {
    return null;
  }

  const tier = getTiers().find((t) => t.id === card.tierId);
  const nemesisCards = getCardsByIds(card.nemesis);
  const allyCards = getCardsByIds(card.allies);

  return (
    <div
      className={`${styles.modal} ${styles[card.tierId]}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <div className={styles.header}>
        <span className={styles.typeBadge}>
          {CARD_TYPE_ICON[card.cardType]}{" "}
          {card.cardType.toUpperCase()}
        </span>

        <span className={styles.tierBadge}>
          {tier?.label ?? card.tierId}
        </span>
      </div>

      <div className={styles.portrait}>
        <Image
          src={portraitSrc}
          alt={card.name}
          fill
          sizes="480px"
          style={{ objectFit: "cover" }}
          onError={portraitOnError}
        />
      </div>

      <h2 className={styles.name}>{card.name}</h2>

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
          <span key={k} className={styles.keyword}>
            {k}
          </span>
        ))}
      </div>

      {card.flavorQuote && (
        <blockquote className={styles.quote}>
          &ldquo;{card.flavorQuote}&rdquo;
        </blockquote>
      )}

      {card.abilities.length > 0 && (
        <div className={styles.section}>
          <h3>Abilities</h3>

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
          <h3>Nemesis</h3>

          <div className={styles.relRow}>
            {nemesisCards.map((c) => (
              <MiniCardButton
                key={c.id}
                card={c}
                onSelect={onSelectCard}
              />
            ))}
          </div>
        </div>
      )}

      {allyCards.length > 0 && (
        <div className={styles.section}>
          <h3>Allies</h3>

          <div className={styles.relRow}>
            {allyCards.map((c) => (
              <MiniCardButton
                key={c.id}
                card={c}
                onSelect={onSelectCard}
              />
            ))}
          </div>
        </div>
      )}

      {card.linkedCharacterId && (
        <Link
          href={`/characters/${card.linkedCharacterId}`}
          className={styles.characterLink}
        >
          View Full Character Profile →
        </Link>
      )}
    </div>
  );
}