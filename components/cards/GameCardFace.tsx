"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { GameCard } from "@/lib/the-great-game/types";
import { useDeckFront } from "@/components/cards/useDeckFront";
import styles from "@/app/cards/decks/decks.module.css";

const labels: Record<GameCard["cardType"], string> = {
  character: "Characters", dragon: "Dragons", event: "Events", artifact: "Artifacts", location: "Locations",
};
const titleCase = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase()).replaceAll("-", " ");
const tierLabel = (card: GameCard) => card.tierId === "s-plus" ? "S+" : card.tierId.toUpperCase();
const tierColors: Record<string, [string, string]> = {
  "s-plus": ["#8b1e2b", "#d4af37"], s: ["#4b2e6f", "#c0c0c0"],
  a: ["#2f4a3e", "#a97142"], b: ["#3d3d3d", "#8c8c8c"], c: ["#5c4a3a", "#7a6a58"],
};
const tierStyle = (card: GameCard) => ({
  "--tier-color": tierColors[card.tierId][0],
  "--tier-accent": tierColors[card.tierId][1],
}) as React.CSSProperties;
const traitRules: Record<string, string> = {
  dragonrider: "This Character is bonded to a specific Dragon. That Dragon's Bond discount applies while its rider is under your control.",
  guard: "Enemy units must face Ready Guard units before attacking other Military targets or Standing.",
  intrigue: "While this Character is Ready, normal Political attackers must choose a Ready Intrigue Character as the defender.",
  swift: "This unit may initiate a Military Conflict on the turn it is deployed.",
  schemer: "This Character may initiate a Political Conflict on the turn it is deployed.",
  challenge: "This unit may ignore Guard when choosing a Military target.",
  confront: "This Character may ignore Intrigue priority and choose any Ready enemy Character as the Political defender.",
};

function RuleTooltip({ label, rule, className }: { label: string; rule: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [open, setOpen] = useState(false);
  const show = () => {
    const bounds = ref.current?.getBoundingClientRect();
    if (bounds) setPosition({ left: bounds.left + bounds.width / 2, top: bounds.top - 8 });
    setOpen(true);
  };
  return <>
    <span ref={ref} className={className} tabIndex={0} onMouseEnter={show} onMouseLeave={() => setOpen(false)} onFocus={show} onBlur={() => setOpen(false)}>{label}</span>
    {open && position && typeof document !== "undefined" && createPortal(
      <span className={styles.ruleTooltipPortal} role="tooltip" style={position}>{rule}</span>, document.body
    )}
  </>;
}

function CommandSigil({ value }: { value: number }) {
  return <svg viewBox="0 0 44 44" aria-hidden><path className={styles.commandBadgePlate} d="M13 2h18l11 11v18L31 42H13L2 31V13Z"/><path className={styles.commandBadgeInset} d="M15 6h14l9 9v14l-9 9H15l-9-9V15Z"/><path className={styles.commandBadgeRune} d="M22 10.5 26.2 18 33.5 22l-7.3 4L22 33.5 17.8 26 10.5 22l7.3-4Z"/><text className={styles.commandCostText} x="22" y="21.6" textAnchor="middle" dominantBaseline="central">{value}</text></svg>;
}

export function GameCardArt({ card, className }: { card: GameCard; className: string }) {
  const bases = [`/images/cards/${card.id}`];
  if (card.cardType === "character") bases.push(`/images/characters/${card.linkedCharacterId ?? card.id}`);
  if (card.cardType === "dragon") bases.push(`/images/dragons/${card.id}`);
  const sources = bases.map((base) => `${base}.webp`);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [card.id]);
  const deckFront = useDeckFront(index >= sources.length);
  return index < sources.length || deckFront
    ? <img src={sources[index] ?? deckFront ?? ""} alt="" className={className} onError={() => { if (index < sources.length) setIndex((value) => value + 1); }} />
    : <div className={`${styles.artFallback} ${className}`} aria-hidden>✦</div>;
}

export function GameCardFace({ card, onSelect, actions }: { card: GameCard; onSelect: (id: string) => void; actions?: ReactNode }) {
  return <article className={styles.card} data-tier={card.tierId} style={tierStyle(card)}>
    <button type="button" className={styles.cardMain} onClick={() => onSelect(card.id)} aria-label={`View ${card.name} card`}>
      <GameCardArt card={card} className={styles.cardArt} />
      <div className={styles.cardShade} />
      <span className={styles.cost} title="Command Cost"><CommandSigil value={card.cost} /></span>
      <span className={styles.tierBadge}>{tierLabel(card)}</span>
      {card.traits.includes("unique") && <span className={styles.uniqueMark} title="Unique">◆</span>}
      <div className={styles.cardText}>
        <span className={styles.cardType}>{labels[card.cardType]}</span>
        <h3>{card.name}</h3>{card.subtitle && <small>{card.subtitle}</small>}
        {(card.cardType === "character" || card.cardType === "dragon") && <div className={styles.stats}>
          <span><b>{card.power}</b> PWR</span>
          {card.cardType === "character" && <span><b>{card.influence}</b> INF</span>}
          <span><b>{card.health}</b> HP</span>
        </div>}
        <div className={styles.traits}>{card.traits.filter((trait) => !["unique", "dragon"].includes(trait)).slice(0, 3).map((trait) => <span key={trait}>{titleCase(trait)}</span>)}</div>
        {card.abilities[0] && <p><strong><span>{titleCase(card.abilities[0].trigger)}</span>{card.abilities[0].name}</strong>{card.abilities[0].text}</p>}
      </div>
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
  return <div className={styles.modalBackdrop} onMouseDown={onClose}>
    <article className={styles.modal} role="dialog" aria-modal="true" aria-label={card.name} onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Close card details">×</button>
      <div className={styles.modalArtWrap} style={tierStyle(card)}>
        <GameCardArt card={card} className={styles.modalArt} />
        <div className={styles.modalShade} />
        <span className={`${styles.cost} ${styles.modalCost}`}><CommandSigil value={card.cost} /></span>
        <span className={`${styles.tierBadge} ${styles.modalTierBadge}`}>{tierLabel(card)}</span>
        {card.traits.includes("unique") && <RuleTooltip label="◆" rule="Unique — You cannot play another copy of this card while one is already in play under your control." className={styles.uniqueMark} />}
      </div>
      <div className={styles.modalContent}>
        <span className={styles.kicker}>{labels[card.cardType]} · {tierLabel(card)}</span>
        <h2>{card.name}</h2>{card.subtitle && <p className={styles.subtitle}>{card.subtitle}</p>}
        {(card.cardType === "character" || card.cardType === "dragon") && <div className={styles.modalStats}>
          <span><b>{card.power}</b><small>Power</small></span>
          {card.cardType === "character" && <span><b>{card.influence}</b><small>Influence</small></span>}
          <span><b>{card.health}</b><small>Health</small></span>
        </div>}
        <div className={styles.modalTraits}>{card.traits.filter((trait) => !["unique", "dragon"].includes(trait)).map((trait) => traitRules[trait]
          ? <RuleTooltip key={trait} label={titleCase(trait)} rule={traitRules[trait]} />
          : <span key={trait}>{titleCase(trait)}</span>)}{card.houseId && <span>{titleCase(card.houseId)}</span>}</div>
        <div className={styles.abilities}>{card.abilities.length ? card.abilities.map((ability) => <section key={ability.id}><span>{titleCase(ability.trigger)}</span><h3>{ability.name}</h3><p>{ability.text}</p></section>) : <p>No special ability.</p>}</div>
        {"balanceStatus" in card && card.balanceStatus === "provisional" && <div className={styles.provisional}>Balance values are provisional.</div>}
        {card.deckable === false && <div className={styles.provisional}>Non-deckable card</div>}
        {action}
        {(onPrev || onNext) && <div className={styles.modalNavigation}>
          <button type="button" onClick={onPrev} disabled={!onPrev}>Previous</button>
          <button type="button" onClick={onNext} disabled={!onNext}>Next</button>
        </div>}
      </div>
    </article>
  </div>;
}
