"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { GameCard } from "@/lib/the-great-game/types";
import { CardArtwork } from "./CardArtwork";
import { CardChrome, CardInfoPanel, tierStyle } from "./GameCardPrimitives";
import play from "@/app/cards/play/play.module.css";
import styles from "@/app/cards/decks/decks.module.css";

export { CardArtwork as GameCardArt } from "./CardArtwork";

export function GameCardFace({ card, onSelect, actions }: { card: GameCard; onSelect: (id: string) => void; actions?: ReactNode }) {
  return <article className={styles.catalogCard} data-tier={card.tierId} style={tierStyle(card)}>
    <button type="button" className={`${play.unitCard} ${play.standaloneCard}`} onClick={() => onSelect(card.id)}
      aria-label={`View ${card.name} card`} onContextMenu={event => event.preventDefault()}>
      <CardArtwork card={card} className={play.fullCardArtwork} />
      <CardChrome card={card} cost={card.cost} />
      <CardInfoPanel card={card} compact showTraitTooltips />
    </button>
    {actions}
  </article>;
}

export function GameCardModal({ card, onClose, onPrev, onNext, action }: { card: GameCard; onClose: () => void; onPrev?: () => void; onNext?: () => void; action?: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && onPrev) { event.preventDefault(); onPrev(); }
      if (event.key === "ArrowRight" && onNext) { event.preventDefault(); onNext(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);
  if (typeof document === "undefined") return null;
  return createPortal(<div className={`${styles.modalBackdrop} ${play.cardSurface}`} onMouseDown={onClose}>
    <div className={styles.modalFrame} onMouseDown={event => event.stopPropagation()}>
      {onPrev && <button type="button" className={`${styles.modalArrow} ${styles.modalArrowPrev}`} onClick={onPrev} aria-label="Previous card" title="Previous card"><span aria-hidden className={styles.chevronPrev} /></button>}
      {onNext && <button type="button" className={`${styles.modalArrow} ${styles.modalArrowNext}`} onClick={onNext} aria-label="Next card" title="Next card"><span aria-hidden className={styles.chevronNext} /></button>}
    <article className={`${styles.modal} ${styles.catalogModal}`} style={tierStyle(card)} role="dialog" aria-modal="true" aria-label={card.name} onMouseDown={event => event.stopPropagation()}>
      <button type="button" className={play.detailCornerClose} onClick={onClose} aria-label="Close card details">×</button>
      <div className={play.unitDetailCard}>
        <CardArtwork card={card} className={play.fullCardArtwork} />
        <CardChrome card={card} cost={card.cost} detailed />
      </div>
      <div className={play.unitDetailEffects}>
        <div className={play.detailExpandedInfo}><CardInfoPanel card={card} showTraitTooltips /></div>
        {card.abilities.slice(1).map(ability => <section className={styles.additionalAbility} key={ability.id}><h3>{ability.name}</h3><p>{ability.text}</p></section>)}
        {"balanceStatus" in card && card.balanceStatus === "provisional" && <div className={styles.provisional}>Balance values are provisional.</div>}
        {card.deckable === false && <div className={styles.provisional}>Non-deckable card</div>}
        {action}
      </div>
    </article>
    </div>
  </div>, document.body);
}
