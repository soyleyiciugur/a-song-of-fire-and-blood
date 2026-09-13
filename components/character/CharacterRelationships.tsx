"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import MiniPortrait from "@/components/MiniPortrait";
import { getCharacters } from "@/lib/characters";
import {
  getEffectiveRelationships,
  type EffectiveRelationship,
} from "@/lib/relationships";
import {
  colorForHouse,
  secondaryColorForHouse,
} from "@/lib/graph-layout";
import type { Character, CharacterId } from "@/types/character";
import styles from "./characterContent.module.css";

type Props = {
  characterId: CharacterId;
  /** Kept optional for backwards compatibility with older character page calls. */
  relationships?: Record<string, string>;
};

type RelatedEntry = EffectiveRelationship & {
  character?: Character;
};

const WIDTH = 720;
const HEIGHT = 390;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const LABEL_EDGE_GUARD = 86;
const LABEL_VERTICAL_GUARD = 24;
const MIN_LABEL_GAP = 22;

const characters = getCharacters();
const byId = new Map<CharacterId, Character>(
  characters.map((character) => [character.id, character])
);

function fallbackColorForId(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  return `hsl(${Math.abs(hash) % 360}, 55%, 55%)`;
}

function colorForCharacter(id: string, house: string) {
  if (house && house !== "-") {
    const houseColor = colorForHouse(house);
    if (houseColor) return houseColor;
  }

  return fallbackColorForId(id);
}

function formatCharacterName(name: string) {
  return name
    .replace(
      /^(Ser|Lady|Lord|King|Queen|Prince|Princess|Mother)\s+/i,
      ""
    )
    .trim();
}

function shortLabel(name: string) {
  const clean = formatCharacterName(name);
  return clean.split(" ")[0] || clean;
}

function buildRadialLayout(ids: string[]) {
  const result = new Map<string, { x: number; y: number }>();
  const count = ids.length;

  if (count === 0) return result;

  const firstRingCount = Math.min(count, 9);
  const secondRingCount = Math.max(0, count - firstRingCount);

  ids.slice(0, firstRingCount).forEach((id, index) => {
    const angle = -Math.PI / 2 + (index / firstRingCount) * Math.PI * 2;
    const radiusX = 235;
    const radiusY = 135;

    result.set(id, {
      x: CENTER_X + Math.cos(angle) * radiusX,
      y: CENTER_Y + Math.sin(angle) * radiusY,
    });
  });

  ids.slice(firstRingCount).forEach((id, index) => {
    const angle =
      -Math.PI / 2 +
      (index / Math.max(secondRingCount, 1)) * Math.PI * 2 +
      Math.PI / Math.max(secondRingCount, 1);

    result.set(id, {
      x: CENTER_X + Math.cos(angle) * 295,
      y: CENTER_Y + Math.sin(angle) * 165,
    });
  });

  // Labels on the sides of a radial graph can converge even when their nodes
  // sit on separate rings. Keep each side in its original order while giving
  // every label a guaranteed vertical lane inside the viewBox.
  const spreadSide = (sideIds: string[]) => {
    const sorted = sideIds.sort(
      (a, b) => (result.get(a)?.y ?? 0) - (result.get(b)?.y ?? 0)
    );

    sorted.forEach((id, index) => {
      const point = result.get(id);
      if (!point || index === 0) return;

      const previous = result.get(sorted[index - 1]);
      if (previous) point.y = Math.max(point.y, previous.y + MIN_LABEL_GAP);
    });

    for (let index = sorted.length - 1; index >= 0; index--) {
      const point = result.get(sorted[index]);
      if (!point) continue;

      const maxY =
        HEIGHT - LABEL_VERTICAL_GUARD - (sorted.length - 1 - index) * MIN_LABEL_GAP;
      point.y = Math.min(point.y, maxY);
    }

    sorted.forEach((id, index) => {
      const point = result.get(id);
      if (!point) return;
      point.y = Math.max(
        point.y,
        LABEL_VERTICAL_GUARD + index * MIN_LABEL_GAP
      );
    });
  };

  spreadSide(ids.filter((id) => (result.get(id)?.x ?? CENTER_X) < CENTER_X));
  spreadSide(ids.filter((id) => (result.get(id)?.x ?? CENTER_X) >= CENTER_X));

  return result;
}

function labelPlacement(x: number) {
  if (x > WIDTH - LABEL_EDGE_GUARD) {
    return { x: -11, textAnchor: "end" as const };
  }

  return { x: 11, textAnchor: "start" as const };
}

export default function CharacterRelationships({ characterId }: Props) {
  const currentCharacter = byId.get(characterId);
  const entries = useMemo(
    () => getEffectiveRelationships(characterId),
    [characterId]
  );

  const known = useMemo<RelatedEntry[]>(
    () =>
      entries.flatMap((entry) =>
        entry.character || entry.dragon ? [{ ...entry }] : []
      ),
    [entries]
  );

  const unresolved = useMemo(
    () => entries.filter((entry) => !entry.character),
    [entries]
  );

  const layout = useMemo(
    () => buildRadialLayout(known.map((entry) => entry.id)),
    [known]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, [characterId]);

  if (entries.length === 0 || !currentCharacter) return null;

  const selected = selectedId
    ? known.find((entry) => entry.id === selectedId) ?? null
    : null;
  const activeId = hoveredId ?? selectedId;

  function entryColor(entry: RelatedEntry) {
    return entry.character
      ? colorForCharacter(entry.character.id, entry.character.house)
      : "#9b8b6c";
  }

  function entryStroke(entry: RelatedEntry) {
    return entry.character
      ? secondaryColorForHouse(entry.character.house) ?? "var(--background)"
      : "#d5b35a";
  }

  return (
    <section className={styles.sectionPanel}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleGroup}>
          <span className={styles.sectionEyebrow}>Web of loyalties</span>
          <h2 className={styles.sectionTitle}>Relationships</h2>
        </div>
        <p className={styles.sectionHint}>
          Hover to trace a bond. Click a node to pin its record.
        </p>
      </div>

      <div className={styles.relationshipLayout}>
        <div className={styles.relationshipGraphShell}>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={styles.relationshipSvg}
            role="img"
            aria-label={`${currentCharacter.name} relationship network`}
            onClick={() => setSelectedId(null)}
          >
            {known.map((entry) => {
              const point = layout.get(entry.id);
              if (!point) return null;

              const active = activeId === entry.id;

              return (
                <line
                  key={`edge-${entry.id}`}
                  x1={CENTER_X}
                  y1={CENTER_Y}
                  x2={point.x}
                  y2={point.y}
                  stroke={active ? "var(--gold)" : "var(--border)"}
                  strokeWidth={active ? 1.7 : 1}
                  opacity={active ? 0.95 : activeId ? 0.18 : 0.55}
                />
              );
            })}

            <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
              <circle
                r={13}
                fill={colorForCharacter(
                  currentCharacter.id,
                  currentCharacter.house
                )}
                stroke="var(--gold)"
                strokeWidth={2.4}
              />
              <text
                x={17}
                y={4}
                className={`${styles.relationshipNodeLabel} ${styles.relationshipNodeLabelActive}`}
              >
                {shortLabel(currentCharacter.name)}
              </text>
            </g>

            {known.map((entry) => {
              const point = layout.get(entry.id);
              if (!point) return null;

              const isSelected = selectedId === entry.id;
              const isHovered = hoveredId === entry.id;
              const highlighted = isSelected || isHovered;
              const dimmed = Boolean(activeId && activeId !== entry.id);
              const label = labelPlacement(point.x);

              return (
                <g
                  key={entry.id}
                  transform={`translate(${point.x}, ${point.y})`}
                  className={styles.relationshipNode}
                  opacity={dimmed ? 0.35 : 1}
                  onMouseEnter={() => setHoveredId(entry.id)}
                  onMouseLeave={() =>
                    setHoveredId((current) =>
                      current === entry.id ? null : current
                    )
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedId(entry.id);
                  }}
                >
                  <circle
                    r={highlighted ? 10 : 7}
                    fill={entryColor(entry)}
                    stroke={
                      highlighted ? "var(--gold)" : entryStroke(entry)
                    }
                    strokeWidth={highlighted ? 2 : 1.5}
                  />
                  <text
                    x={label.x}
                    y={4}
                    textAnchor={label.textAnchor}
                    className={`${styles.relationshipNodeLabel} ${
                      highlighted ? styles.relationshipNodeLabelActive : ""
                    }`}
                  >
                    {shortLabel(entry.name)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className={styles.relationshipSidebar}>
          {selected ? (
            <>
              <div className={styles.relationshipSidebarHeader}>
                {selected.character ? (
                  <MiniPortrait
                    key={selected.character.id}
                    id={selected.character.id}
                    alt={selected.character.name}
                    size={34}
                  />
                ) : (
                  <img
                    className={styles.relationshipDragonThumb}
                    src={selected.dragon?.image ?? ""}
                    alt={selected.name}
                    width={34}
                    height={34}
                  />
                )}
                <div>
                  {selected.character ? (
                    <Link
                      href={`/characters/${selected.character.id}`}
                      className={styles.relationshipSidebarName}
                    >
                      {selected.character.name}
                    </Link>
                  ) : (
                    <Link
                      href={`/dragons/${selected.dragon?.id ?? selected.id}`}
                      className={styles.relationshipSidebarName}
                    >
                      {selected.name}
                    </Link>
                  )}
                  <div className={styles.relationshipSidebarHouse}>
                    {selected.character
                      ? selected.character.house !== "-"
                        ? selected.character.house
                        : selected.character.title
                      : "Bonded dragon"}
                  </div>
                </div>
              </div>

              <p className={styles.relationshipDescription}>
                {selected.description}
              </p>
            </>
          ) : (
            <p className={styles.relationshipSidebarEmpty}>
              Select one of the connected characters to read the recorded bond.
            </p>
          )}
        </aside>
      </div>

      {unresolved.length > 0 && (
        <div className={styles.unresolvedBlock}>
          <h3 className={styles.unresolvedTitle}>Other recorded ties</h3>
          <ul className={styles.unresolvedList}>
            {unresolved.map((entry) => (
              <li key={entry.id} className={styles.unresolvedItem}>
                <strong>{entry.name}</strong> — {entry.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.relationshipFooter}>
        <span className={styles.relationshipCount}>
          {entries.length} recorded {entries.length === 1 ? "bond" : "bonds"}
        </span>
        <Link href="/relationships" className={styles.relationshipFullLink}>
          Open full web →
        </Link>
      </div>
    </section>
  );
}
