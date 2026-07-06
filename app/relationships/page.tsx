"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getCharacters } from "@/lib/characters";
import { computeGraphLayout, colorForHouse } from "@/lib/graph-layout";

import styles from "./relationships.module.css";

const WIDTH = 960;
const HEIGHT = 640;

interface Edge {
  source: string;
  target: string;
  label: string;
}

export default function RelationshipsPage() {
  const router = useRouter();
  const characters = useMemo(() => getCharacters(), []);
  const byId = useMemo(
    () => new Map(characters.map((c) => [c.id, c])),
    [characters]
  );

  const houses = useMemo(
    () =>
      Array.from(
        new Set(characters.map((c) => c.house).filter((h) => h !== "-"))
      ).sort(),
    [characters]
  );

  const [houseFilter, setHouseFilter] = useState<string>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const edges = useMemo<Edge[]>(() => {
    const list: Edge[] = [];
    const seen = new Set<string>();

    for (const character of characters) {
      for (const [targetId, label] of Object.entries(
        character.relationships ?? {}
      )) {
        if (!byId.has(targetId)) continue;

        const key = [character.id, targetId].sort().join("::");
        if (seen.has(key)) continue;
        seen.add(key);

        list.push({ source: character.id, target: targetId, label });
      }
    }

    return list;
  }, [characters, byId]);

  const nodeIds = useMemo(() => characters.map((c) => c.id), [characters]);

  const layout = useMemo(
    () => computeGraphLayout(nodeIds, edges, WIDTH, HEIGHT),
    [nodeIds, edges]
  );

  const visibleIds = useMemo(() => {
    if (houseFilter === "all") return new Set(nodeIds);
    return new Set(
      characters
        .filter((c) => c.house === houseFilter)
        .map((c) => c.id)
    );
  }, [houseFilter, characters, nodeIds]);

  const connectedIds = useMemo(() => {
    if (!hoveredId) return null;
    const set = new Set<string>([hoveredId]);
    for (const edge of edges) {
      if (edge.source === hoveredId) set.add(edge.target);
      if (edge.target === hoveredId) set.add(edge.source);
    }
    return set;
  }, [hoveredId, edges]);

  const hoveredCharacter = hoveredId ? byId.get(hoveredId) : null;

  const hoveredRelationships = useMemo(() => {
    if (!hoveredCharacter) return [];
    return Object.entries(hoveredCharacter.relationships ?? {})
      .map(([id, description]) => ({
        id,
        name: byId.get(id)?.name ?? id,
        description,
      }))
      .filter((entry) => visibleIds.has(entry.id));
  }, [hoveredCharacter, byId, visibleIds]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Web of Loyalties</h1>
        <p className={styles.subheading}>
          Every known bond, alliance, and rivalry in the story so far. Hover
          a name to trace its threads, click to visit the character.
        </p>

        <div className={styles.controls}>
          <label className={styles.filterLabel} htmlFor="house-filter">
            Filter by house
          </label>
          <select
            id="house-filter"
            className={styles.select}
            value={houseFilter}
            onChange={(event) => setHouseFilter(event.target.value)}
          >
            <option value="all">All houses</option>
            {houses.map((house) => (
              <option key={house} value={house}>
                {house}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.graphLayout}>
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className={styles.svg}
            role="img"
            aria-label="Character relationship graph"
          >
            {edges.map((edge, index) => {
              const a = layout[edge.source];
              const b = layout[edge.target];
              if (!a || !b) return null;

              const bothVisible =
                visibleIds.has(edge.source) && visibleIds.has(edge.target);
              if (!bothVisible) return null;

              const isConnected =
                !connectedIds ||
                (connectedIds.has(edge.source) &&
                  connectedIds.has(edge.target));

              return (
                <line
                  key={index}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isConnected ? "var(--gold)" : "var(--border)"}
                  strokeWidth={isConnected && hoveredId ? 1.6 : 1}
                  opacity={isConnected ? 0.85 : 0.2}
                />
              );
            })}

            {nodeIds.map((id) => {
              const point = layout[id];
              const character = byId.get(id);
              if (!point || !character) return null;
              if (!visibleIds.has(id)) return null;

              const dimmed = connectedIds ? !connectedIds.has(id) : false;
              const isHovered = hoveredId === id;

              return (
                <g
                  key={id}
                  transform={`translate(${point.x}, ${point.y})`}
                  className={styles.node}
                  opacity={dimmed ? 0.25 : 1}
                  onMouseEnter={() => setHoveredId(id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => router.push(`/characters/${id}`)}
                >
                  <circle
                    r={isHovered ? 10 : 7}
                    fill={colorForHouse(character.house)}
                    stroke={isHovered ? "var(--gold)" : "var(--background)"}
                    strokeWidth={isHovered ? 2 : 1.5}
                  />
                  <text
                    x={11}
                    y={4}
                    className={styles.nodeLabel}
                  >
                    {character.name.split(" ")[0]}
                  </text>
                </g>
              );
            })}
          </svg>

          <aside className={styles.sidebar}>
            {hoveredCharacter ? (
              <>
                <h2 className={styles.sidebarName}>
                  {hoveredCharacter.name}
                </h2>
                <p className={styles.sidebarHouse}>
                  {hoveredCharacter.house} &middot; {hoveredCharacter.title}
                </p>

                {hoveredRelationships.length > 0 ? (
                  <ul className={styles.relationshipList}>
                    {hoveredRelationships.map((rel) => (
                      <li key={rel.id} className={styles.relationshipItem}>
                        <span className={styles.relationshipName}>
                          {rel.name}
                        </span>
                        <span className={styles.relationshipDescription}>
                          {rel.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.sidebarEmpty}>
                    No recorded relationships within the current filter.
                  </p>
                )}
              </>
            ) : (
              <p className={styles.sidebarEmpty}>
                Hover over a name in the graph to see their known
                relationships here.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
