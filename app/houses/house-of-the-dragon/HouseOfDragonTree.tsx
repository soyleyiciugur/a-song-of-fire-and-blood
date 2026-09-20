"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import MiniPortrait from "@/components/MiniPortrait";
import charactersData from "@/data/characters/characters.json";
import housesData from "@/data/houses.json";
import type {
  HouseOfDragonPerson,
  HouseOfDragonTree as TreeData,
  HouseOfDragonUnion,
} from "@/schemas/houseOfDragonTree";

import styles from "./house-of-the-dragon.module.css";

const CW = 190;
const CH = 96;
const SG = 44;
const BG = 36;
const ROW = 222;
const SNAP_TOLERANCE = 18;

const ROYAL_LINEAGE = [
  "aegon-targaryen-i",
  "aenys-targaryen-i",
  "jaehaerys-targaryen-i",
  "aenys-targaryen-ii",
  "baelenys-targaryen",
] as const;
const ROYAL_SET = new Set<string>(ROYAL_LINEAGE);
const ROYAL_PREDECESSOR = new Map<string, string>(
  ROYAL_LINEAGE.slice(1).map((id, index) => [id, ROYAL_LINEAGE[index]]),
);
const KINGS = new Set([
  "aegon-targaryen-i",
  "aenys-targaryen-i",
  "maegor-targaryen-i",
  "jaehaerys-targaryen-i",
  "aenys-targaryen-ii",
  "baelenys-targaryen",
]);

type CharacterRecord = {
  id: string;
  name: string;
  nickname?: string;
  title?: string;
  house?: string;
  status?: string;
  dragon?: string;
};

const CHARACTER_RECORDS = charactersData as CharacterRecord[];
const CHARACTER_BY_ID = new Map(CHARACTER_RECORDS.map((item) => [item.id, item]));
const CHARACTER_IDS = new Set(CHARACTER_RECORDS.map((item) => item.id));
const HOUSE_BY_NAME = new Map(
  (housesData as Array<{ id: string; name: string; color?: string; sigilSrc?: string }>).map((house) => [house.name, house]),
);

const EXTRA_HOUSE_COLORS: Record<string, string> = {
  "House Harroway": "#73806d",
  "House Targaryen": "#a42d3f",
  "House Velaryon": "#69a9b1",
  "House Dayne": "#8475b6",
  "House Arryn": "#6e96cf",
  "House Baratheon": "#c2a34c",
  "-": "#82776d",
};

const svgCrown = (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="m2.8 7 3.3 2.8L10 4.4l3.9 5.4L17.2 7l-1.4 8H4.2L2.8 7Z" />
    <path d="M4.5 16.2h11" />
  </svg>
);

function houseColor(house: string) {
  return HOUSE_BY_NAME.get(house)?.color ?? EXTRA_HOUSE_COLORS[house] ?? "#86766d";
}

function houseSigil(house: string) {
  return HOUSE_BY_NAME.get(house)?.sigilSrc ?? (house === "House Targaryen" ? "/images/houses/targaryen.webp" : undefined);
}

function cloneTree(tree: TreeData): TreeData {
  return JSON.parse(JSON.stringify(tree)) as TreeData;
}

function serialise(tree: TreeData) {
  return JSON.stringify(tree);
}

function yearLabel(person: HouseOfDragonPerson) {
  const format = (year: number | null) => {
    if (year == null) return "";
    return year < 0 ? `${Math.abs(year)} BC` : `${year} AC`;
  };
  if (person.b == null && person.d == null) return "";
  if (person.d == null) return `${person.b == null ? "?" : format(person.b)} –`;
  return `${person.b == null ? "?" : format(person.b)} – ${format(person.d)}`;
}

function relationKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

type View = { x: number; y: number; k: number };
type Box = { x: number; y: number };
type Edge = {
  type: "child" | "marriage" | "inferred";
  d: string;
  ids: string[];
  label?: string;
  labelX?: number;
  labelY?: number;
  dotX?: number;
  dotY?: number;
  royal?: boolean;
};

type DragState = {
  id: string;
  startX: number;
  startY: number;
  moved: boolean;
  before: string;
  items: Array<{ id: string; x: number; y: number }>;
  primary: { id: string; x: number; y: number };
};

type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  viewX: number;
  viewY: number;
  moved: boolean;
};

type MarqueeState = {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  base: Set<string>;
};

function computeEdges(tree: TreeData): Edge[] {
  const { people, order, unions } = tree;
  const ids = order.filter((id) => people[id] && Number.isFinite(people[id].x) && Number.isFinite(people[id].y));
  const box = (id: string): Box => ({ x: people[id].x ?? 0, y: people[id].y ?? 0 });
  const boxes = ids.map((id) => ({ id, ...box(id) }));
  const anchors = new Map<string, { x: number; y: number }>();
  const edges: Edge[] = [];

  unions.forEach((union, unionIndex) => {
    if (!people[union.a] || !people[union.b]) return;
    const royalBridge = ROYAL_LINEAGE.some((childId) => {
      const predecessor = ROYAL_PREDECESSOR.get(childId);
      const child = people[childId];
      if (!predecessor || !child) return false;
      const otherParent = child.father === predecessor ? child.mother : child.mother === predecessor ? child.father : null;
      return Boolean(otherParent && new Set([union.a, union.b]).has(predecessor) && new Set([union.a, union.b]).has(otherParent));
    });
    const a = box(union.a);
    const b = box(union.b);
    const left = a.x <= b.x ? a : b;
    const right = a.x <= b.x ? b : a;
    const sameRow = Math.abs(a.y - b.y) < CH * 0.65;
    const gap = right.x - (left.x + CW);
    const blocked = boxes.some(
      (node) =>
        node.id !== union.a &&
        node.id !== union.b &&
        Math.abs(node.y - left.y) < CH &&
        node.x < right.x &&
        node.x + CW > left.x + CW,
    );

    if (sameRow && gap >= -8 && gap <= 210 && !blocked) {
      const y = left.y + CH / 2;
      const x1 = left.x + CW;
      const x2 = right.x;
      const mid = (x1 + x2) / 2;
      edges.push({
        type: "marriage",
        d: `M${x1} ${y}H${x2}`,
        ids: [union.a, union.b],
        label: union.label,
        labelX: mid,
        labelY: y - 8,
        dotX: mid,
        dotY: y,
        royal: royalBridge,
      });
      anchors.set(relationKey(union.a, union.b), { x: mid, y });
    } else {
      const y = Math.max(a.y, b.y) + CH + 18 + (unionIndex % 4) * 7;
      const ax = a.x + CW / 2;
      const bx = b.x + CW / 2;
      edges.push({
        type: "marriage",
        d: `M${ax} ${a.y + CH}V${y}H${bx}V${b.y + CH}`,
        ids: [union.a, union.b],
        label: union.label,
        labelX: (ax + bx) / 2,
        labelY: y - 8,
        dotX: (ax + bx) / 2,
        dotY: y,
        royal: royalBridge,
      });
      anchors.set(relationKey(union.a, union.b), { x: (ax + bx) / 2, y });
    }
  });

  ids.forEach((childId) => {
    const child = people[childId];
    const father = child.father && people[child.father] ? child.father : null;
    const mother = child.mother && people[child.mother] ? child.mother : null;
    if (!father && !mother) return;

    let anchor: { x: number; y: number };
    if (father && mother) {
      const key = relationKey(father, mother);
      const existing = anchors.get(key);
      if (existing) {
        anchor = existing;
      } else {
        const a = box(father);
        const b = box(mother);
        const y = Math.max(a.y, b.y) + CH + 18;
        anchor = { x: (a.x + b.x + CW) / 2, y };
        anchors.set(key, anchor);
        edges.push({
          type: "inferred",
          d: `M${a.x + CW / 2} ${a.y + CH}V${y}H${b.x + CW / 2}V${b.y + CH}`,
          ids: [father, mother],
        });
      }
    } else {
      const parentId = father ?? mother!;
      const parent = box(parentId);
      anchor = { x: parent.x + CW / 2, y: parent.y + CH };
    }

    const childBox = box(childId);
    const tx = childBox.x + CW / 2;
    const ty = childBox.y;
    const curve = Math.max(28, Math.abs(ty - anchor.y) * 0.5);
    const predecessor = ROYAL_PREDECESSOR.get(childId);
    const royal = Boolean(predecessor && (predecessor === father || predecessor === mother));
    edges.push({
      type: "child",
      d: `M${anchor.x} ${anchor.y}C${anchor.x} ${anchor.y + curve} ${tx} ${ty - curve} ${tx} ${ty}`,
      ids: [childId, father, mother].filter(Boolean) as string[],
      royal,
    });
  });

  return edges;
}

function autoLayoutTree(tree: TreeData): TreeData {
  const next = cloneTree(tree);
  const { people, order } = next;
  const ids = order.filter((id) => people[id]);
  const index = new Map<string, number>(ids.map((id, i) => [id, i]));
  const unionsById = new Map<string, Array<{ other: string; index: number }>>();
  next.unions.forEach((union, i) => {
    const left = unionsById.get(union.a) ?? [];
    left.push({ other: union.b, index: i });
    unionsById.set(union.a, left);
    const right = unionsById.get(union.b) ?? [];
    right.push({ other: union.a, index: i });
    unionsById.set(union.b, right);
  });

  const host: Record<string, string | undefined> = {};
  const attached = new Set<string>();
  for (const id of ids) {
    const person = people[id];
    if (person.attachTo && people[person.attachTo] && person.attachTo !== id) {
      host[id] = person.attachTo;
      attached.add(id);
      continue;
    }
    if (person.father && people[person.father] && person.father !== id) host[id] = person.father;
    else if (person.mother && people[person.mother] && person.mother !== id) host[id] = person.mother;
  }

  for (const id of ids) {
    let current = id;
    const seen = new Set<string>();
    while (host[current] && !seen.has(current)) {
      seen.add(current);
      current = host[current]!;
    }
    if (host[current] && seen.has(current)) {
      delete host[current];
      attached.delete(current);
    }
  }

  const roots = new Set(ids.filter((id) => people[id].root));
  for (let guard = 0; guard < 1000; guard += 1) {
    const unhosted = ids.filter((id) => !host[id] && !roots.has(id));
    if (!unhosted.length) break;
    let attachedOne = false;
    for (const id of unhosted) {
      const spouse = (unionsById.get(id) ?? []).map((item) => item.other).find((other) => host[other] || roots.has(other));
      if (spouse) {
        host[id] = spouse;
        attached.add(id);
        attachedOne = true;
      }
    }
    if (!attachedOne) roots.add(unhosted[0]);
  }

  const head = (id: string): string => (attached.has(id) && host[id] ? head(host[id]!) : id);
  const memberCache = new Map<string, string[]>();
  const members = (id: string) => {
    const cached = memberCache.get(id);
    if (cached) return cached;
    const attachedMembers = ids.filter((candidate) => attached.has(candidate) && head(candidate) === id);
    const sortKey = (candidate: string) => {
      const union = (unionsById.get(candidate) ?? []).find((item) => item.other === id);
      return union ? union.index : 1000 + (index.get(candidate) ?? 0);
    };
    const left = attachedMembers.filter((candidate) => people[candidate].side === "L").sort((a, b) => sortKey(a) - sortKey(b));
    const right = attachedMembers.filter((candidate) => people[candidate].side !== "L").sort((a, b) => sortKey(a) - sortKey(b));
    const result = [...left.reverse(), id, ...right];
    memberCache.set(id, result);
    return result;
  };
  const children = (id: string) => {
    const memberSet = new Set(members(id));
    return ids.filter((candidate) => !attached.has(candidate) && host[candidate] && memberSet.has(host[candidate]!) && candidate !== id);
  };

  const width: Record<string, number> = {};
  const rowWidth = (count: number) => count * CW + Math.max(0, count - 1) * SG;
  const childrenWidth = (id: string) => children(id).reduce((sum, child, i) => sum + width[child] + (i ? BG : 0), 0);
  const measure = (id: string) => {
    children(id).forEach(measure);
    width[id] = Math.max(rowWidth(members(id).length), childrenWidth(id));
  };
  const position: Record<string, Box> = {};
  const place = (id: string, left: number, generation: number) => {
    const row = members(id);
    const blockWidth = width[id];
    const rowLeft = left + (blockWidth - rowWidth(row.length)) / 2;
    row.forEach((member, i) => {
      position[member] = { x: rowLeft + i * (CW + SG), y: generation * ROW };
    });
    let cursor = left + (blockWidth - childrenWidth(id)) / 2;
    children(id).forEach((child) => {
      place(child, cursor, generation + 1);
      cursor += width[child] + BG;
    });
  };

  let cursor = 0;
  const rootIds = ids.filter((id) => !host[id]).sort((a, b) => Number(people[b].root) - Number(people[a].root) || (index.get(a) ?? 0) - (index.get(b) ?? 0));
  rootIds.forEach((root) => {
    measure(root);
    place(root, cursor, 0);
    cursor += width[root] + 140;
  });

  Object.entries(position).forEach(([id, point]) => {
    next.people[id].x = Math.round(point.x / 10) * 10;
    next.people[id].y = Math.round(point.y / 10) * 10;
  });
  return next;
}

function PersonCard({
  person,
  selected,
  related,
  editMode,
  onSelect,
  onPreview,
}: {
  person: HouseOfDragonPerson;
  selected: boolean;
  related: boolean;
  editMode: boolean;
  onSelect: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const color = houseColor(person.house);
  const contents = (
    <>
      <div className={styles.portraitWrap}>
        <MiniPortrait
          id={person.id}
          alt={person.name}
          size={42}
          className={styles.portrait}
          fallbackSrc={houseSigil(person.house)}
        />
        {KINGS.has(person.id) ? <span className={styles.crownBadge}>{svgCrown}</span> : null}
      </div>
      <span className={styles.cardCopy}>
        <span className={styles.cardName}>{person.name}</span>
        {person.epi ? <span className={styles.cardEpithet}>{person.epi}</span> : null}
        <span className={styles.cardMeta}>
          <span>{yearLabel(person)}</span>
          {person.dr && person.dr !== "-" ? <span>{person.dr}</span> : null}
        </span>
      </span>
    </>
  );

  return (
    <button
      data-tree-card={person.id}
      className={`${styles.personCard} ${selected ? styles.selectedCard : ""} ${related ? styles.relatedCard : ""} ${ROYAL_SET.has(person.id) ? styles.royalCard : ""}`}
      style={{
        left: person.x ?? 0,
        top: person.y ?? 0,
        "--house-color": color,
      } as CSSProperties}
      type="button"
      draggable={false}
      onClick={(event) => {
        if (editMode) {
          if (event.detail === 0) onSelect(person.id);
          return;
        }
        onPreview(person.id);
      }}
      aria-label={`${person.name}${editMode ? ", select for editing" : ", open character card"}`}
    >
      {contents}
    </button>
  );
}

export default function HouseOfDragonTree({ initialTree, canEdit }: { initialTree: TreeData; canEdit: boolean }) {
  const [tree, setTree] = useState<TreeData>(() => cloneTree(initialTree));
  const [view, setView] = useState<View>({ x: 44, y: 48, k: 0.72 });
  const [editMode, setEditMode] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [primary, setPrimary] = useState<string | null>(null);
  const [guideY, setGuideY] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState("");
  const [history, setHistory] = useState<{ past: string[]; future: string[] }>({ past: [], future: [] });
  const [marqueeRect, setMarqueeRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const panRef = useRef<PanState | null>(null);
  const marqueeRef = useRef<MarqueeState | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null);

  const edges = useMemo(() => computeEdges(tree), [tree]);

  const related = useMemo(() => {
    if (!primary || !tree.people[primary]) return new Set<string>();
    const set = new Set<string>();
    const person = tree.people[primary];
    if (person.father) set.add(person.father);
    if (person.mother) set.add(person.mother);
    tree.order.forEach((id) => {
      const item = tree.people[id];
      if (item && (item.father === primary || item.mother === primary)) set.add(id);
    });
    tree.unions.forEach((union) => {
      if (union.a === primary) set.add(union.b);
      if (union.b === primary) set.add(union.a);
    });
    return set;
  }, [primary, tree]);

  const bounds = useMemo(() => {
    const people = tree.order.map((id) => tree.people[id]).filter(Boolean);
    if (!people.length) return { minX: 0, minY: 0, maxX: CW, maxY: CH };
    const xs = people.map((person) => person.x ?? 0);
    const ys = people.map((person) => person.y ?? 0);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs) + CW,
      maxY: Math.max(...ys) + CH,
    };
  }, [tree]);

  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const pushHistory = useCallback((snapshot: string) => {
    setHistory((current) => ({ past: [...current.past.slice(-79), snapshot], future: [] }));
  }, []);

  const applyTree = useCallback((next: TreeData, snapshot?: string) => {
    if (snapshot) pushHistory(snapshot);
    setTree(next);
    setDirty(true);
  }, [pushHistory]);

  const fit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const width = Math.max(1, bounds.maxX - bounds.minX);
    const height = Math.max(1, bounds.maxY - bounds.minY);
    const k = Math.max(0.12, Math.min(1.08, (stage.clientWidth - 92) / width, (stage.clientHeight - 118) / height));
    setView({
      k,
      x: (stage.clientWidth - width * k) / 2 - bounds.minX * k,
      y: (stage.clientHeight - height * k) / 2 - bounds.minY * k,
    });
  }, [bounds]);

  useEffect(() => {
    const id = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    setView((current) => {
      const nextK = Math.max(0.12, Math.min(2.2, current.k * factor));
      return {
        k: nextK,
        x: px - (px - current.x) * (nextK / current.k),
        y: py - (py - current.y) * (nextK / current.k),
      };
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      zoomAt(event.clientX, event.clientY, Math.exp(-event.deltaY * 0.0015));
    };
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  const selectSingle = (id: string) => {
    if (!editMode) return;
    setSelected(new Set([id]));
    setPrimary(id);
  };

  const clearSelection = () => {
    setSelected(new Set());
    setPrimary(null);
  };

  const startMarquee = (pointerId: number, startX: number, startY: number, additive: boolean) => {
    if (!editMode || !pointerRef.current.has(pointerId) || !panRef.current || panRef.current.pointerId !== pointerId || panRef.current.moved) return;
    const base = additive ? new Set(selected) : new Set<string>();
    marqueeRef.current = { pointerId, startX, startY, currentX: startX, currentY: startY, base };
    panRef.current = null;
    updateMarquee(startX, startY);
  };

  const updateMarquee = (clientX: number, clientY: number) => {
    const stage = stageRef.current;
    const marquee = marqueeRef.current;
    if (!stage || !marquee) return;
    marquee.currentX = clientX;
    marquee.currentY = clientY;
    const rect = stage.getBoundingClientRect();
    const left = Math.min(marquee.startX, clientX);
    const right = Math.max(marquee.startX, clientX);
    const top = Math.min(marquee.startY, clientY);
    const bottom = Math.max(marquee.startY, clientY);
    setMarqueeRect({ left: left - rect.left, top: top - rect.top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) });

    const next = new Set(marquee.base);
    stage.querySelectorAll<HTMLElement>("[data-tree-card]").forEach((element) => {
      const card = element.getBoundingClientRect();
      if (card.right >= left && card.left <= right && card.bottom >= top && card.top <= bottom) {
        const id = element.dataset.treeCard;
        if (id) next.add(id);
      }
    });
    setSelected(next);
    setPrimary((current) => (current && next.has(current) ? current : next.values().next().value ?? null));
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(`.${styles.toolChrome}`)) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    pointerRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    cancelLongPress();

    if (pointerRef.current.size === 2) {
      const [a, b] = [...pointerRef.current.values()];
      pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.k };
      dragRef.current = null;
      panRef.current = null;
      marqueeRef.current = null;
      setMarqueeRect(null);
      return;
    }

    const target = event.target as HTMLElement;
    const card = target.closest<HTMLElement>("[data-tree-card]");
    const additive = event.ctrlKey || event.metaKey;

    if (card && !editMode) {
      pointerRef.current.delete(event.pointerId);
      return;
    }

    if (card && editMode) {
      event.preventDefault();
      const id = card.dataset.treeCard!;
      let activeIds: string[];
      if (additive) {
        const nextSelection = new Set(selected);
        if (nextSelection.has(id)) {
          nextSelection.delete(id);
          setSelected(nextSelection);
          setPrimary((current) => current === id ? (nextSelection.values().next().value ?? null) : current);
          dragRef.current = null;
          return;
        }
        nextSelection.add(id);
        setSelected(nextSelection);
        setPrimary(id);
        activeIds = [...nextSelection];
      } else if (!selected.has(id)) {
        selectSingle(id);
        activeIds = [id];
      } else {
        if (primary !== id) setPrimary(id);
        activeIds = [...selected];
      }

      const items = activeIds
        .filter((itemId) => tree.people[itemId])
        .map((itemId) => ({ id: itemId, x: tree.people[itemId].x ?? 0, y: tree.people[itemId].y ?? 0 }));
      const primaryItem = items.find((item) => item.id === id) ?? items[0];
      if (primaryItem) {
        dragRef.current = {
          id,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
          before: serialise(tree),
          items,
          primary: primaryItem,
        };
      }
    } else if (!card) {
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        viewX: view.x,
        viewY: view.y,
        moved: false,
      };
      if (editMode) {
        const sx = event.clientX;
        const sy = event.clientY;
        const pid = event.pointerId;
        longPressRef.current = setTimeout(() => startMarquee(pid, sx, sy, additive), 300);
      }
    }

    try { stage.setPointerCapture(event.pointerId); } catch { /* no-op */ }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointerRef.current.has(event.pointerId)) return;
    pointerRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (marqueeRef.current?.pointerId === event.pointerId) {
      event.preventDefault();
      updateMarquee(event.clientX, event.clientY);
      return;
    }

    if (pinchRef.current && pointerRef.current.size >= 2) {
      cancelLongPress();
      const [a, b] = [...pointerRef.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const targetScale = Math.max(0.12, Math.min(2.2, pinchRef.current.scale * distance / pinchRef.current.distance));
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, targetScale / view.k);
      return;
    }

    const drag = dragRef.current;
    if (drag && editMode) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
      if (!drag.moved) return;
      event.preventDefault();

      const targetX = Math.round((drag.primary.x + dx / view.k) / 10) * 10;
      let targetY = Math.round((drag.primary.y + dy / view.k) / 10) * 10;
      const excluded = new Set(drag.items.map((item) => item.id));
      const snapTarget = tree.order
        .filter((id) => !excluded.has(id) && tree.people[id])
        .map((id) => tree.people[id].y ?? 0)
        .reduce<{ value: number; distance: number } | null>((best, candidate) => {
          const distance = Math.abs(candidate - targetY);
          if (distance > SNAP_TOLERANCE / view.k) return best;
          if (!best || distance < best.distance) return { value: candidate, distance };
          return best;
        }, null);
      if (snapTarget) {
        targetY = snapTarget.value;
        setGuideY(snapTarget.value);
      } else {
        setGuideY(null);
      }

      const deltaX = targetX - drag.primary.x;
      const deltaY = targetY - drag.primary.y;
      setTree((current) => {
        const next = cloneTree(current);
        drag.items.forEach((item) => {
          if (!next.people[item.id]) return;
          next.people[item.id].x = item.x + deltaX;
          next.people[item.id].y = item.y + deltaY;
        });
        return next;
      });
      return;
    }

    const pan = panRef.current;
    if (pan) {
      const dx = event.clientX - pan.startX;
      const dy = event.clientY - pan.startY;
      if (!pan.moved && Math.hypot(dx, dy) > 6) {
        pan.moved = true;
        cancelLongPress();
      }
      if (pan.moved) {
        event.preventDefault();
        setView((current) => ({ ...current, x: pan.viewX + dx, y: pan.viewY + dy }));
      }
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    pointerRef.current.delete(event.pointerId);
    cancelLongPress();
    if (pointerRef.current.size < 2) pinchRef.current = null;

    if (marqueeRef.current?.pointerId === event.pointerId) {
      updateMarquee(event.clientX, event.clientY);
      marqueeRef.current = null;
      setMarqueeRect(null);
      try { stageRef.current?.releasePointerCapture(event.pointerId); } catch { /* no-op */ }
      return;
    }

    const drag = dragRef.current;
    if (drag) {
      if (drag.moved) {
        pushHistory(drag.before);
        setDirty(true);
      }
      dragRef.current = null;
      setGuideY(null);
    }

    const pan = panRef.current;
    if (pan) {
      if (!pan.moved && editMode) clearSelection();
      panRef.current = null;
    }
    try { stageRef.current?.releasePointerCapture(event.pointerId); } catch { /* no-op */ }
  };

  const undo = () => {
    setHistory((current) => {
      const snapshot = current.past.at(-1);
      if (!snapshot) return current;
      const future = [serialise(tree), ...current.future].slice(0, 80);
      setTree(JSON.parse(snapshot) as TreeData);
      setDirty(true);
      return { past: current.past.slice(0, -1), future };
    });
  };

  const redo = () => {
    setHistory((current) => {
      const snapshot = current.future[0];
      if (!snapshot) return current;
      setTree(JSON.parse(snapshot) as TreeData);
      setDirty(true);
      return { past: [...current.past, serialise(tree)].slice(-80), future: current.future.slice(1) };
    });
  };

  const arrange = () => {
    const before = serialise(tree);
    applyTree(autoLayoutTree(tree), before);
    requestAnimationFrame(fit);
  };

  const updatePerson = <K extends keyof HouseOfDragonPerson>(field: K, value: HouseOfDragonPerson[K]) => {
    if (!primary) return;
    const before = serialise(tree);
    const next = cloneTree(tree);
    if (!next.people[primary]) return;
    next.people[primary][field] = value;
    applyTree(next, before);
  };

  const addPerson = () => {
    const before = serialise(tree);
    const next = cloneTree(tree);
    const base = "new-person";
    let i = 1;
    let id = `${base}-${i}`;
    while (next.people[id]) id = `${base}-${++i}`;
    const stage = stageRef.current;
    const centerX = stage ? (stage.clientWidth / 2 - view.x) / view.k - CW / 2 : 0;
    const centerY = stage ? (stage.clientHeight / 2 - view.y) / view.k - CH / 2 : 0;
    next.people[id] = {
      id,
      name: "New person",
      epi: "",
      house: "House Targaryen",
      b: null,
      d: null,
      st: "Unknown",
      dr: "",
      sx: "M",
      father: null,
      mother: null,
      attachTo: null,
      side: "R",
      root: false,
      note: "",
      x: Math.round(centerX / 10) * 10,
      y: Math.round(centerY / 10) * 10,
    };
    next.order.push(id);
    applyTree(next, before);
    setSelected(new Set([id]));
    setPrimary(id);
  };

  const removePerson = () => {
    if (!primary) return;
    const person = tree.people[primary];
    if (!person || !window.confirm(`Delete ${person.name} from this lineage?`)) return;
    const before = serialise(tree);
    const next = cloneTree(tree);
    delete next.people[primary];
    next.order = next.order.filter((id) => id !== primary);
    next.unions = next.unions.filter((union) => union.a !== primary && union.b !== primary);
    next.order.forEach((id) => {
      const item = next.people[id];
      if (!item) return;
      if (item.father === primary) item.father = null;
      if (item.mother === primary) item.mother = null;
      if (item.attachTo === primary) item.attachTo = null;
    });
    applyTree(next, before);
    clearSelection();
  };

  const addUnion = (other: string) => {
    if (!primary || !other || other === primary) return;
    if (tree.unions.some((union) => (union.a === primary && union.b === other) || (union.a === other && union.b === primary))) return;
    const before = serialise(tree);
    const next = cloneTree(tree);
    next.unions.push({ a: primary, b: other, label: "" });
    applyTree(next, before);
  };

  const removeUnion = (union: HouseOfDragonUnion) => {
    const before = serialise(tree);
    const next = cloneTree(tree);
    next.unions = next.unions.filter((item) => item !== union && !(item.a === union.a && item.b === union.b && item.label === union.label));
    applyTree(next, before);
  };

  const toggleEditMode = () => {
    if (!canEdit) return;
    if (editMode) clearSelection();
    else setPreviewId(null);
    setEditMode(!editMode);
  };

  const publish = async () => {
    if (!canEdit || publishing) return;
    setPublishing(true);
    setPublishMessage("Publishing…");
    try {
      const response = await fetch("/api/admin/house-of-the-dragon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tree }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.message || result?.error || "Publish failed");
      setDirty(false);
      setPublishMessage("Published to Supabase. The live lineage is updated immediately.");
    } catch (error) {
      setPublishMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setPublishing(false);
    }
  };

  const activePerson = primary ? tree.people[primary] : null;
  const previewPerson = previewId ? tree.people[previewId] : null;
  const previewProfile = previewId ? CHARACTER_BY_ID.get(previewId) : undefined;
  const activeUnions = activePerson
    ? tree.unions.filter((union) => union.a === activePerson.id || union.b === activePerson.id)
    : [];

  return (
    <div className={`${styles.toolLayout} ${editMode ? styles.editorLayout : ""}`}>
      <section className={styles.mapPanel}>
        <div className={`${styles.toolbar} ${styles.toolChrome}`}>
          <div className={styles.toolbarIdentity}>
            <span className={styles.toolbarEyebrow}>Targaryen Dynasty</span>
            <strong>{editMode ? "Lineage Editor" : "House of the Dragon"}</strong>
          </div>
          <div className={styles.toolbarActions}>
            {canEdit ? (
              <button
                type="button"
                className={styles.adminToggleButton}
                aria-pressed={editMode}
                onClick={toggleEditMode}
              >
                {editMode ? "Exit Admin View" : "Admin View"}
              </button>
            ) : (
              <span className={styles.readOnlyPill}>Read only</span>
            )}
            {editMode ? (
              <>
                <button type="button" onClick={addPerson}>Add person</button>
                <button type="button" onClick={arrange}>Arrange</button>
                <button type="button" onClick={undo} disabled={!history.past.length}>Undo</button>
                <button type="button" onClick={redo} disabled={!history.future.length}>Redo</button>
                <button type="button" className={styles.publishButton} onClick={publish} disabled={publishing || !dirty}>
                  {publishing ? "Publishing…" : dirty ? "Publish changes" : "Published"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div
          ref={stageRef}
          className={styles.stage}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          onContextMenu={(event) => event.preventDefault()}
        >
          <div className={styles.brandWatermark} aria-hidden="true">
            <Image src="/images/houses/targaryen.webp" alt="" width={96} height={96} priority />
            <span>House Targaryen</span>
            <strong>A Song of Fire and Blood</strong>
          </div>

          {previewPerson && !editMode ? (
            <div
              className={`${styles.characterPreview} ${styles.toolChrome}`}
              style={{ "--house-color": houseColor(previewPerson.house) } as CSSProperties}
            >
              <button
                type="button"
                className={styles.characterPreviewClose}
                onClick={() => setPreviewId(null)}
                aria-label="Close character card"
              >
                <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
              </button>
              <MiniPortrait
                id={previewPerson.id}
                alt={previewPerson.name}
                size={52}
                className={styles.characterPreviewPortrait}
                fallbackSrc={houseSigil(previewPerson.house)}
              />
              <div className={styles.characterPreviewCopy}>
                <strong>{previewPerson.name}</strong>
                <span className={styles.characterPreviewTitle}>
                  {previewProfile?.title || previewPerson.epi || previewPerson.house}
                </span>
                <span className={styles.characterPreviewMeta}>
                  {previewPerson.house}
                  {previewPerson.dr && previewPerson.dr !== "-" ? ` · ${previewPerson.dr}` : ""}
                </span>
                {CHARACTER_IDS.has(previewPerson.id) ? (
                  <Link href={`/characters/${previewPerson.id}`} className={styles.characterPreviewLink}>
                    View full profile
                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5" /></svg>
                  </Link>
                ) : (
                  <span className={styles.characterPreviewRecord}>Lineage record</span>
                )}
              </div>
            </div>
          ) : null}

          <div
            className={styles.world}
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
          >
            <svg className={styles.edges} aria-hidden="true">
              {edges.map((edge, index) => {
                const highlighted = edge.ids.some((id) => selected.has(id));
                return (
                  <g key={`${edge.type}-${index}`}>
                    <path
                      d={edge.d}
                      className={`${styles.edge} ${styles[`edge_${edge.type}`]} ${edge.royal ? styles.royalEdge : ""} ${highlighted ? styles.highlightEdge : ""}`}
                    />
                    {edge.type === "marriage" && edge.dotX != null && edge.dotY != null ? (
                      <circle cx={edge.dotX} cy={edge.dotY} r="3" className={styles.unionDot} />
                    ) : null}
                    {edge.label && edge.labelX != null && edge.labelY != null ? (
                      <text x={edge.labelX} y={edge.labelY} className={styles.edgeLabel}>{edge.label}</text>
                    ) : null}
                  </g>
                );
              })}
            </svg>

            {guideY != null ? <div className={styles.generationGuide} style={{ top: guideY + CH / 2 }} /> : null}

            {tree.order.map((id) => {
              const person = tree.people[id];
              if (!person) return null;
              return (
                <PersonCard
                  key={id}
                  person={person}
                  selected={selected.has(id) || previewId === id}
                  related={related.has(id)}
                  editMode={editMode}
                  onSelect={selectSingle}
                  onPreview={setPreviewId}
                />
              );
            })}
          </div>

          {marqueeRect ? <div className={styles.marquee} style={marqueeRect} /> : null}

          <div className={`${styles.hint} ${styles.toolChrome}`}>
            {editMode
              ? "Drag cards · Ctrl/Cmd + click for multi-select · hold and drag empty space to box-select · generations snap into alignment"
              : "Drag empty space to pan · wheel to zoom · click a character to open their card"}
          </div>

          <div className={`${styles.zoomHud} ${styles.toolChrome}`}>
            <button type="button" aria-label="Zoom out" onClick={() => {
              const rect = stageRef.current?.getBoundingClientRect();
              if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.2);
            }}>
              <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h10" /></svg>
            </button>
            <span>{Math.round(view.k * 100)}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => {
              const rect = stageRef.current?.getBoundingClientRect();
              if (rect) zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.2);
            }}>
              <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 4v10M4 9h10" /></svg>
            </button>
            <button type="button" onClick={fit}>Fit</button>
          </div>
        </div>
        {publishMessage ? <p className={styles.publishMessage}>{publishMessage}</p> : null}
      </section>

      {editMode ? (
        <aside className={styles.inspector}>
          {!activePerson ? (
            <div className={styles.inspectorEmpty}>
              <span className={styles.inspectorEyebrow}>Admin editor</span>
              <h2>Select a card</h2>
              <p>Edit lineage data here, then publish it to the live site. Character profile data remains managed through the Characters admin page.</p>
            </div>
          ) : (
            <>
              <div className={styles.inspectorHeader}>
                <div>
                  <span className={styles.inspectorEyebrow}>{selected.size > 1 ? `${selected.size} selected` : "Selected card"}</span>
                  <h2>{activePerson.name}</h2>
                </div>
                {CHARACTER_IDS.has(activePerson.id) ? <Link href={`/characters/${activePerson.id}`}>Open profile</Link> : null}
              </div>

              <div className={styles.formGrid}>
                <label className={styles.wide}>Name<input value={activePerson.name} onChange={(event) => updatePerson("name", event.target.value)} /></label>
                <label className={styles.wide}>Epithet / note line<input value={activePerson.epi} onChange={(event) => updatePerson("epi", event.target.value)} /></label>
                <label>Birth year<input type="number" value={activePerson.b ?? ""} onChange={(event) => updatePerson("b", event.target.value === "" ? null : Number(event.target.value))} /></label>
                <label>Death year<input type="number" value={activePerson.d ?? ""} onChange={(event) => updatePerson("d", event.target.value === "" ? null : Number(event.target.value))} /></label>
                <label>Status<select value={activePerson.st} onChange={(event) => updatePerson("st", event.target.value as HouseOfDragonPerson["st"])}><option>Alive</option><option>Dead</option><option>Missing</option><option>Unknown</option></select></label>
                <label>Sex<select value={activePerson.sx} onChange={(event) => updatePerson("sx", event.target.value as HouseOfDragonPerson["sx"])}><option value="M">Male</option><option value="F">Female</option></select></label>
                <label>Dragon<input value={activePerson.dr} onChange={(event) => updatePerson("dr", event.target.value)} /></label>
                <label>House<input value={activePerson.house} onChange={(event) => updatePerson("house", event.target.value)} /></label>
                <label>Father<select value={activePerson.father ?? ""} onChange={(event) => updatePerson("father", event.target.value || null)}><option value="">—</option>{tree.order.filter((id) => id !== activePerson.id).map((id) => <option key={id} value={id}>{tree.people[id]?.name}</option>)}</select></label>
                <label>Mother<select value={activePerson.mother ?? ""} onChange={(event) => updatePerson("mother", event.target.value || null)}><option value="">—</option>{tree.order.filter((id) => id !== activePerson.id).map((id) => <option key={id} value={id}>{tree.people[id]?.name}</option>)}</select></label>
                <label className={styles.wide}>Notes<textarea value={activePerson.note} onChange={(event) => updatePerson("note", event.target.value)} /></label>
              </div>

              <div className={styles.inspectorSection}>
                <h3>Unions</h3>
                {activeUnions.length ? activeUnions.map((union, index) => {
                  const otherId = union.a === activePerson.id ? union.b : union.a;
                  return (
                    <div className={styles.unionRow} key={`${union.a}-${union.b}-${index}`}>
                      <span>{tree.people[otherId]?.name ?? otherId}</span>
                      <button type="button" onClick={() => removeUnion(union)}>Remove</button>
                    </div>
                  );
                }) : <p className={styles.muted}>No unions recorded.</p>}
                <select defaultValue="" onChange={(event) => { addUnion(event.target.value); event.target.value = ""; }}>
                  <option value="">Add union…</option>
                  {tree.order.filter((id) => id !== activePerson.id).map((id) => <option key={id} value={id}>{tree.people[id]?.name}</option>)}
                </select>
              </div>

              <button type="button" className={styles.deleteButton} onClick={removePerson}>Delete from lineage</button>
            </>
          )}
        </aside>
      ) : null}
    </div>
  );
}
