"use client";

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { getAllGameCards, findGameCard, isUnitCard } from "@/lib/the-great-game/cards";
import { buildChronicle, formatChronicleEntry, type ChronicleEvent } from "@/lib/the-great-game/chronicle";
import type { GameState, PlayerId } from "@/lib/the-great-game/types";
import { chronicleUnitStats, resolveChronicleEntity, type ChronicleEntityRef } from "@/lib/the-great-game/chronicle-entity";
import { getTraitHighlights } from "@/lib/the-great-game/trait-highlights";
import ChronicleIcon from "./ChronicleIcon";
import { CardArtwork } from "@/components/cards/CardArtwork";
import { CardChrome, CardInfoPanel, tierStyle } from "@/components/cards/GameCardPrimitives";
import { GameCardModal } from "@/components/cards/GameCardFace";
import play from "@/app/cards/play/play.module.css";
import styles from "./Chronicle.module.css";

const entities = [...getAllGameCards()].sort((a, b) => b.name.length - a.name.length);
const entityPattern = new RegExp(`(${entities.map(card => card.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}|\\bPlayer [12]\\b|[+−-]?\\d+(?:\\s*→\\s*-?\\d+)?(?: Command| Health| Strength| Influence| Standing)?)`, "g");
const byName = new Map(entities.map(card => [card.name, card]));

export default function Chronicle({ state, viewerId, onInspectUnit, onInspectHand }: {
  state: GameState; viewerId: PlayerId;
  onInspectUnit: (instanceId: string) => void;
  onInspectHand: (instanceId: string) => void;
}) {
  const events = useMemo(() => buildChronicle(state.log, viewerId), [state.log, viewerId]);
  const turns = useMemo(() => {
    const groups = new Map<number, ChronicleEvent[]>();
    for (const event of events) groups.set(event.turn, [...(groups.get(event.turn) ?? []), event]);
    if (!groups.has(state.turnNumber)) groups.set(state.turnNumber, []);
    return [...groups.entries()].sort(([a], [b]) => b - a).map(([turn, items]) => [turn,
      [...items].reverse().sort((a, b) => Number(!!a.commandRefill) - Number(!!b.commandRefill))] as const);
  }, [events, state.turnNumber]);
  const scroll = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const anchor = useRef<{ id: string; offset: number } | null>(null);
  const seen = useRef(new Set(events.map(event => event.id)));
  const mounted = useRef(false);
  const [unread, setUnread] = useState(0);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState<{ ref: ChronicleEntityRef; anchor: { left: number; right: number; top: number } } | null>(null);
  const previewElement = useRef<HTMLElement>(null);
  const [modal, setModal] = useState<ChronicleEntityRef | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = (id: PlayerId) => id === viewerId ? "YOU" : "OPPONENT";

  useLayoutEffect(() => {
    const element = previewElement.current;
    if (!element || !preview) return;
    const place = () => {
      const viewport = window.visualViewport;
      const leftEdge = (viewport?.offsetLeft ?? 0) + 12;
      const topEdge = (viewport?.offsetTop ?? 0) + 12;
      const width = viewport?.width ?? window.innerWidth;
      const height = viewport?.height ?? window.innerHeight;
      element.style.maxWidth = `${Math.max(1, width - 24)}px`;
      element.style.maxHeight = `${Math.max(1, height - 24)}px`;
      const size = element.getBoundingClientRect();
      const preferred = preview.anchor.left - size.width - 12;
      const x = preferred >= leftEdge ? preferred : preview.anchor.right + 12;
      element.style.left = `${Math.max(leftEdge, Math.min(x, leftEdge + width - 24 - size.width))}px`;
      element.style.top = `${Math.max(topEdge, Math.min(preview.anchor.top, topEdge + height - 24 - size.height))}px`;
      element.style.visibility = "visible";
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener("resize", place);
    window.visualViewport?.addEventListener("resize", place);
    window.visualViewport?.addEventListener("scroll", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("resize", place);
      window.visualViewport?.removeEventListener("scroll", place);
    };
  }, [preview]);

  useLayoutEffect(() => {
    const newEvents = events.filter(event => !seen.current.has(event.id));
    seen.current = new Set(events.map(event => event.id));
    const wasMounted = mounted.current;
    mounted.current = true;
    const element = scroll.current;
    if (element) {
      if (pinned.current) element.scrollTop = 0;
      else if (anchor.current) {
        const row = element.querySelector<HTMLElement>(`[data-chronicle-event="${anchor.current.id}"]`);
        if (row) element.scrollTop += row.getBoundingClientRect().top - element.getBoundingClientRect().top - anchor.current.offset;
      }
    }
    const frame = requestAnimationFrame(() => {
      if (newEvents.length && wasMounted) {
        setFresh(new Set(newEvents.map(event => event.id)));
        if (!pinned.current) setUnread(count => count + newEvents.length);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [events]);
  useEffect(() => {
    if (!fresh.size) return;
    const timer = setTimeout(() => setFresh(new Set()), 1400);
    return () => clearTimeout(timer);
  }, [fresh]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setPreview(null); setModal(null); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  function show(ref: ChronicleEntityRef, element: HTMLElement) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const rect = element.getBoundingClientRect();
    setPreview({ ref, anchor: { left: rect.left, right: rect.right, top: rect.top } });
  }
  function hide() { closeTimer.current = setTimeout(() => setPreview(null), 150); }
  function inspect(ref: ChronicleEntityRef) {
    setPreview(null);
    const live = resolveChronicleEntity(state, viewerId, ref);
    if (live.units.length === 1) onInspectUnit(live.units[0].instanceId);
    else if (live.hand.length === 1) onInspectHand(live.hand[0].instanceId);
    else setModal(ref);
  }
  function rich(text: string, event?: ChronicleEvent, explicit?: ChronicleEntityRef): ReactNode {
    const occurrences = new Map<string, number>();
    return text.split(entityPattern).map((part, index) => {
      const card = byName.get(part);
      if (card) {
        const metadata = event?.entries.find(entry => entry.chronicle?.kind)?.chronicle;
        const occurrence = occurrences.get(card.id) ?? 0;
        occurrences.set(card.id, occurrence + 1);
        const source = metadata?.sourceCardId === card.id && (metadata.targetCardId !== card.id || occurrence === 0);
        const target = metadata?.targetCardId === card.id && !source;
        const ref: ChronicleEntityRef = explicit ?? { cardId: card.id,
          instanceId: source ? metadata?.sourceInstanceId : target ? metadata?.targetInstanceId : undefined,
          playerId: target && metadata?.kind === "conflict" && event?.playerId ? event.playerId === "player1" ? "player2" : "player1" : event?.playerId };
        return <button key={index} type="button" className={styles.entity} data-entity-instance={ref.instanceId}
          onMouseEnter={event => show(ref, event.currentTarget)} onMouseLeave={hide}
          onFocus={event => show(ref, event.currentTarget)} onBlur={hide}
          onClick={() => inspect(ref)} aria-label={`Preview ${card.name}`}>{part}</button>;
      }
      if (/^Player [12]$/.test(part)) return <span key={index} className={styles.actor}>{label(part === "Player 1" ? "player1" : "player2")}</span>;
      if (/^[+−-]?\d/.test(part)) return <strong className={styles.value} key={index}>{part}</strong>;
      return <Fragment key={index}>{part}</Fragment>;
    });
  }
  function changes(event: ChronicleEvent, selected = event.changes) {
    return selected.map((change, index) => <div key={`${change.instanceId}-${change.stat}-${index}`} className={styles.delta}>
      <span>{change.cardId ? rich(findGameCard(change.cardId)?.name ?? "Card", event, { cardId: change.cardId, instanceId: change.instanceId, playerId: change.playerId }) : label(change.playerId)} <span className={styles.meta}>{change.stat}</span></span>
      <span className={styles.value}>{change.before} → {change.after} <small className={change.after > change.before ? styles.gain : styles.loss}>{change.after > change.before ? "+" : "−"}{Math.abs(change.after - change.before)}</small></span>
    </div>);
  }
  function row(event: ChronicleEvent) {
    const children = event.entries.filter(entry => entry.id !== event.id).map(formatChronicleEntry).filter((entry): entry is ChronicleEvent => !!entry);
    const affected = new Set(event.changes.filter(change => change.instanceId).map(change => change.instanceId)).size;
    const isConflict = event.icon === "military" || event.icon === "political";
    const highlighted = isConflict ? event.changes.filter(change => change.stat === "Health" || change.stat === "Standing") : event.changes.length <= 2 ? event.changes : [];
    const remaining = event.changes.filter(change => !highlighted.includes(change));
    return <article key={event.id} data-chronicle-event={event.id} className={`${styles.event} ${styles[event.level]} ${fresh.has(event.id) ? styles.fresh : ""}`}>
      <span className={styles.icon} aria-hidden="true"><ChronicleIcon kind={event.icon} /></span>
      <div className={styles.body}>
        <div className={styles.eventHeading}><span>{rich(event.title, event)}</span>{event.playerId && <small className={styles.actor}>{label(event.playerId)}</small>}</div>
        {event.detail && <div className={styles.description}>{rich(event.detail, event)}</div>}
        {changes(event, highlighted)}
        {children.filter(child => child.icon === "death" || child.icon === "location" && /active Location/.test(child.detail) || child.icon === "artifact" && /^Equipped/.test(child.detail)).map(child => <div key={`outcome-${child.id}`} className={styles.outcome}><span className={styles.icon}><ChronicleIcon kind={child.icon} /></span> {rich(child.title, event)} · {rich(child.detail, event)}</div>)}
        {(children.length > 0 || remaining.length > 0) && <details className={styles.resolution}>
          <summary>{affected ? `${affected} ${affected === 1 ? "unit" : "units"} affected` : `${children.length} ${children.length === 1 ? "effect" : "effects"}`} <span aria-hidden="true">▾</span></summary>
          {remaining.length > 0 && <div className={styles.changes}><div className={styles.meta}>Resolution · net stat changes</div>{changes(event, remaining)}</div>}
          {children.map(child => <div key={child.id} className={styles.child}><span className={styles.icon} aria-hidden="true"><ChronicleIcon kind={child.icon} /></span><div>{rich(child.title, event)}{child.detail && <div className={styles.description}>{rich(child.detail, event)}</div>}</div></div>)}
        </details>}
      </div>
    </article>;
  }
  return <section className={`${play.logSection} ${styles.panel}`} aria-label="Chronicle">
    <div className={play.sectionTitle}>Chronicle</div>
    <div ref={scroll} className={`${play.log} ${styles.scroll}`} tabIndex={0} aria-label="Match history"
      onScroll={() => {
        const element = scroll.current;
        if (!element) return;
        pinned.current = element.scrollTop < 24;
        const top = element.getBoundingClientRect().top;
        const row = Array.from(element.querySelectorAll<HTMLElement>("[data-chronicle-event]")).find(item => item.getBoundingClientRect().bottom > top);
        anchor.current = row ? { id: row.dataset.chronicleEvent!, offset: row.getBoundingClientRect().top - top } : null;
        if (pinned.current) setUnread(0);
        setPreview(null);
      }}>
      {turns.map(([turn, turnEvents]) => <details key={turn} className={`${styles.turn} ${turn === state.turnNumber ? styles.current : ""}`} open>
        <summary className={styles.turnHeading}><span>{turn === 0 ? "Opening" : `Turn ${turn}`}</span><small>{(turnEvents[0]?.turnOwnerId ?? (turn === state.turnNumber ? state.activePlayerId : undefined)) === viewerId ? "YOUR TURN" : (turnEvents[0]?.turnOwnerId ?? (turn === state.turnNumber ? state.activePlayerId : undefined)) ? "OPPONENT TURN" : "PREPARATION"} · {turnEvents.length} events</small></summary>
        {turnEvents.map(row)}
        {!turnEvents.length && <p className={styles.empty}>Awaiting the next move.</p>}
      </details>)}
    </div>
    {unread > 0 && <button type="button" className={styles.unread} onClick={() => {
      pinned.current = true; setUnread(0);
      if (scroll.current) scroll.current.scrollTop = 0;
    }}>↑ {unread} new {unread === 1 ? "event" : "events"}</button>}
    {preview && createPortal(<aside ref={previewElement} className={`${play.cardSurface} ${styles.preview}`} aria-label={`${findGameCard(preview.ref.cardId)?.name} preview`}
      onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }} onMouseLeave={hide}>
      {(() => {
        const live = resolveChronicleEntity(state, viewerId, preview.ref);
        const faces = live.units.length ? live.units.map(unit => ({ unit, cost: live.card.cost, key: unit.instanceId }))
          : live.handCosts.length ? live.handCosts.map(hand => ({ unit: null, cost: hand.cost, key: hand.instanceId }))
          : [{ unit: null, cost: live.cost, key: "reference" }];
        return faces.map(({ unit, cost, key }) => <div key={key}>
          <div className={styles.previewStatus}>{unit ? `${label(unit.ownerId)} · ${unit.exhausted ? "Exhausted" : "Ready"}${unit.grounded ? " · Grounded" : ""}` : live.status}</div>
          <div className={`${play.unitCard} ${play.standaloneCard} ${styles.previewFace}`} style={tierStyle(live.card)} data-live-instance={unit?.instanceId}>
            <CardArtwork card={live.card} className={play.fullCardArtwork} />
            <CardChrome card={live.card} cost={cost} />
            <CardInfoPanel card={live.card} compact artifactId={unit?.attachedArtifactId}
              activeTraits={unit ? getTraitHighlights(state, viewerId, unit) : []}
              runtimeStats={unit ? chronicleUnitStats(state, unit) : undefined}
              baseStats={isUnitCard(live.card) ? { strength: live.card.strength, influence: live.card.cardType === "character" ? live.card.influence : undefined, health: live.card.health } : undefined} />
          </div>
          {live.equipped.map(holder => <div className={styles.previewStatus} key={holder.instanceId}>Equipped → {findGameCard(holder.cardId)?.name}</div>)}
        </div>);
      })()}
    </aside>, document.body)}
    {modal && (() => {
      const live = resolveChronicleEntity(state, viewerId, modal);
      if (live.units.length > 1 || live.hand.length > 1) return createPortal(<div className={styles.chooserShade} onClick={() => setModal(null)}>
        <div className={styles.chooser} role="dialog" aria-modal="true" aria-label={`Choose ${live.card.name}`} onClick={event => event.stopPropagation()}>
          <p>{live.card.name} · Choose a copy</p>
          {live.units.map((unit, index) => <button type="button" key={unit.instanceId} onClick={() => { setModal(null); onInspectUnit(unit.instanceId); }}>{label(unit.ownerId)} · Copy {index + 1} · Health {unit.currentHealth}/{chronicleUnitStats(state, unit).maxHealth}</button>)}
          {live.hand.map((hand, index) => <button type="button" key={hand.instanceId} onClick={() => { setModal(null); onInspectHand(hand.instanceId); }}>Your hand · Copy {index + 1}</button>)}
          <button type="button" onClick={() => setModal(null)}>Close</button>
        </div></div>, document.body);
      return <GameCardModal card={live.card} onClose={() => setModal(null)} action={<p>{live.status}{live.equipped.map(holder => ` · Equipped to ${findGameCard(holder.cardId)?.name}`).join("")}</p>} />;
    })()}
  </section>;
}
