"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CharacterId } from "@/types/character";
import MiniPortrait from "@/components/MiniPortrait";

import { getCharacters } from "@/lib/characters";
import { getEffectiveRelationships } from "@/lib/relationships";
import {
  computeGraphLayout,
  colorForHouse,
  secondaryColorForHouse,
} from "@/lib/graph-layout";
import SearchableSelect from "@/components/SearchableSelect";

import styles from "./relationships.module.css";

const WIDTH = 960;
const HEIGHT = 640;

const MIN_NODE_DISTANCE = 42;
const GRAPH_PADDING = 24;
const LABEL_EDGE_GUARD = 72;

interface Edge {
  source: CharacterId;
  target: CharacterId;
  label: string;
}

function formatCharacterName(name: string) {
  return name
    .replace(
      /^(Ser|Lady|Lord|King|Queen|Prince|Princess|Mother)\s+/i,
      ""
    )
    .trim();
}

function fallbackColorForId(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, 55%, 55%)`;
}

function colorForCharacter(id: string, house: string) {
  if (house && house !== "-") {
    const houseColor = colorForHouse(house);

    if (houseColor) {
      return houseColor;
    }
  }

  return fallbackColorForId(id);
}

function nodeLabelPlacement(x: number) {
  if (x > WIDTH - LABEL_EDGE_GUARD) {
    return { x: -11, textAnchor: "end" as const };
  }

  return { x: 11, textAnchor: "start" as const };
}

function addNodeSafeSpacing<T extends string>(
  sourceLayout: Record<T, { x: number; y: number }>,
  ids: T[],
  width: number,
  height: number,
  minDistance = MIN_NODE_DISTANCE
) {
  const result = Object.fromEntries(
    ids.map((id) => [
      id,
      {
        x: sourceLayout[id]?.x ?? width / 2,
        y: sourceLayout[id]?.y ?? height / 2,
      },
    ])
  ) as Record<T, { x: number; y: number }>;

  /*
   * Multiple small collision-resolution passes.
   * This keeps the original graph structure mostly intact,
   * while preventing nodes from sitting on top of each other.
   */
  for (let iteration = 0; iteration < 30; iteration++) {
    let moved = false;

    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = result[ids[i]];
        const b = result[ids[j]];

        let dx = b.x - a.x;
        let dy = b.y - a.y;

        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= minDistance) {
          continue;
        }

        /*
         * If two nodes somehow have exactly the same coordinates,
         * give them a deterministic direction to separate them.
         */
        if (distance < 0.001) {
          const angle =
            ((i * 47 + j * 83) % 360) *
            (Math.PI / 180);

          dx = Math.cos(angle);
          dy = Math.sin(angle);
          distance = 1;
        }

        const overlap = minDistance - distance;
        const push = overlap / 2;

        const nx = dx / distance;
        const ny = dy / distance;

        a.x -= nx * push;
        a.y -= ny * push;

        b.x += nx * push;
        b.y += ny * push;

        /*
         * Keep nodes inside the visible graph area.
         */
        a.x = Math.max(
          GRAPH_PADDING,
          Math.min(width - GRAPH_PADDING, a.x)
        );

        a.y = Math.max(
          GRAPH_PADDING,
          Math.min(height - GRAPH_PADDING, a.y)
        );

        b.x = Math.max(
          GRAPH_PADDING,
          Math.min(width - GRAPH_PADDING, b.x)
        );

        b.y = Math.max(
          GRAPH_PADDING,
          Math.min(height - GRAPH_PADDING, b.y)
        );

        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }

  return result;
}

export default function RelationshipsPage() {
  const characters = useMemo(
    () => getCharacters(),
    []
  );

  const byId = useMemo(
    () =>
      new Map(
        characters.map((character) => [
          character.id,
          character,
        ])
      ),
    [characters]
  );

  const houses = useMemo(
    () =>
      Array.from(
        new Set(
          characters
            .map((character) => character.house)
            .filter((house) => house !== "-")
        )
      ).sort(),
    [characters]
  );

  const [houseFilter, setHouseFilter] =
    useState<string>("all");

  const [selectedId, setSelectedId] =
    useState<CharacterId | null>(null);

  const [hoveredId, setHoveredId] =
    useState<CharacterId | null>(null);

  const edges = useMemo<Edge[]>(() => {
    const list: Edge[] = [];
    const seen = new Set<string>();

    for (const character of characters) {
      for (const relationship of getEffectiveRelationships(character.id)) {
        const targetId = relationship.id as CharacterId;

        if (!byId.has(targetId)) {
          continue;
        }

        const key = [character.id, targetId].sort().join("::");

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);

        list.push({
          source: character.id,
          target: targetId,
          label: relationship.description,
        });
      }
    }

    return list;
  }, [characters, byId]);

  const nodeIds = useMemo(
    () => characters.map((character) => character.id),
    [characters]
  );

  /*
   * First calculate the normal graph layout.
   * Then resolve collisions so nodes retain some safe space.
   */
  const layout = useMemo(() => {
    const baseLayout = computeGraphLayout(
      nodeIds,
      edges,
      WIDTH,
      HEIGHT
    );

    return addNodeSafeSpacing(
      baseLayout,
      nodeIds,
      WIDTH,
      HEIGHT
    );
  }, [nodeIds, edges]);

  const visibleIds = useMemo(() => {
    if (houseFilter === "all") {
      return new Set(nodeIds);
    }

    return new Set(
      characters
        .filter(
          (character) =>
            character.house === houseFilter
        )
        .map((character) => character.id)
    );
  }, [houseFilter, characters, nodeIds]);

  const connectedIds = useMemo(() => {
    if (!selectedId) {
      return null;
    }

    const set = new Set<string>([
      selectedId,
    ]);

    for (const edge of edges) {
      if (edge.source === selectedId) {
        set.add(edge.target);
      }

      if (edge.target === selectedId) {
        set.add(edge.source);
      }
    }

    return set;
  }, [selectedId, edges]);

  /*
   * SVG does not use z-index like normal HTML.
   * Elements rendered later appear above earlier elements.
   *
   * So while hovering a node, move that node to the
   * end of the rendering order.
   */
  const orderedNodeIds = useMemo(() => {
    if (!hoveredId) {
      return nodeIds;
    }

    return [
      ...nodeIds.filter(
        (id) => id !== hoveredId
      ),
      hoveredId,
    ];
  }, [nodeIds, hoveredId]);

  const selectedCharacter = selectedId
    ? byId.get(selectedId)
    : null;

  const selectedRelationships =
    useMemo(() => {
      if (!selectedCharacter) {
        return [];
      }

      return getEffectiveRelationships(selectedCharacter.id).flatMap(
        (entry) => {
          const relatedCharacter = entry.character;

          if (
            !relatedCharacter ||
            !visibleIds.has(relatedCharacter.id)
          ) {
            return [];
          }

          return [
            {
              id: relatedCharacter.id,
              name: relatedCharacter.name,
              description: entry.description,
            },
          ];
        }
      );
    }, [selectedCharacter, visibleIds]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>
          Web of Loyalties
        </h1>

        <p className={styles.subheading}>
          Every known bond, alliance, and
          rivalry in the story so far. Hover a
          character to highlight them, click to
          pin their connections here, then click
          the name to view their profile.
        </p>

        <div className={styles.controls}>
          <label
            className={styles.filterLabel}
            htmlFor="house-filter"
          >
            Filter by house
          </label>

          <SearchableSelect
            id="house-filter"
            value={houseFilter}
            onChange={setHouseFilter}
            placeholder="All houses"
            searchPlaceholder="Search houses…"
            options={[
              {
                value: "all",
                label: "All houses",
              },
              ...houses.map((house) => ({
                value: house,
                label: house,
              })),
            ]}
          />
        </div>

        <div className={styles.graphLayout}>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={styles.svg}
            role="img"
            aria-label="Character relationship graph"
            onClick={() => {
              setSelectedId(null);
              setHoveredId(null);
            }}
          >
            {edges.map((edge, index) => {
              const a =
                layout[edge.source];

              const b =
                layout[edge.target];

              if (!a || !b) {
                return null;
              }

              const bothVisible =
                visibleIds.has(
                  edge.source
                ) &&
                visibleIds.has(
                  edge.target
                );

              if (!bothVisible) {
                return null;
              }

              const isConnected =
                !connectedIds ||
                (connectedIds.has(
                  edge.source
                ) &&
                  connectedIds.has(
                    edge.target
                  ));

              return (
                <line
                  key={`${edge.source}-${edge.target}-${index}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={
                    isConnected
                      ? "var(--gold)"
                      : "var(--border)"
                  }
                  strokeWidth={
                    isConnected &&
                    selectedId
                      ? 1.6
                      : 1
                  }
                  opacity={
                    isConnected
                      ? 0.85
                      : 0.2
                  }
                />
              );
            })}

            {orderedNodeIds.map(
              (id) => {
                const point =
                  layout[id];

                const character =
                  byId.get(id);

                if (
                  !point ||
                  !character
                ) {
                  return null;
                }

                if (
                  !visibleIds.has(id)
                ) {
                  return null;
                }

                const dimmed =
                  connectedIds
                    ? !connectedIds.has(
                        id
                      )
                    : false;

                const isSelected =
                  selectedId === id;

                const isHovered =
                  hoveredId === id;

                const isHighlighted =
                  isSelected ||
                  isHovered;

                const labelPlacement =
                  nodeLabelPlacement(point.x);

                return (
                  <g
                    key={id}
                    transform={`translate(${point.x}, ${point.y})`}
                    className={
                      styles.node
                    }
                    opacity={
                      dimmed
                        ? 0.25
                        : 1
                    }
                    onMouseEnter={() =>
                      setHoveredId(id)
                    }
                    onMouseLeave={() =>
                      setHoveredId(
                        (
                          current
                        ) =>
                          current ===
                          id
                            ? null
                            : current
                      )
                    }
                    onClick={(
                      event
                    ) => {
                      event.stopPropagation();

                      setSelectedId(
                        id
                      );

                      setHoveredId(
                        id
                      );
                    }}
                  >
                    <circle
                      r={
                        isHighlighted
                          ? 10
                          : 7
                      }
                      fill={colorForCharacter(
                        character.id,
                        character.house
                      )}
                      stroke={
                        isHighlighted
                          ? "var(--gold)"
                          : secondaryColorForHouse(
                              character.house
                            ) ??
                            "var(--background)"
                      }
                      strokeWidth={
                        isHighlighted
                          ? 2
                          : 1.5
                      }
                    />

                    <text
                      x={labelPlacement.x}
                      y={4}
                      textAnchor={labelPlacement.textAnchor}
                      className={`${styles.nodeLabel} ${
                        isHovered
                          ? styles.nodeLabelHovered
                          : ""
                      }`}
                    >
                      {formatCharacterName(
                        character.name
                      ).split(" ")[0]}
                    </text>
                  </g>
                );
              }
            )}
          </svg>

          <aside
            className={
              styles.sidebar
            }
          >
            {selectedCharacter ? (
              <>
                <div
                  className={
                    styles.sidebarHeader
                  }
                >
                  <div
                    className={
                      styles.sidebarTopRow
                    }
                  >
                    <Link
                      href={`/characters/${selectedCharacter.id}`}
                      className={
                        styles.sidebarNameLink
                      }
                    >
                      <MiniPortrait
                        id={
                          selectedCharacter.id
                        }
                        alt={
                          selectedCharacter.name
                        }
                        size={30}
                      />

                      <h2
                        className={
                          styles.sidebarName
                        }
                      >
                        {formatCharacterName(
                          selectedCharacter.name
                        )}
                      </h2>
                    </Link>
                  </div>

                  <p
                    className={
                      styles.sidebarHouse
                    }
                  >
                    {
                      selectedCharacter.house
                    }{" "}
                    &middot;{" "}
                    {
                      selectedCharacter.title
                    }
                  </p>
                </div>

                {selectedRelationships.length >
                0 ? (
                  <ul
                    className={
                      styles.relationshipList
                    }
                  >
                    {selectedRelationships.map(
                      (rel) => (
                        <li
                          key={
                            rel.id
                          }
                          className={
                            styles.relationshipItem
                          }
                        >
                          <Link
                            href={`/characters/${rel.id}`}
                            className={
                              styles.relationshipNameRow
                            }
                          >
                            <MiniPortrait
                              id={
                                rel.id
                              }
                              alt={
                                rel.name
                              }
                              size={
                                24
                              }
                            />

                            <span
                              className={
                                styles.relationshipName
                              }
                            >
                              {
                                rel.name
                              }
                            </span>
                          </Link>

                          <span
                            className={
                              styles.relationshipDescription
                            }
                          >
                            {
                              rel.description
                            }
                          </span>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p
                    className={
                      styles.sidebarEmpty
                    }
                  >
                    No recorded
                    relationships
                    within the current
                    filter.
                  </p>
                )}
              </>
            ) : (
              <p
                className={
                  styles.sidebarEmpty
                }
              >
                Click a character in the
                graph to pin their known
                relationships here. Click
                empty space to clear the
                selection.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}