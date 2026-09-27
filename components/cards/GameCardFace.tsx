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
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (typeof document === "undefined") return null;
  return createPortal(<div className={styles.modalBackdrop} onMouseDown={onClose}>
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
        {(onPrev || onNext) && <div className={styles.modalNavigation}>
          <button type="button" onClick={onPrev} disabled={!onPrev}>Previous</button>
          <button type="button" onClick={onNext} disabled={!onNext}>Next</button>
        </div>}
      </div>
    </article>
  </div>, document.body);
}
