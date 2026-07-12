// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\lib\graph-layout.ts
import housesData from "@/data/houses.json";
import { slugifyHouse } from "@/lib/houses";

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphPoint {
  x: number;
  y: number;
}

/**
 * A small, dependency-free force-directed layout (Fruchterman–Reingold
 * style: repulsion between all nodes, spring attraction along edges,
 * mild centering pull). Runs a fixed number of iterations synchronously,
 * so the result is deterministic for a given node/edge set and canvas
 * size — safe to compute on the server or inside useMemo.
 */
export function computeGraphLayout(
  nodeIds: string[],
  edges: GraphEdge[],
  width: number,
  height: number,
  iterations = 300
): Record<string, GraphPoint> {
  const positions: Record<string, GraphPoint> = {};
  const velocity: Record<string, GraphPoint> = {};

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2.6;

  nodeIds.forEach((id, index) => {
    const angle = (index / Math.max(nodeIds.length, 1)) * Math.PI * 2;
    positions[id] = {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
    velocity[id] = { x: 0, y: 0 };
  });

  if (nodeIds.length === 0) return positions;

  const idealDistance =
    Math.sqrt((width * height) / nodeIds.length) * 0.9 || 1;
  const damping = 0.85;
  const repulsionStep = 0.012;
  const attractionStep = 0.012;
  const centeringStep = 0.002;
  const padding = 60;

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion: every node pushes every other node away.
    for (const a of nodeIds) {
      let fx = 0;
      let fy = 0;

      for (const b of nodeIds) {
        if (a === b) continue;

        const dx = positions[a].x - positions[b].x;
        const dy = positions[a].y - positions[b].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (idealDistance * idealDistance) / dist;

        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      // Mild pull toward the center so the graph doesn't drift off-canvas.
      fx += (centerX - positions[a].x) * centeringStep * idealDistance;
      fy += (centerY - positions[a].y) * centeringStep * idealDistance;

      velocity[a].x += fx * repulsionStep;
      velocity[a].y += fy * repulsionStep;
    }

    // Attraction: connected nodes pull toward each other.
    for (const edge of edges) {
      const a = positions[edge.source];
      const b = positions[edge.target];
      if (!a || !b) continue;

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / idealDistance;

      const fx = (dx / dist) * force * attractionStep;
      const fy = (dy / dist) * force * attractionStep;

      velocity[edge.source].x -= fx;
      velocity[edge.source].y -= fy;
      velocity[edge.target].x += fx;
      velocity[edge.target].y += fy;
    }

    for (const id of nodeIds) {
      velocity[id].x *= damping;
      velocity[id].y *= damping;

      positions[id].x = Math.min(
        width - padding,
        Math.max(padding, positions[id].x + velocity[id].x)
      );
      positions[id].y = Math.min(
        height - padding,
        Math.max(padding, positions[id].y + velocity[id].y)
      );
    }
  }

  return positions;
}

interface HouseData {
  id: string;
  name: string;
  color?: string;
  secondaryColor?: string;
  [key: string]: unknown;
}

// Built once at module load: house slug -> canonical color from houses.json.
const houseColorBySlug = new Map<string, string>(
  (housesData as HouseData[])
    .filter((house) => Boolean(house.color))
    .map((house) => [house.id, house.color as string])
);

// Built once at module load: house slug -> secondary/border color.
const houseSecondaryColorBySlug = new Map<string, string>(
  (housesData as HouseData[])
    .filter((house) => Boolean(house.secondaryColor))
    .map((house) => [house.id, house.secondaryColor as string])
);

/**
 * Deterministic, readable hash-based color, used only as a fallback when
 * a house name doesn't have a canonical color defined in houses.json.
 */
function hashColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 58%, 58%)`;
}

/**
 * Looks up a house's canonical color from houses.json (matched by slug,
 * e.g. "House Targaryen" -> "targaryen" -> "#B22222"). Falls back to a
 * deterministic hash-based color for house names that aren't found there,
 * so the graph never has to leave a node uncolored.
 */
export function colorForHouse(house: string): string {
  if (!house || house === "-") return hashColor(house || "unaffiliated");

  const slug = slugifyHouse(house);
  return houseColorBySlug.get(slug) ?? hashColor(house);
}

/**
 * Looks up a house's secondary/accent color from houses.json, for use as
 * a node border in the relationships graph. Returns null when a house has
 * no secondary color defined (or the character has no house), so callers
 * can decide their own default border instead.
 */
export function secondaryColorForHouse(house: string): string | null {
  if (!house || house === "-") return null;

  const slug = slugifyHouse(house);
  return houseSecondaryColorBySlug.get(slug) ?? null;
}