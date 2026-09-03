"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

import {
  applyAction,
  BOARD_LIMIT,
  createGame,
  DRAGON_BOARD_LIMIT,
  getEffectiveCost,
  getEffectiveInfluence,
  getEffectivePower,
  getMaximumHealth,
  getMilitaryTargetOptions,
  getPoliticalDefenseOptions,
  MAX_MULLIGAN_REPLACEMENTS,
  opponentOf,
  unitHasTrait,
} from "@/lib/the-great-game/engine";

import {
  getGameCard,
  isUnitCard,
} from "@/lib/the-great-game/cards";

import type {
  AbilityTrigger,
  GameAction,
  GameCard,
  GameState,
  HandCardState,
  PlayerId,
  TierId,
  UnitState,
} from "@/lib/the-great-game/types";

import styles from "./play.module.css";

type PageMode =
  | "menu"
  | "game";

type PendingPlay =
  | {
      kind: "deploy";
      handInstanceId: string;
      hidePreview?: boolean;
    }
  | {
      kind: "confirm";
      handInstanceId: string;
      hidePreview?: boolean;
    }
  | {
      kind: "artifact";
      handInstanceId: string;
      hidePreview?: boolean;
    }
  | {
      kind: "word-in-right-ear";
      handInstanceId: string;
      hidePreview?: boolean;
    }
  | {
      kind: "brothers-tilt";
      handInstanceId: string;
      hidePreview?: boolean;
    }
  | {
      kind: "trial-by-combat";
      handInstanceId: string;
      firstTargetInstanceId?: string;
      hidePreview?: boolean;
    };

type PendingConflict =
  | {
      kind: "military";
      attackerInstanceId: string;
    }
  | {
      kind: "political";
      attackerInstanceId: string;
      legalDefenders: string[];
      selectionBy:
        | "attacker"
        | "defender"
        | "none";
      unopposed: boolean;
    };

type DragCursorState = {
  x: number;
  y: number;
  canDrop: boolean;
  requiresTarget: boolean;
};

type PointerDragSession = {
  handInstanceId: string;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
};

type PointerDropTarget =
  | {
      kind: "board";
    }
  | {
      kind: "unit";
      unit: UnitState;
    };

type UnitModifier =
  UnitState["modifiers"][number];

type PendingDrawAnimation = {
  playerId: PlayerId;
  handInstanceId: string;
  cardId: string;
  cost: number;
};

type ActiveDrawAnimation =
  PendingDrawAnimation & {
    animationId: number;
    startX: number;
    startY: number;
    middleX: number;
    middleY: number;
    endX: number;
    endY: number;
  };

type FanCardProperties =
  CSSProperties & {
    "--fan-angle": string;
    "--fan-y": string;
    "--fan-z": number;
  };

type DrawFlightProperties =
  CSSProperties & {
    "--draw-start-x": string;
    "--draw-start-y": string;
    "--draw-middle-x": string;
    "--draw-middle-y": string;
    "--draw-end-x": string;
    "--draw-end-y": string;
  };

const TIER_MAP = new Map<
  TierId,
  {
    label: string;
    order: number;
    color: string;
    accentColor: string;
  }
>([
  [
    "s-plus",
    {
      label: "S+",
      order: 0,
      color: "#8b1e2b",
      accentColor: "#d4af37",
    },
  ],
  [
    "s",
    {
      label: "S",
      order: 1,
      color: "#4b2e6f",
      accentColor: "#c0c0c0",
    },
  ],
  [
    "a",
    {
      label: "A",
      order: 2,
      color: "#2f4a3e",
      accentColor: "#a97142",
    },
  ],
  [
    "b",
    {
      label: "B",
      order: 3,
      color: "#3d3d3d",
      accentColor: "#8c8c8c",
    },
  ],
  [
    "c",
    {
      label: "C",
      order: 4,
      color: "#5c4a3a",
      accentColor: "#7a6a58",
    },
  ],
]);

function tierStyle(
  card: GameCard
): CSSProperties {
  const tier =
    TIER_MAP.get(
      card.tierId
    );

  return {
    "--tier-accent":
      tier?.accentColor ??
      "#d4af37",

    "--tier-color":
      tier?.color ??
      "#d4af37",
  } as CSSProperties;
}

function fanCardStyle(
  card: GameCard,
  index: number,
  count: number
): FanCardProperties {
  const middle =
    (count - 1) / 2;

  const normalized =
    middle === 0
      ? 0
      : (index - middle) /
        middle;

  const maximumAngle =
    Math.min(
      6.5,
      3.8 + count * 0.35
    );

  const verticalOffset =
    Math.pow(
      Math.abs(normalized),
      1.65
    ) * 13;

  return {
    ...tierStyle(card),
    "--fan-angle": `${normalized * maximumAngle}deg`,
    "--fan-y": `${verticalOffset}px`,
    "--fan-z": index + 1,
  } as FanCardProperties;
}

function drawFlightStyle(
  flight: ActiveDrawAnimation,
  card: GameCard
): DrawFlightProperties {
  return {
    ...tierStyle(card),
    "--draw-start-x": `${flight.startX}px`,
    "--draw-start-y": `${flight.startY}px`,
    "--draw-middle-x": `${flight.middleX}px`,
    "--draw-middle-y": `${flight.middleY}px`,
    "--draw-end-x": `${flight.endX}px`,
    "--draw-end-y": `${flight.endY}px`,
  } as DrawFlightProperties;
}

function tierLabel(
  card: GameCard
): string {
  return (
    TIER_MAP.get(
      card.tierId
    )?.label ??
    card.tierId
  );
}

function abilityTypeLabel(
  trigger: AbilityTrigger
): string {
  switch (trigger) {
    case "arrival":
      return "Arrival";

    case "fall":
      return "Fall";

    case "victory":
      return "Victory";

    case "start-of-turn":
      return "Start of Turn";

    case "end-of-turn":
      return "End of Turn";

    case "passive":
      return "Passive";

    case "event":
      return "Effect";

    case "bond":
      return "Bond";
  }
}

function abilityNameLabel(
  trigger: AbilityTrigger,
  name: string
): string {
  if (trigger !== "bond") {
    return name;
  }

  return (
    name
      .replace(
        /^bond\s*(?:—|–|-|:)\s*/i,
        ""
      )
      .trim() || name
  );
}

function playerName(
  playerId: PlayerId
) {
  return playerId ===
    "player1"
    ? "Player 1"
    : "Player 2";
}

function humanizeModifierId(
  id: string
): string {
  return id
    .replace(/^[^:]+:/, "")
    .split(/[-_:]+/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

function modifierTitle(
  modifier: UnitModifier
): string {
  const onlyInfluence =
    Boolean(modifier.influence) &&
    !modifier.power &&
    !modifier.health &&
    !modifier.cost;

  if (
    modifier.permanent &&
    onlyInfluence &&
    modifier.influence === 2
  ) {
    return "The Mander's Pact";
  }

  if (
    !modifier.permanent &&
    onlyInfluence &&
    modifier.influence === 1 &&
    modifier.expiresAt ===
      "end-of-current-turn"
  ) {
    return "A Word in the Right Ear";
  }

  if (
    modifier.permanent &&
    Boolean(modifier.power) &&
    !modifier.influence &&
    !modifier.health &&
    !modifier.cost
  ) {
    return "The Brothers' Tilt";
  }

  if (/^modifier-\d+$/i.test(modifier.id)) {
    return "Active Effect";
  }

  return humanizeModifierId(
    modifier.id
  );
}

function modifierDescription(
  modifier: UnitModifier
): string {
  const changes: string[] = [];

  const addChange = (
    value: number | undefined,
    label: string
  ) => {
    if (!value) return;

    changes.push(
      `${value > 0 ? "+" : ""}${value} ${label}`
    );
  };

  addChange(modifier.power, "Power");
  addChange(modifier.influence, "Influence");
  addChange(modifier.health, "Health");
  addChange(modifier.cost, "Command cost");

  const duration = modifier.permanent
    ? "Permanent"
    : modifier.expiresAt ===
        "start-of-controller-next-turn"
      ? "Until the start of its controller's next turn"
      : modifier.expiresAt ===
          "end-of-controller-turn"
        ? "Until the end of its controller's turn"
        : "Until the end of the current turn";

  return `${changes.join(", ") || "Ongoing effect"} · ${duration}`;
}

function CardSparkles() {
  return (
    <span
      className={styles.cardSparkles}
      aria-hidden
    >
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}

function HorizontalHand({
  children,
  fanned = false,
  active = false,
}: {
  children: ReactNode;
  fanned?: boolean;
  active?: boolean;
}) {
  const handRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    const hand = handRef.current;

    if (!hand) {
      return;
    }

    const handleWheel = (
      event: WheelEvent
    ) => {
      const maxScroll =
        hand.scrollWidth -
        hand.clientWidth;

      if (maxScroll <= 0) {
        return;
      }

      const rawDelta =
        Math.abs(event.deltaY) >=
        Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX;

      const deltaScale =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? hand.clientWidth
            : 1;

      const delta =
        rawDelta * deltaScale;

      const nextScroll = Math.max(
        0,
        Math.min(
          maxScroll,
          hand.scrollLeft + delta
        )
      );

      if (
        nextScroll ===
        hand.scrollLeft
      ) {
        return;
      }

      event.preventDefault();
      hand.scrollLeft = nextScroll;
    };

    hand.addEventListener(
      "wheel",
      handleWheel,
      { passive: false }
    );

    return () => {
      hand.removeEventListener(
        "wheel",
        handleWheel
      );
    };
  }, []);

  return (
    <div
      ref={handRef}
      className={`${styles.hand} ${
        fanned
          ? styles.fannedHand
          : ""
      }`}
      data-active-hand={
        active
          ? "true"
          : undefined
      }
    >
      <div
        className={
          fanned
            ? styles.handFanTrack
            : styles.handLinearTrack
        }
      >
        {children}
      </div>
    </div>
  );
}

function visibleTraits(
  card: GameCard
) {
  return card.traits.filter(
    (trait) => {
      if (
        trait === "unique"
      ) {
        return false;
      }

      if (
        card.cardType ===
          "dragon" &&
        trait === "dragon"
      ) {
        return false;
      }

      return true;
    }
  );
}

const ART_EXTENSIONS = [
  "webp",
  "png",
  "jpg",
  "jpeg",
];

function getArtworkCandidates(
  card: GameCard
): string[] {
  const paths: string[] = [];

  if (
    card.cardType ===
    "character"
  ) {
    const id =
      card.linkedCharacterId ??
      card.id;

    for (
      const extension of
      ART_EXTENSIONS
    ) {
      paths.push(
        `/images/characters/${id}.${extension}`
      );
    }
  }

  if (
    card.cardType ===
    "dragon"
  ) {
    for (
      const extension of
      ART_EXTENSIONS
    ) {
      paths.push(
        `/images/dragons/${card.id}.${extension}`
      );
    }
  }

  for (
    const extension of
    ART_EXTENSIONS
  ) {
    paths.push(
      `/images/cards/${card.id}.${extension}`
    );
  }

  return paths;
}

function CardArtwork({
  card,
  className,
}: {
  card: GameCard;
  className?: string;
}) {
  const candidates =
    useMemo(
      () =>
        getArtworkCandidates(
          card
        ),
      [card]
    );

  const [
    candidateIndex,
    setCandidateIndex,
  ] =
    useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [card.id]);

  if (
    candidateIndex >=
    candidates.length
  ) {
    return (
      <div
        className={`${styles.artworkFallback} ${
          className ?? ""
        }`}
      >
        <span>✦</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        candidates[
          candidateIndex
        ]
      }
      alt={card.name}
      className={
        className
      }
      draggable={false}
      onError={() =>
        setCandidateIndex(
          (current) =>
            current + 1
        )
      }
    />
  );
}

export default function GreatGamePlayPage() {
  const [
    mode,
    setMode,
  ] =
    useState<PageMode>(
      "menu"
    );

  const [
    game,
    setGame,
  ] =
    useState<GameState | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const [
    pendingPlay,
    setPendingPlay,
  ] =
    useState<PendingPlay | null>(
      null
    );

  const [
    pendingConflict,
    setPendingConflict,
  ] =
    useState<PendingConflict | null>(
      null
    );

  const [
    handoff,
    setHandoff,
  ] =
    useState(false);

  const [
    mulliganSelected,
    setMulliganSelected,
  ] =
    useState<string[]>([]);

  const [
    draggingHandInstanceId,
    setDraggingHandInstanceId,
  ] =
    useState<string | null>(
      null
    );

  const [
    dragCursor,
    setDragCursor,
  ] =
    useState<DragCursorState | null>(
      null
    );

  const pointerDragRef =
    useRef<PointerDragSession | null>(
      null
    );

  const suppressHandClickRef =
    useRef(false);

  const [
    exitConfirm,
    setExitConfirm,
  ] =
    useState(false);

  const [
    inspectedUnitId,
    setInspectedUnitId,
  ] = useState<string | null>(null);

  const [
    drawQueue,
    setDrawQueue,
  ] = useState<PendingDrawAnimation[]>([]);

  const [
    drawFlight,
    setDrawFlight,
  ] = useState<ActiveDrawAnimation | null>(null);

  const [
    hiddenDrawnIds,
    setHiddenDrawnIds,
  ] = useState<string[]>([]);

  const drawAnimationIdRef =
    useRef(0);

  const drawSequenceCompleteRef =
    useRef<(() => void) | null>(null);

  const incomingTurnDrawsRef =
    useRef<PendingDrawAnimation[]>([]);

  useEffect(() => {
    if (
      handoff ||
      drawFlight ||
      drawQueue.length === 0
    ) {
      return;
    }

    const animationFrame =
      requestAnimationFrame(() => {
        const draw =
          drawQueue[0];

        const source =
          document.querySelector<HTMLElement>(
            `[data-deck-anchor="${draw.playerId}"]`
          );

        const target =
          document.querySelector<HTMLElement>(
            `[data-hand-instance-id="${draw.handInstanceId}"]`
          );

        const hand =
          document.querySelector<HTMLElement>(
            '[data-active-hand="true"]'
          );

        const sourceRect =
          source?.getBoundingClientRect();

        const targetRect =
          target?.getBoundingClientRect();

        const handRect =
          hand?.getBoundingClientRect();

        const flightWidth =
          Math.min(
            178,
            Math.max(
              136,
              window.innerWidth * 0.12
            )
          );

        const startX =
          (sourceRect
            ? sourceRect.left +
              sourceRect.width / 2
            : window.innerWidth - 62) -
          flightWidth / 2;

        const startY =
          (sourceRect
            ? sourceRect.top +
              sourceRect.height / 2
            : window.innerHeight * 0.24) -
          (flightWidth * 1.4) / 2;

        const fallbackEndX =
          handRect
            ? handRect.left +
              handRect.width / 2 -
              flightWidth / 2
            : window.innerWidth / 2 -
              flightWidth / 2;

        const fallbackEndY =
          handRect
            ? handRect.top + 24
            : window.innerHeight -
              flightWidth * 1.55;

        const endX =
          targetRect
            ? targetRect.left +
              targetRect.width / 2 -
              flightWidth / 2
            : fallbackEndX;

        const endY =
          targetRect
            ? targetRect.top
            : fallbackEndY;

        drawAnimationIdRef.current +=
          1;

        setDrawFlight({
          ...draw,
          animationId:
            drawAnimationIdRef.current,
          startX,
          startY,
          middleX:
            startX +
            (endX - startX) * 0.55,
          middleY:
            Math.max(
              24,
              Math.min(
                startY,
                endY
              ) - 112
            ),
          endX,
          endY,
        });
      });

    return () =>
      cancelAnimationFrame(
        animationFrame
      );
  }, [
    drawFlight,
    drawQueue,
    handoff,
  ]);

  useEffect(() => {
    if (
      drawFlight ||
      drawQueue.length > 0 ||
      !drawSequenceCompleteRef.current
    ) {
      return;
    }

    const onComplete =
      drawSequenceCompleteRef.current;

    drawSequenceCompleteRef.current =
      null;

    onComplete();
  }, [drawFlight, drawQueue]);

  function collectNewDraws(
    before: GameState,
    after: GameState,
    playerId: PlayerId
  ): PendingDrawAnimation[] {
    const previousIds =
      new Set(
        before.players[
          playerId
        ].hand.map(
          (card) =>
            card.instanceId
        )
      );

    return after.players[
      playerId
    ].hand
      .filter(
        (card) =>
          !previousIds.has(
            card.instanceId
          )
      )
      .map((card) => ({
        playerId,
        handInstanceId:
          card.instanceId,
        cardId: card.cardId,
        cost:
          getEffectiveCost(
            after,
            playerId,
            card
          ),
      }));
  }

  function startDrawSequence(
    draws: PendingDrawAnimation[],
    onComplete?: () => void
  ) {
    if (draws.length === 0) {
      onComplete?.();
      return;
    }

    drawSequenceCompleteRef.current =
      onComplete ?? null;

    setHiddenDrawnIds(
      (current) => [
        ...new Set([
          ...current,
          ...draws.map(
            (draw) =>
              draw.handInstanceId
          ),
        ]),
      ]
    );

    setDrawQueue(draws);
  }

  function finishDrawFlight() {
    if (!drawFlight) {
      return;
    }

    const finishedId =
      drawFlight.handInstanceId;

    setHiddenDrawnIds(
      (current) =>
        current.filter(
          (id) =>
            id !== finishedId
        )
    );

    setDrawFlight(null);

    setDrawQueue(
      (current) =>
        current.slice(1)
    );
  }

  function beginHandoffTurn() {
    const draws =
      incomingTurnDrawsRef.current;

    incomingTurnDrawsRef.current =
      [];

    if (draws.length > 0) {
      startDrawSequence(draws);
    }

    setHandoff(false);
  }

  function startNewGame() {
    setGame(
      createGame()
    );

    setMode(
      "game"
    );

    setError(null);
    setPendingPlay(null);
    setPendingConflict(null);
    setHandoff(false);
    setMulliganSelected([]);
    setDraggingHandInstanceId(null);
    setDragCursor(null);
    setExitConfirm(false);
    setInspectedUnitId(null);
    setDrawQueue([]);
    setDrawFlight(null);
    setHiddenDrawnIds([]);
    drawSequenceCompleteRef.current =
      null;
    incomingTurnDrawsRef.current =
      [];
  }

  function exitToMenu() {
    setGame(null);

    setMode(
      "menu"
    );

    setError(null);
    setPendingPlay(null);
    setPendingConflict(null);
    setHandoff(false);
    setMulliganSelected([]);
    setDraggingHandInstanceId(null);
    setDragCursor(null);
    setExitConfirm(false);
    setInspectedUnitId(null);
    setDrawQueue([]);
    setDrawFlight(null);
    setHiddenDrawnIds([]);
    drawSequenceCompleteRef.current =
      null;
    incomingTurnDrawsRef.current =
      [];
  }

  if (
    mode === "menu"
  ) {
    return (
      <MainMenu
        onNewGame={
          startNewGame
        }
      />
    );
  }

  if (!game) {
    return null;
  }

  const currentGame: GameState = game;

  const activePlayerId =
    currentGame.activePlayerId;

  const enemyPlayerId =
    opponentOf(
      activePlayerId
    );

  const activePlayer =
    currentGame.players[
      activePlayerId
    ];

  const enemyPlayer =
    currentGame.players[
      enemyPlayerId
    ];

  const alliedCharacters =
    activePlayer.board.filter(
      (unit) =>
        getGameCard(
          unit.cardId
        ).cardType ===
        "character"
    );

  const enemyCharacters =
    enemyPlayer.board.filter(
      (unit) =>
        getGameCard(
          unit.cardId
        ).cardType ===
        "character"
    );

  const allCharacters = [
    ...alliedCharacters,
    ...enemyCharacters,
  ];

  const selectedHandCard =
    pendingPlay
      ? activePlayer.hand.find(
          (handCard) =>
            handCard.instanceId ===
            pendingPlay.handInstanceId
        ) ?? null
      : null;

  const selectedCard =
    selectedHandCard
      ? getGameCard(
          selectedHandCard.cardId
        )
      : null;

  const inspectedUnit =
    inspectedUnitId
      ? [
          ...activePlayer.board,
          ...enemyPlayer.board,
        ].find(
          (unit) =>
            unit.instanceId === inspectedUnitId
        ) ?? null
      : null;

  const drawAnimationActive =
    Boolean(
      drawFlight ||
        drawQueue.length > 0
    );

  const gameInteractionLocked =
    Boolean(
      currentGame.pendingEffect ||
        drawAnimationActive
    );

  function dispatch(
    action: GameAction
  ): boolean {
    const result =
      applyAction(
        currentGame,
        action
      );

    if (!result.ok) {
      setError(
        result.error ??
          "Action failed."
      );

      return false;
    }

    const draws =
      collectNewDraws(
        currentGame,
        result.state,
        currentGame.activePlayerId
      );

    setGame(
      result.state
    );

    setError(null);

    setPendingPlay(
      null
    );

    setPendingConflict(
      null
    );

    setDraggingHandInstanceId(
      null
    );

    setDragCursor(null);

    setInspectedUnitId(null);

    if (draws.length > 0) {
      startDrawSequence(
        draws
      );
    }

    return true;
  }

  function cancelSelection() {
    if (
      currentGame.pendingEffect
    ) {
      setError(
        "This Arrival ability must be resolved."
      );

      return;
    }

    setPendingPlay(
      null
    );

    setPendingConflict(
      null
    );

    setDraggingHandInstanceId(
      null
    );

    setDragCursor(null);

    setError(null);
  }

  function toggleMulliganCard(
    instanceId: string
  ) {
    if (
      mulliganSelected.includes(
        instanceId
      )
    ) {
      setMulliganSelected(
        (current) =>
          current.filter(
            (id) =>
              id !==
              instanceId
          )
      );

      setError(null);

      return;
    }

    if (
      mulliganSelected.length >=
      MAX_MULLIGAN_REPLACEMENTS
    ) {
      setError(
        `You may replace up to ${MAX_MULLIGAN_REPLACEMENTS} cards.`
      );

      return;
    }

    setMulliganSelected(
      (current) => [
        ...current,
        instanceId,
      ]
    );

    setError(null);
  }

  function confirmMulligan() {
    const result =
      applyAction(
        currentGame,
        {
          type: "mulligan",

          replaceHandInstanceIds:
            mulliganSelected,
        }
      );

    if (!result.ok) {
      setError(
        result.error ??
          "Mulligan failed."
      );

      return;
    }

    if (
      result.state.phase ===
      "playing"
    ) {
      incomingTurnDrawsRef.current =
        collectNewDraws(
          currentGame,
          result.state,
          result.state.activePlayerId
        );
    }

    setGame(
      result.state
    );

    setMulliganSelected(
      []
    );

    setError(null);

    setHandoff(true);
  }

  function endTurn() {
    if (
      currentGame.pendingEffect ||
      drawAnimationActive
    ) {
      setError(
        currentGame.pendingEffect
          ? "Resolve the pending Arrival ability first."
          : "Let the drawn card settle first."
      );

      return;
    }

    const result =
      applyAction(
        currentGame,
        {
          type:
            "end-turn",
        }
      );

    if (!result.ok) {
      setError(
        result.error ??
          "Could not end turn."
      );

      return;
    }

    const outgoingDraws =
      collectNewDraws(
        currentGame,
        result.state,
        currentGame.activePlayerId
      );

    const incomingDraws =
      collectNewDraws(
        currentGame,
        result.state,
        result.state.activePlayerId
      );

    incomingTurnDrawsRef.current =
      incomingDraws;

    const commitTurn = () => {
      setGame(
        result.state
      );

      setHandoff(true);
    };

    setError(null);

    setPendingPlay(
      null
    );

    setPendingConflict(
      null
    );

    setDraggingHandInstanceId(
      null
    );

    setDragCursor(null);

    setInspectedUnitId(null);

    if (outgoingDraws.length > 0) {
      startDrawSequence(
        outgoingDraws,
        commitTurn
      );
    } else {
      commitTurn();
    }
  }

  function beginPlayCard(
    handCard: HandCardState
  ) {
    if (
      currentGame.pendingEffect
    ) {
      return;
    }

    setError(null);

    setPendingConflict(
      null
    );

    const card =
      getGameCard(
        handCard.cardId
      );

    if (
      isUnitCard(card)
    ) {
      setPendingPlay({
        kind: "deploy",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    if (
      card.cardType ===
      "artifact"
    ) {
      const targets =
        alliedCharacters.filter(
          (unit) =>
            !unit.attachedArtifactId
        );

      if (
        targets.length === 0
      ) {
        setError(
          "You have no Character who can equip this Artifact."
        );

        return;
      }

      setPendingPlay({
        kind:
          "artifact",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    if (
      card.id ===
      "word-in-the-right-ear"
    ) {
      if (
        allCharacters.length ===
        0
      ) {
        setError(
          "A Word in the Right Ear requires a Character in play."
        );

        return;
      }

      setPendingPlay({
        kind:
          "word-in-right-ear",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    if (
      card.id ===
      "trial-by-combat"
    ) {
      if (
        alliedCharacters.length ===
          0 ||
        enemyCharacters.length ===
          0
      ) {
        setError(
          "Trial by Combat requires an allied Character and an enemy Character."
        );

        return;
      }

      setPendingPlay({
        kind:
          "trial-by-combat",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    if (
      card.id ===
      "brothers-tilt"
    ) {
      if (
        alliedCharacters.length ===
        0
      ) {
        setError(
          "The Brothers' Tilt requires a Character you control."
        );

        return;
      }

      setPendingPlay({
        kind:
          "brothers-tilt",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    setPendingPlay({
      kind: "confirm",

      handInstanceId:
        handCard.instanceId,
    });
  }

  function confirmSelectedOnBoard() {
    if (
      !pendingPlay
    ) {
      return;
    }

    if (
      pendingPlay.kind !==
        "deploy" &&
      pendingPlay.kind !==
        "confirm"
    ) {
      return;
    }

    dispatch({
      type:
        "play-card",

      handInstanceId:
        pendingPlay.handInstanceId,
    });
  }

  function confirmSelectedPreview() {
    if (!pendingPlay) {
      return;
    }

    switch (pendingPlay.kind) {
      case "deploy":
      case "confirm":
        confirmSelectedOnBoard();
        return;

      case "artifact":
      case "word-in-right-ear":
      case "brothers-tilt":
      case "trial-by-combat":
        setPendingPlay({
          ...pendingPlay,
          hidePreview: true,
        });
        return;
    }
  }

  function handleUnitTarget(
    unit: UnitState
  ) {
    if (
      currentGame.pendingEffect
    ) {
      const effect =
        currentGame.pendingEffect;

      if (
        effect.abilityId ===
        "manders-pact"
      ) {
        if (
          unit.instanceId ===
            effect.sourceUnitInstanceId ||
          getGameCard(
            unit.cardId
          ).cardType !==
            "character"
        ) {
          return;
        }

        dispatch({
          type:
            "resolve-pending-effect",

          targetInstanceId:
            unit.instanceId,
        });

        return;
      }

      if (
        effect.abilityId ===
        "iron-wrath"
      ) {
        if (
          unit.ownerId ===
            currentGame.activePlayerId ||
          getGameCard(
            unit.cardId
          ).cardType !==
            "character"
        ) {
          return;
        }

        dispatch({
          type:
            "resolve-pending-effect",

          targetInstanceId:
            unit.instanceId,
        });

        return;
      }

      return;
    }

    if (pendingPlay) {
      switch (
        pendingPlay.kind
      ) {
        case "artifact": {
          if (
            unit.ownerId !==
              currentGame.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character" ||
            unit.attachedArtifactId
          ) {
            return;
          }

          dispatch({
            type:
              "play-card",

            handInstanceId:
              pendingPlay.handInstanceId,

            targetInstanceId:
              unit.instanceId,
          });

          return;
        }

        case "word-in-right-ear": {
          if (
            getGameCard(
              unit.cardId
            ).cardType !==
            "character"
          ) {
            return;
          }

          dispatch({
            type:
              "play-card",

            handInstanceId:
              pendingPlay.handInstanceId,

            targetInstanceId:
              unit.instanceId,
          });

          return;
        }

        case "brothers-tilt": {
          if (
            unit.ownerId !==
              currentGame.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character"
          ) {
            return;
          }

          dispatch({
            type:
              "play-card",

            handInstanceId:
              pendingPlay.handInstanceId,

            targetInstanceId:
              unit.instanceId,
          });

          return;
        }

        case "trial-by-combat": {
          if (
            !pendingPlay
              .firstTargetInstanceId
          ) {
            if (
              unit.ownerId !==
                currentGame.activePlayerId ||
              getGameCard(
                unit.cardId
              ).cardType !==
                "character"
            ) {
              return;
            }

            setPendingPlay({
              ...pendingPlay,

              firstTargetInstanceId:
                unit.instanceId,

              hidePreview: true,
            });

            return;
          }

          if (
            unit.ownerId ===
              currentGame.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character"
          ) {
            return;
          }

          dispatch({
            type:
              "play-card",

            handInstanceId:
              pendingPlay.handInstanceId,

            targetInstanceId:
              pendingPlay
                .firstTargetInstanceId,

            secondaryTargetInstanceId:
              unit.instanceId,
          });

          return;
        }

        case "deploy":
        case "confirm":
          break;
      }
    }

    if (
      pendingConflict?.kind ===
      "military"
    ) {
      const options =
        getMilitaryTargetOptions(
          currentGame,
          pendingConflict
            .attackerInstanceId
        );

      if (
        !options.unitInstanceIds.includes(
          unit.instanceId
        )
      ) {
        return;
      }

      dispatch({
        type:
          "military-attack",

        attackerInstanceId:
          pendingConflict
            .attackerInstanceId,

        targetUnitInstanceId:
          unit.instanceId,
      });

      return;
    }

    if (
      pendingConflict?.kind ===
      "political"
    ) {
      if (
        !pendingConflict.legalDefenders.includes(
          unit.instanceId
        )
      ) {
        return;
      }

      dispatch({
        type:
          "political-attack",

        attackerInstanceId:
          pendingConflict
            .attackerInstanceId,

        defenderInstanceId:
          unit.instanceId,
      });
    }
  }

  function targetEnemyHandCard(
    handCard: HandCardState
  ) {
    if (
      currentGame.pendingEffect
        ?.abilityId !==
      "veiled-sight"
    ) {
      return;
    }

    dispatch({
      type:
        "resolve-pending-effect",

      targetHandInstanceId:
        handCard.instanceId,
    });
  }

  function beginMilitary(
    unit: UnitState
  ) {
    if (
      currentGame.pendingEffect
    ) {
      return;
    }

    setError(null);

    setPendingPlay(
      null
    );

    const options =
      getMilitaryTargetOptions(
        currentGame,
        unit.instanceId
      );

    if (
      options.unitInstanceIds
        .length === 0 &&
      !options.canAttackStanding
    ) {
      setError(
        "There are no legal Military targets."
      );

      return;
    }

    setPendingConflict({
      kind:
        "military",

      attackerInstanceId:
        unit.instanceId,
    });
  }

  function attackStandingMilitary() {
    if (
      pendingConflict?.kind !==
      "military"
    ) {
      return;
    }

    dispatch({
      type:
        "military-attack",

      attackerInstanceId:
        pendingConflict
          .attackerInstanceId,

      targetPlayerId:
        opponentOf(
          currentGame.activePlayerId
        ),
    });
  }

  function beginPolitical(
    unit: UnitState
  ) {
    if (
      currentGame.pendingEffect
    ) {
      return;
    }

    setError(null);

    setPendingPlay(
      null
    );

    const defense =
      getPoliticalDefenseOptions(
        currentGame,
        unit.instanceId
      );

    setPendingConflict({
      kind:
        "political",

      attackerInstanceId:
        unit.instanceId,

      legalDefenders:
        defense.defenderInstanceIds,

      selectionBy:
        defense.selectionBy,

      unopposed:
        defense.unopposed,
    });
  }

  function attackStandingPolitical() {
    if (
      pendingConflict?.kind !==
        "political" ||
      !pendingConflict.unopposed
    ) {
      return;
    }

    dispatch({
      type:
        "political-attack",

      attackerInstanceId:
        pendingConflict
          .attackerInstanceId,
    });
  }

  function canMilitaryAttack(
    unit: UnitState
  ) {
    if (
      unit.ownerId !==
        currentGame.activePlayerId ||
      unit.exhausted ||
      unit.grounded
    ) {
      return false;
    }

    if (
      !unit.deployedThisTurn
    ) {
      return true;
    }

    return unitHasTrait(
      currentGame,
      unit,
      "swift"
    );
  }

  function canPoliticalAttack(
    unit: UnitState
  ) {
    const card =
      getGameCard(
        unit.cardId
      );

    if (
      card.cardType !==
      "character"
    ) {
      return false;
    }

    if (
      unit.ownerId !==
        currentGame.activePlayerId ||
      unit.exhausted
    ) {
      return false;
    }

    if (
      !unit.deployedThisTurn
    ) {
      return true;
    }

    return unitHasTrait(
      currentGame,
      unit,
      "schemer"
    );
  }

  /*
   * Used only for the End Turn hint.
   *
   * This checks whether the active player
   * still has at least one legal card play,
   * Military Conflict or Political Conflict.
   */
  function canPlayHandCard(
    handCard: HandCardState
  ): boolean {
    const card =
      getGameCard(
        handCard.cardId
      );

    const cost =
      getEffectiveCost(
        currentGame,
        activePlayerId,
        handCard
      );

    if (
      cost >
      activePlayer.command
    ) {
      return false;
    }

    const uniqueAlreadyInPlay =
      card.traits.includes(
        "unique"
      ) &&
      (
        activePlayer.board.some(
          (unit) =>
            unit.cardId ===
            card.id
        ) ||
        activePlayer.board.some(
          (unit) =>
            unit.attachedArtifactId ===
            card.id
        )
      );

    if (
      uniqueAlreadyInPlay
    ) {
      return false;
    }

    if (
      isUnitCard(card)
    ) {
      if (
        activePlayer.board.length >=
        BOARD_LIMIT
      ) {
        return false;
      }

      if (
        card.cardType ===
        "dragon"
      ) {
        const dragons =
          activePlayer.board.filter(
            (unit) =>
              getGameCard(
                unit.cardId
              ).cardType ===
              "dragon"
          ).length;

        if (
          dragons >=
          DRAGON_BOARD_LIMIT
        ) {
          return false;
        }
      }

      return true;
    }

    if (
      card.cardType ===
      "artifact"
    ) {
      return alliedCharacters.some(
        (unit) =>
          !unit.attachedArtifactId
      );
    }

    if (
      card.id ===
      "word-in-the-right-ear"
    ) {
      return (
        allCharacters.length >
        0
      );
    }

    if (
      card.id ===
      "trial-by-combat"
    ) {
      return (
        alliedCharacters.length >
          0 &&
        enemyCharacters.length >
          0
      );
    }

    if (
      card.id ===
      "brothers-tilt"
    ) {
      return (
        alliedCharacters.length >
        0
      );
    }

    return true;
  }

  function playerHasLegalAction(): boolean {
    if (
      currentGame.pendingEffect ||
      pendingPlay ||
      pendingConflict ||
      draggingHandInstanceId
    ) {
      return true;
    }

    if (
      activePlayer.hand.some(
        canPlayHandCard
      )
    ) {
      return true;
    }

    for (
      const unit of
      activePlayer.board
    ) {
      if (
        canMilitaryAttack(
          unit
        )
      ) {
        const targets =
          getMilitaryTargetOptions(
            currentGame,
            unit.instanceId
          );

        if (
          targets.canAttackStanding ||
          targets.unitInstanceIds
            .length > 0
        ) {
          return true;
        }
      }

      if (
        canPoliticalAttack(
          unit
        )
      ) {
        const defense =
          getPoliticalDefenseOptions(
            currentGame,
            unit.instanceId
          );

        if (
          defense.unopposed ||
          defense.defenderInstanceIds
            .length > 0
        ) {
          return true;
        }
      }
    }

    return false;
  }

  const highlightEndTurn =
    currentGame.phase ===
      "playing" &&
    !playerHasLegalAction();

  function isUnitTargetable(
    unit: UnitState
  ) {
    if (
      currentGame.pendingEffect
    ) {
      const effect =
        currentGame.pendingEffect;

      if (
        effect.abilityId ===
        "manders-pact"
      ) {
        return (
          unit.instanceId !==
            effect.sourceUnitInstanceId &&
          getGameCard(
            unit.cardId
          ).cardType ===
            "character"
        );
      }

      if (
        effect.abilityId ===
        "iron-wrath"
      ) {
        return (
          unit.ownerId !==
            currentGame.activePlayerId &&
          getGameCard(
            unit.cardId
          ).cardType ===
            "character"
        );
      }

      return false;
    }

    if (draggingHandInstanceId) {
      const draggedHandCard =
        getDraggedHandCard();

      return draggedHandCard
        ? canDropHandCardOnUnit(
            draggedHandCard,
            unit
          )
        : false;
    }

    if (pendingPlay) {
      switch (
        pendingPlay.kind
      ) {
        case "artifact":
          return (
            unit.ownerId ===
              currentGame.activePlayerId &&
            getGameCard(
              unit.cardId
            ).cardType ===
              "character" &&
            !unit.attachedArtifactId
          );

        case "word-in-right-ear":
          return (
            getGameCard(
              unit.cardId
            ).cardType ===
            "character"
          );

        case "brothers-tilt":
          return (
            unit.ownerId ===
              currentGame.activePlayerId &&
            getGameCard(
              unit.cardId
            ).cardType ===
              "character"
          );

        case "trial-by-combat":
          if (
            !pendingPlay
              .firstTargetInstanceId
          ) {
            return (
              unit.ownerId ===
                currentGame.activePlayerId &&
              getGameCard(
                unit.cardId
              ).cardType ===
                "character"
            );
          }

          return (
            unit.ownerId !==
              currentGame.activePlayerId &&
            getGameCard(
              unit.cardId
            ).cardType ===
              "character"
          );

        case "deploy":
        case "confirm":
          return false;
      }
    }

    if (
      pendingConflict?.kind ===
      "military"
    ) {
      return getMilitaryTargetOptions(
        currentGame,
        pendingConflict
          .attackerInstanceId
      ).unitInstanceIds.includes(
        unit.instanceId
      );
    }

    if (
      pendingConflict?.kind ===
      "political"
    ) {
      return pendingConflict.legalDefenders.includes(
        unit.instanceId
      );
    }

    return false;
  }

  function getPrompt() {
    if (
      currentGame.pendingEffect
    ) {
      switch (
        currentGame.pendingEffect
          .abilityId
      ) {
        case "manders-pact":
          return "ARRIVAL — The Mander's Pact: choose another Character.";

        case "veiled-sight":
          return "ARRIVAL — Veiled Sight: choose a card from the revealed enemy hand.";

        case "iron-wrath":
          return "ARRIVAL — Iron Wrath: choose an enemy Character.";
      }
    }

    if (pendingPlay) {
      switch (
        pendingPlay.kind
      ) {
        case "deploy":
          return "Card selected — click your board to deploy it.";

        case "confirm":
          return "Card selected — click your board or Play Card to confirm.";

        case "artifact":
          return "Choose one of your Characters to equip.";

        case "word-in-right-ear":
          return "Choose any Character to gain +1 Influence this turn.";

        case "brothers-tilt":
          return "Choose a Character you control for The Brothers' Tilt.";

        case "trial-by-combat":
          return pendingPlay
            .firstTargetInstanceId
            ? "Trial by Combat — choose the enemy Character."
            : "Trial by Combat — choose your Character first.";
      }
    }

    if (
      pendingConflict?.kind ===
      "military"
    ) {
      return "Military Conflict — choose an enemy unit or enemy Standing.";
    }

    if (
      pendingConflict?.kind ===
      "political"
    ) {
      if (
        pendingConflict.unopposed
      ) {
        return "Political Conflict — enemy Standing is unopposed. Click Standing to confirm.";
      }

      return pendingConflict.selectionBy ===
        "attacker"
        ? "Choose the Political defender."
        : "The defending player chooses the Political defender.";
    }

    return null;
  }

  function canDropHandCardOnBoard(
    handCard: HandCardState
  ): boolean {
    if (!canPlayHandCard(handCard)) {
      return false;
    }

    const card =
      getGameCard(
        handCard.cardId
      );

    return (
      isUnitCard(card) ||
      card.cardType ===
        "location" ||
      card.id ===
        "oldtown-massacre" ||
      card.id ===
        "royal-favor"
    );
  }

  function canDropHandCardOnUnit(
    handCard: HandCardState,
    unit: UnitState
  ): boolean {
    if (!canPlayHandCard(handCard)) {
      return false;
    }

    const card =
      getGameCard(
        handCard.cardId
      );

    const targetCard =
      getGameCard(
        unit.cardId
      );

    if (
      canDropHandCardOnBoard(
        handCard
      )
    ) {
      return (
        unit.ownerId ===
        currentGame.activePlayerId
      );
    }

    if (
      card.cardType ===
      "artifact"
    ) {
      return (
        unit.ownerId ===
          currentGame.activePlayerId &&
        targetCard.cardType ===
          "character" &&
        !unit.attachedArtifactId
      );
    }

    if (
      card.id ===
      "word-in-the-right-ear"
    ) {
      return (
        targetCard.cardType ===
        "character"
      );
    }

    if (
      card.id ===
        "brothers-tilt" ||
      card.id ===
        "trial-by-combat"
    ) {
      return (
        unit.ownerId ===
          currentGame.activePlayerId &&
        targetCard.cardType ===
          "character"
      );
    }

    return false;
  }

  function getDraggedHandCard():
    | HandCardState
    | null {
    if (
      !draggingHandInstanceId
    ) {
      return null;
    }

    return (
      activePlayer.hand.find(
        (card) =>
          card.instanceId ===
          draggingHandInstanceId
      ) ?? null
    );
  }

  function getPointerDropTarget(
    x: number,
    y: number
  ): PointerDropTarget | null {
    const element =
      document.elementFromPoint(
        x,
        y
      );

    if (!element) {
      return null;
    }

    const unitElement =
      element.closest<HTMLElement>(
        "[data-unit-instance-id]"
      );

    const unitInstanceId =
      unitElement?.dataset
        .unitInstanceId;

    if (unitInstanceId) {
      const unit = [
        ...activePlayer.board,
        ...enemyPlayer.board,
      ].find(
        (candidate) =>
          candidate.instanceId ===
          unitInstanceId
      );

      if (unit) {
        return {
          kind: "unit",
          unit,
        };
      }
    }

    if (
      element.closest(
        '[data-card-drop-board="true"]'
      )
    ) {
      return {
        kind: "board",
      };
    }

    return null;
  }

  function canDropOnPointerTarget(
    handCard: HandCardState,
    target: PointerDropTarget | null
  ): boolean {
    if (!target) {
      return false;
    }

    return target.kind === "unit"
      ? canDropHandCardOnUnit(
          handCard,
          target.unit
        )
      : canDropHandCardOnBoard(
          handCard
        );
  }

  function beginPointerDrag(
    handCard: HandCardState
  ) {
    setPendingPlay(null);
    setPendingConflict(null);
    setInspectedUnitId(null);
    setError(null);
    setDraggingHandInstanceId(
      handCard.instanceId
    );
  }

  function updatePointerDrag(
    handCard: HandCardState,
    x: number,
    y: number
  ) {
    const target =
      getPointerDropTarget(x, y);

    setDragCursor({
      x,
      y,
      canDrop:
        canDropOnPointerTarget(
          handCard,
          target
        ),
      requiresTarget:
        !canDropHandCardOnBoard(
          handCard
        ),
    });
  }

  function handleHandPointerDown(
    event: ReactPointerEvent<HTMLButtonElement>,
    handCard: HandCardState
  ) {
    if (
      event.button !== 0 ||
      currentGame.pendingEffect ||
      pendingConflict ||
      !canPlayHandCard(handCard)
    ) {
      return;
    }

    suppressHandClickRef.current =
      false;

    pointerDragRef.current = {
      handInstanceId:
        handCard.instanceId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId
    );
  }

  function handleHandPointerMove(
    event: ReactPointerEvent<HTMLButtonElement>,
    handCard: HandCardState
  ) {
    const session =
      pointerDragRef.current;

    if (
      !session ||
      session.pointerId !==
        event.pointerId ||
      session.handInstanceId !==
        handCard.instanceId
    ) {
      return;
    }

    if (!session.dragging) {
      const distance =
        Math.hypot(
          event.clientX -
            session.startX,
          event.clientY -
            session.startY
        );

      if (distance < 7) {
        return;
      }

      session.dragging = true;
      suppressHandClickRef.current =
        true;
      beginPointerDrag(handCard);
    }

    event.preventDefault();

    updatePointerDrag(
      handCard,
      event.clientX,
      event.clientY
    );
  }

  function playPointerCardOnBoard(
    handCard: HandCardState
  ) {
    dispatch({
      type: "play-card",
      handInstanceId:
        handCard.instanceId,
    });
  }

  function playPointerCardOnUnit(
    handCard: HandCardState,
    unit: UnitState
  ) {
    const card = getGameCard(
      handCard.cardId
    );

    if (
      canDropHandCardOnBoard(
        handCard
      )
    ) {
      dispatch({
        type:
          "play-card",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    if (
      card.cardType ===
      "artifact"
    ) {
      dispatch({
        type:
          "play-card",

        handInstanceId:
          handCard.instanceId,

        targetInstanceId:
          unit.instanceId,
      });

      return;
    }

    if (
      card.id ===
        "word-in-the-right-ear" ||
      card.id ===
        "brothers-tilt"
    ) {
      dispatch({
        type:
          "play-card",

        handInstanceId:
          handCard.instanceId,

        targetInstanceId:
          unit.instanceId,
      });

      return;
    }

    if (
      card.id ===
      "trial-by-combat"
    ) {
      if (
        unit.ownerId !==
          currentGame.activePlayerId ||
        getGameCard(
          unit.cardId
        ).cardType !==
          "character"
      ) {
        setError(
          "Begin Trial by Combat by dropping it onto one of your Characters."
        );

        return;
      }

      setPendingPlay({
        kind:
          "trial-by-combat",

        handInstanceId:
          handCard.instanceId,

        firstTargetInstanceId:
          unit.instanceId,

        hidePreview: true,
      });

      return;
    }

    setError(
      `${card.name} requires a different target.`
    );
  }

  function clearPointerDrag() {
    pointerDragRef.current = null;
    setDraggingHandInstanceId(null);
    setDragCursor(null);
  }

  function handleHandPointerUp(
    event: ReactPointerEvent<HTMLButtonElement>,
    handCard: HandCardState
  ) {
    const session =
      pointerDragRef.current;

    if (
      !session ||
      session.pointerId !==
        event.pointerId ||
      session.handInstanceId !==
        handCard.instanceId
    ) {
      return;
    }

    if (!session.dragging) {
      pointerDragRef.current =
        null;
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const target =
      getPointerDropTarget(
        event.clientX,
        event.clientY
      );

    const canDrop =
      canDropOnPointerTarget(
        handCard,
        target
      );

    clearPointerDrag();

    if (
      canDrop &&
      target?.kind === "unit"
    ) {
      playPointerCardOnUnit(
        handCard,
        target.unit
      );
    } else if (
      canDrop &&
      target?.kind === "board"
    ) {
      playPointerCardOnBoard(
        handCard
      );
    } else {
      setError(
        `${getGameCard(handCard.cardId).name} was not released over a valid target.`
      );
    }

    requestAnimationFrame(() => {
      suppressHandClickRef.current =
        false;
    });
  }

  function handleHandPointerCancel(
    event: ReactPointerEvent<HTMLButtonElement>
  ) {
    if (
      pointerDragRef.current
        ?.pointerId !==
      event.pointerId
    ) {
      return;
    }

    suppressHandClickRef.current =
      true;
    clearPointerDrag();

    requestAnimationFrame(() => {
      suppressHandClickRef.current =
        false;
    });
  }

  if (
    currentGame.winner
  ) {
    return (
      <main
        className={
          styles.game
        }
      >
        <div
          className={
            styles.pageBackground
          }
          aria-hidden
        />

        <div
          className={
            styles.winner
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            The Realm&apos;s
            Reckoning
          </span>

          <h1>
            {currentGame.winner ===
            "draw"
              ? "The Realm Lies Broken"
              : `${playerName(currentGame.winner)} Prevails`}
          </h1>

          <p>
            {currentGame.winner ===
            "draw"
              ? "Neither claimant remains standing."
              : "The opposing claimant has lost all Standing."}
          </p>

          <div
            className={
              styles.menuActions
            }
          >
            <button
              className={
                styles.primaryButton
              }
              onClick={
                startNewGame
              }
            >
              Play Again
            </button>

            <button
              className={
                styles.secondaryButton
              }
              onClick={
                exitToMenu
              }
            >
              Main Menu
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (handoff) {
    const mulliganHandoff =
      currentGame.phase ===
      "mulligan-player2";

    return (
      <main
        className={`${styles.game} ${styles.handoffScreen}`}
      >
        <div
          className={
            styles.pageBackground
          }
          aria-hidden
        />

        <div
          className={
            styles.handoffCard
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            {mulliganHandoff
              ? "Opening Hand"
              : `Turn ${currentGame.players[currentGame.activePlayerId].turnsTaken}`}
          </span>

          <h1>
            Pass the Realm
          </h1>

          <p>
            Give the device to{" "}
            <strong>
              {playerName(
                currentGame.activePlayerId
              )}
            </strong>
            .
          </p>

          <button
            className={
              styles.primaryButton
            }
            onClick={
              beginHandoffTurn
            }
          >
            {mulliganHandoff
              ? `Review ${playerName(currentGame.activePlayerId)} Opening Hand`
              : `Begin ${playerName(currentGame.activePlayerId)}'s Turn`}
          </button>
        </div>
      </main>
    );
  }

  if (
    currentGame.phase ===
      "mulligan-player1" ||
    currentGame.phase ===
      "mulligan-player2"
  ) {
    return (
      <MulliganScreen
        game={currentGame}
        selectedIds={
          mulliganSelected
        }
        onToggle={
          toggleMulliganCard
        }
        onConfirm={
          confirmMulligan
        }
        onExit={() =>
          setExitConfirm(
            true
          )
        }
        error={error}
        exitConfirm={
          exitConfirm
        }
        onCancelExit={() =>
          setExitConfirm(
            false
          )
        }
        onConfirmExit={
          exitToMenu
        }
      />
    );
  }

  const prompt =
    getPrompt();

  const activeLocation =
    currentGame.activeLocation
      ? getGameCard(
          currentGame.activeLocation.cardId
        )
      : null;

  const militaryStandingTarget =
    pendingConflict?.kind ===
      "military" &&
    getMilitaryTargetOptions(
      currentGame,
      pendingConflict
        .attackerInstanceId
    ).canAttackStanding;

  const politicalStandingTarget =
    pendingConflict?.kind ===
      "political" &&
    pendingConflict.unopposed;

  const selectedAttacker =
    pendingConflict
      ? pendingConflict
          .attackerInstanceId
      : null;

  const canReceiveBoardPlay =
    pendingPlay?.kind ===
      "deploy" ||
    pendingPlay?.kind ===
      "confirm";

  const draggedHandCard =
    getDraggedHandCard();

  const canReceiveDraggedCard =
    draggedHandCard
      ? canDropHandCardOnBoard(
          draggedHandCard
        )
      : false;

  const showSelectedPreview =
    Boolean(
      selectedHandCard &&
        selectedCard &&
        !draggingHandInstanceId &&
        !pendingPlay?.hidePreview &&
        !currentGame.pendingEffect
    );

  return (
    <main
      className={`${styles.game} ${
        draggingHandInstanceId
          ? styles.draggingGame
          : ""
      }`}
    >
      <div
        className={
          styles.pageBackground
        }
        aria-hidden
      />

      {drawFlight && (() => {
        const drawnCard =
          getGameCard(
            drawFlight.cardId
          );

        return (
          <div
            key={
              drawFlight.animationId
            }
            className={
              styles.drawCardFlight
            }
            style={
              drawFlightStyle(
                drawFlight,
                drawnCard
              )
            }
            onAnimationEnd={(event) => {
              if (
                event.currentTarget ===
                event.target
              ) {
                finishDrawFlight();
              }
            }}
            aria-live="polite"
            aria-label={`${drawnCard.name} drawn`}
          >
            <span
              className={
                styles.drawCardTrail
              }
              aria-hidden
            />

            <CardArtwork
              card={drawnCard}
              className={
                styles.fullCardArtwork
              }
            />

            <CardChrome
              card={drawnCard}
              cost={
                drawFlight.cost
              }
            />

            <CardInfoPanel
              card={drawnCard}
              showDescription={false}
            />
          </div>
        );
      })()}

      {dragCursor && (
        <div
          className={`${styles.dragCursorOverlay} ${
            dragCursor.canDrop
              ? styles.dragCursorCanDrop
              : ""
          }`}
          style={{
            left: dragCursor.x,
            top: dragCursor.y,
          }}
          aria-hidden
        >
          <svg
            viewBox="0 0 40 40"
            aria-hidden
          >
            <path
              d="M3.5 3.5 9 5.2 25.4 21.6l-3.8 3.8L5.2 9Z"
              fill="currentColor"
              stroke="#130b08"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            <path
              d="m7.2 6.8 15 15-1.25 1.25Z"
              fill="#fff1bb"
              opacity="0.5"
            />

            <path
              d="m16.8 27.7 11-11 2.5 2.5-11 11Z"
              fill="#9b7130"
              stroke="#130b08"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            <path
              d="m24 26.2 7.8 7.8"
              fill="none"
              stroke="#7b4f28"
              strokeWidth="4.2"
              strokeLinecap="round"
            />

            <circle
              cx="33.6"
              cy="35.8"
              r="2.6"
              fill="currentColor"
              stroke="#130b08"
              strokeWidth="1.3"
            />
          </svg>

          <small>
            {dragCursor.canDrop
              ? dragCursor.requiresTarget
                ? "Release on target"
                : "Release to play"
              : dragCursor.requiresTarget
                ? "Choose target"
                : "Move to your board"}
          </small>
        </div>
      )}

      <header
        className={
          styles.topbar
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            The Realm&apos;s
            Reckoning
          </span>

          <h1
            className={
              styles.title
            }
          >
            The Great Game
          </h1>
        </div>

        <div
          className={
            styles.turnInfo
          }
        >
          <span>
            {playerName(
              currentGame.activePlayerId
            )}
          </span>

          <strong>
            Turn{" "}
            {
              activePlayer.turnsTaken
            }
          </strong>

          <button
            className={
              styles.smallButton
            }
            onClick={() =>
              setExitConfirm(
                true
              )
            }
          >
            Exit Game
          </button>
        </div>
      </header>

      <section
        className={
          styles.locationBar
        }
      >
        <div>
          <span
            className={
              styles.locationLabel
            }
          >
            Active Location
          </span>

          <strong>
            {activeLocation
              ? activeLocation.name
              : "None"}
          </strong>
        </div>

        <small>
          {activeLocation
            ?.abilities[0]
            ?.text ??
            "No Location is currently in play."}
        </small>
      </section>

      {error && (
        <div
          className={
            styles.error
          }
        >
          {error}
        </div>
      )}

      {prompt && (
        <div
          className={
            styles.prompt
          }
        >
          <span>
            {prompt}
          </span>

          <button
            disabled={
              Boolean(
                currentGame.pendingEffect
              )
            }
            onClick={
              cancelSelection
            }
          >
            {currentGame.pendingEffect
              ? "Must Resolve"
              : "Cancel"}
          </button>
        </div>
      )}

      <PlayerHeader
        playerId={
          enemyPlayerId
        }
        state={currentGame}
        opponent
        standingTarget={
          Boolean(
            militaryStandingTarget ||
              politicalStandingTarget
          )
        }
        standingTargetType={
          militaryStandingTarget
            ? "military"
            : politicalStandingTarget
              ? "political"
              : null
        }
        onStandingClick={
          militaryStandingTarget
            ? attackStandingMilitary
            : politicalStandingTarget
              ? attackStandingPolitical
              : undefined
        }
      />

      {currentGame.pendingEffect
        ?.abilityId ===
        "veiled-sight" && (
        <section
          className={
            styles.revealedHand
          }
        >
          <div
            className={
              styles.sectionTitle
            }
          >
            Veiled Sight —
            Opponent&apos;s Hand
          </div>

          <HorizontalHand>
            {enemyPlayer.hand.map(
              (
                handCard
              ) => {
                const card =
                  getGameCard(
                    handCard.cardId
                  );

                return (
                  <HandCardVisual
                    key={
                      handCard.instanceId
                    }
                    card={
                      card
                    }
                    cost={
                      getEffectiveCost(
                        currentGame,
                        enemyPlayerId,
                        handCard
                      )
                    }
                    targetable
                    onClick={() =>
                      targetEnemyHandCard(
                        handCard
                      )
                    }
                  />
                );
              }
            )}
          </HorizontalHand>
        </section>
      )}

      <Board
        title="Opponent's Board"
        units={
          enemyPlayer.board
        }
        state={currentGame}
        targetable={
          isUnitTargetable
        }
        onUnitClick={
          handleUnitTarget
        }
        onInspectUnit={(unit) => {
          if (
            !pendingPlay &&
            !pendingConflict &&
            !currentGame.pendingEffect &&
            !draggingHandInstanceId
          ) {
            setInspectedUnitId(unit.instanceId);
          }
        }}
        selectedInstanceId={
          selectedAttacker
        }
      />

      <div
        className={
          styles.battleLine
        }
      >
        <span>
          ✦ The Realm ✦
        </span>
      </div>

      <Board
        title="Your Board"
        units={
          activePlayer.board
        }
        state={currentGame}
        targetable={
          isUnitTargetable
        }
        onUnitClick={
          handleUnitTarget
        }
        onInspectUnit={(unit) => {
          if (
            !pendingPlay &&
            !pendingConflict &&
            !currentGame.pendingEffect &&
            !draggingHandInstanceId
          ) {
            setInspectedUnitId(unit.instanceId);
          }
        }}
        selectedInstanceId={
          selectedAttacker
        }
        canReceivePlay={
          Boolean(
            canReceiveBoardPlay ||
              canReceiveDraggedCard
          )
        }
        onBoardClick={
          canReceiveBoardPlay
            ? confirmSelectedOnBoard
            : undefined
        }
        pointerDropBoard
        renderActions={(
          unit
        ) => (
          <>
            <button
              disabled={
                !canMilitaryAttack(
                  unit
                ) ||
                Boolean(
                  pendingPlay ||
                    pendingConflict ||
                    gameInteractionLocked
                )
              }
              onClick={(
                event
              ) => {
                event.stopPropagation();

                beginMilitary(
                  unit
                );
              }}
            >
              Military
            </button>

            {getGameCard(
              unit.cardId
            ).cardType ===
              "character" && (
              <button
                disabled={
                  !canPoliticalAttack(
                    unit
                  ) ||
                  Boolean(
                    pendingPlay ||
                      pendingConflict ||
                      gameInteractionLocked
                  )
                }
                onClick={(
                  event
                ) => {
                  event.stopPropagation();

                  beginPolitical(
                    unit
                  );
                }}
              >
                Political
              </button>
            )}
          </>
        )}
      />

      <PlayerHeader
        playerId={
          activePlayerId
        }
        state={currentGame}
      />

      <section
        className={
          styles.handSection
        }
      >
        <div
          className={
            styles.sectionHeading
          }
        >
          <div>
            <div
              className={
                styles.sectionTitle
              }
            >
              Your Hand
            </div>

            <small>
              Click to inspect ·
              drag to play
            </small>
          </div>

          <div
            className={
              styles.handControls
            }
          >
            <CommandMeter
              command={
                activePlayer.command
              }
              maxCommand={
                activePlayer.maxCommand
              }
              nextCommandBonus={
                activePlayer.nextCommandBonus
              }
            />

            <button
              className={`${styles.endTurnButton} ${
                highlightEndTurn
                  ? styles.endTurnReady
                  : ""
              }`}
              disabled={
                Boolean(
                  currentGame.pendingEffect ||
                    drawAnimationActive
                )
              }
              title={
                highlightEndTurn
                  ? "No legal actions remain."
                  : undefined
              }
              onClick={
                endTurn
              }
            >
              End Turn
            </button>
          </div>
        </div>

        <HorizontalHand
          fanned
          active
        >
          {activePlayer.hand.map(
            (handCard, index) => (
              <HandCard
                key={
                  handCard.instanceId
                }
                handCard={
                  handCard
                }
                state={
                  currentGame
                }
                playerId={
                  activePlayerId
                }
                selected={
                  pendingPlay?.handInstanceId ===
                  handCard.instanceId
                }
                dragging={
                  draggingHandInstanceId ===
                  handCard.instanceId
                }
                fanIndex={index}
                fanCount={
                  activePlayer.hand.length
                }
                drawHidden={
                  hiddenDrawnIds.includes(
                    handCard.instanceId
                  )
                }
                interactionLocked={
                  Boolean(
                    gameInteractionLocked ||
                      pendingConflict
                  )
                }
                onPlay={() => {
                  if (
                    suppressHandClickRef.current
                  ) {
                    return;
                  }

                  beginPlayCard(
                    handCard
                  );
                }}
                onPointerDown={(event) =>
                  handleHandPointerDown(
                    event,
                    handCard
                  )
                }
                onPointerMove={(event) =>
                  handleHandPointerMove(
                    event,
                    handCard
                  )
                }
                onPointerUp={(event) =>
                  handleHandPointerUp(
                    event,
                    handCard
                  )
                }
                onPointerCancel={
                  handleHandPointerCancel
                }
              />
            )
          )}
        </HorizontalHand>
      </section>

      <section
        className={
          styles.logSection
        }
      >
        <div
          className={
            styles.sectionTitle
          }
        >
          Chronicle
        </div>

        <div
          className={
            styles.log
          }
        >
          {[...currentGame.log]
            .reverse()
            .slice(0, 40)
            .map(
              (entry) => (
                <div
                  key={
                    entry.id
                  }
                  className={
                    styles.logEntry
                  }
                >
                  <span>
                    T
                    {
                      entry.turn
                    }
                  </span>

                  <p>
                    {
                      entry.message
                    }
                  </p>
                </div>
              )
            )}
        </div>
      </section>

      {showSelectedPreview &&
        selectedHandCard &&
        selectedCard && (
          <>
            <div
              className={
                styles.selectionShade
              }
              onClick={
                cancelSelection
              }
            />

            <SelectedCardPreview
              card={
                selectedCard
              }
              handCard={
                selectedHandCard
              }
              state={currentGame}
              playerId={
                activePlayerId
              }
              pendingPlay={
                pendingPlay!
              }
              onCancel={
                cancelSelection
              }
              onConfirm={
                confirmSelectedPreview
              }
            />
          </>
        )}

      {inspectedUnit && (
        <>
          <div
            className={styles.selectionShade}
            onClick={() => setInspectedUnitId(null)}
          />

          <UnitDetailOverlay
            unit={inspectedUnit}
            state={currentGame}
            onClose={() => setInspectedUnitId(null)}
          />
        </>
      )}

      {exitConfirm && (
        <ConfirmOverlay
          title="Exit Game?"
          text="The current local game will be lost."
          confirmLabel="Exit Game"
          onCancel={() =>
            setExitConfirm(
              false
            )
          }
          onConfirm={
            exitToMenu
          }
        />
      )}
    </main>
  );
}

function MainMenu({
  onNewGame,
}: {
  onNewGame: () => void;
}) {
  return (
    <main
      className={`${styles.game} ${styles.mainMenu}`}
    >
      <div
        className={
          styles.pageBackground
        }
        aria-hidden
      />

      <div
        className={
          styles.menuCrest
        }
      >
        ✦
      </div>

      <span
        className={
          styles.eyebrow
        }
      >
        The Realm&apos;s
        Reckoning
      </span>

      <h1
        className={
          styles.menuTitle
        }
      >
        The Great Game
      </h1>

      <p
        className={
          styles.menuSubtitle
        }
      >
        Power wins battles.
        Influence wins realms.
      </p>

      <div
        className={
          styles.menuActions
        }
      >
        <button
          className={
            styles.primaryButton
          }
          onClick={
            onNewGame
          }
        >
          New Game
        </button>
      </div>

      <div
        className={
          styles.menuFootnote
        }
      >
        Local Hot-Seat ·
        Two Players
      </div>
    </main>
  );
}

function MulliganScreen({
  game,
  selectedIds,
  onToggle,
  onConfirm,
  onExit,
  error,
  exitConfirm,
  onCancelExit,
  onConfirmExit,
}: {
  game: GameState;
  selectedIds: string[];
  onToggle: (
    instanceId: string
  ) => void;
  onConfirm: () => void;
  onExit: () => void;
  error: string | null;
  exitConfirm: boolean;
  onCancelExit: () => void;
  onConfirmExit: () => void;
}) {
  const playerId =
    game.activePlayerId;

  const player =
    game.players[
      playerId
    ];

  return (
    <main
      className={
        styles.game
      }
    >
      <div
        className={
          styles.pageBackground
        }
        aria-hidden
      />

      <header
        className={
          styles.topbar
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Before the Game
          </span>

          <h1
            className={
              styles.title
            }
          >
            Opening Hand
          </h1>
        </div>

        <button
          className={
            styles.smallButton
          }
          onClick={
            onExit
          }
        >
          Exit Game
        </button>
      </header>

      <section
        className={
          styles.mulliganIntro
        }
      >
        <span>
          {playerName(
            playerId
          )}
        </span>

        <h2>
          Choose up to three
          cards to replace
        </h2>

        <p>
          Replaced cards are
          temporarily set aside.
          New cards are drawn,
          then your replaced
          cards are shuffled back
          into the deck.
        </p>
      </section>

      {error && (
        <div
          className={
            styles.error
          }
        >
          {error}
        </div>
      )}

      <div
        className={
          styles.mulliganGrid
        }
      >
        {player.hand.map(
          (handCard) => {
            const card =
              getGameCard(
                handCard.cardId
              );

            const selected =
              selectedIds.includes(
                handCard.instanceId
              );

            return (
              <button
                key={
                  handCard.instanceId
                }
                className={`${styles.mulliganCard} ${
                  selected
                    ? styles.mulliganSelected
                    : ""
                }`}
                style={
                  tierStyle(
                    card
                  )
                }
                onClick={() =>
                  onToggle(
                    handCard.instanceId
                  )
                }
              >
                <CardArtwork
                  card={
                    card
                  }
                  className={
                    styles.fullCardArtwork
                  }
                />

                <CardChrome
                  card={
                    card
                  }
                  cost={
                    card.cost
                  }
                />

                <CardSparkles />

                <CardInfoPanel
                  card={
                    card
                  }
                />

                <div
                  className={
                    styles.mulliganMark
                  }
                >
                  {selected
                    ? "Replace"
                    : "Keep"}
                </div>
              </button>
            );
          }
        )}
      </div>

      <div
        className={
          styles.mulliganFooter
        }
      >
        <div>
          <strong>
            {
              selectedIds.length
            }
            /
            {
              MAX_MULLIGAN_REPLACEMENTS
            }
          </strong>{" "}
          selected
        </div>

        <button
          className={
            styles.primaryButton
          }
          onClick={
            onConfirm
          }
        >
          {selectedIds.length >
          0
            ? `Replace ${selectedIds.length}`
            : "Keep All"}
        </button>
      </div>

      {exitConfirm && (
        <ConfirmOverlay
          title="Exit Game?"
          text="Return to the main menu?"
          confirmLabel="Exit Game"
          onCancel={
            onCancelExit
          }
          onConfirm={
            onConfirmExit
          }
        />
      )}
    </main>
  );
}

function PlayerHeader({
  playerId,
  state,
  opponent = false,
  standingTarget = false,
  standingTargetType = null,
  onStandingClick,
}: {
  playerId: PlayerId;
  state: GameState;
  opponent?: boolean;
  standingTarget?: boolean;
  standingTargetType?:
    | "military"
    | "political"
    | null;
  onStandingClick?: () => void;
}) {
  const player =
    state.players[
      playerId
    ];

  return (
    <section
      className={`${styles.playerHeader} ${
        opponent
          ? styles.opponentPlayer
          : ""
      }`}
    >
      <button
        className={`${styles.standingBox} ${
          standingTarget
            ? styles.standingBoxTarget
            : ""
        }`}
        disabled={
          !standingTarget
        }
        onClick={
          standingTarget
            ? onStandingClick
            : undefined
        }
      >
        <span>
          {playerName(
            playerId
          )}
        </span>

        <strong>
          {
            player.standing
          }
        </strong>

        <small>
          Standing
        </small>

        {standingTarget && (
          <em>
            {standingTargetType ===
            "military"
              ? "⚔ Attack"
              : "♛ Claim"}
          </em>
        )}
      </button>

      {opponent && (
        <CommandMeter
          command={
            player.command
          }
          maxCommand={
            player.maxCommand
          }
          nextCommandBonus={
            player.nextCommandBonus
          }
          compact
        />
      )}

      <div
        className={
          styles.playerStats
        }
      >
        <HudStat
          label="Deck"
          value={
            player.deck.length
          }
          deckAnchorPlayerId={
            playerId
          }
        />

        <HudStat
          label="Hand"
          value={`${player.hand.length}/8`}
        />

        <HudStat
          label="Discard"
          value={
            player.discard.length
          }
        />

        <HudStat
          label="Burned"
          value={
            player.burnedCards
              .length
          }
        />

      </div>
    </section>
  );
}

function HudStat({
  label,
  value,
  accent = false,
  deckAnchorPlayerId,
}: {
  label: string;
  value:
    | string
    | number;
  accent?: boolean;
  deckAnchorPlayerId?: PlayerId;
}) {
  return (
    <div
      className={`${styles.hudStat} ${
        accent
          ? styles.hudStatAccent
          : ""
      }`}
      data-deck-anchor={
        deckAnchorPlayerId
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function CommandSigil({
  value,
}: {
  value?: number;
}) {
  return (
    <svg
      viewBox="0 0 44 44"
      aria-hidden
    >
      <path
        d="M13 2h18l11 11v18L31 42H13L2 31V13Z"
        className={
          styles.commandBadgePlate
        }
      />

      <path
        d="M15 6h14l9 9v14l-9 9H15l-9-9V15Z"
        className={
          styles.commandBadgeInset
        }
      />

      <path
        d="M22 10.5 26.2 18 33.5 22l-7.3 4L22 33.5 17.8 26 10.5 22l7.3-4Z"
        className={
          styles.commandBadgeRune
        }
      />

      {typeof value ===
        "number" && (
        <text
          x="22"
          y="22.6"
          textAnchor="middle"
          dominantBaseline="middle"
          className={
            styles.commandCostText
          }
        >
          {value}
        </text>
      )}
    </svg>
  );
}

function CommandMeter({
  command,
  maxCommand,
  nextCommandBonus,
  compact = false,
}: {
  command: number;
  maxCommand: number;
  nextCommandBonus: number;
  compact?: boolean;
}) {
  const slotCount =
    Math.max(
      command,
      maxCommand
    );

  return (
    <div
      className={`${styles.commandMeter} ${
        compact
          ? styles.commandMeterCompact
          : ""
      }`}
      title={`${command} of ${maxCommand} Command available`}
    >
      <div
        className={
          styles.commandMeterHeading
        }
      >
        <span>Command</span>

        <strong>
          {command}/{maxCommand}
        </strong>

        {nextCommandBonus > 0 && (
          <em>
            +{nextCommandBonus} next
          </em>
        )}
      </div>

      <div
        className={
          styles.commandPips
        }
        aria-label={`${command} Command available`}
      >
        {Array.from({
          length: slotCount,
        }).map((_, index) => {
          const available =
            index < command;

          const bonus =
            index >= maxCommand;

          return (
            <span
              key={index}
              className={[
                styles.commandPip,
                available
                  ? styles.commandPipLit
                  : styles.commandPipSpent,
                bonus
                  ? styles.commandPipBonus
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
              title={
                available
                  ? bonus
                    ? "Bonus Command available"
                    : "Command available"
                  : "Command spent"
              }
            >
              <CommandSigil />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function Board({
  title,
  units,
  state,
  targetable,
  onUnitClick,
  onInspectUnit,
  selectedInstanceId,
  renderActions,
  canReceivePlay = false,
  onBoardClick,
  pointerDropBoard = false,
}: {
  title: string;
  units: UnitState[];
  state: GameState;
  targetable: (
    unit: UnitState
  ) => boolean;
  onUnitClick: (
    unit: UnitState
  ) => void;
  onInspectUnit?: (
    unit: UnitState
  ) => void;
  selectedInstanceId?:
    | string
    | null;
  renderActions?: (
    unit: UnitState
  ) => ReactNode;
  canReceivePlay?: boolean;
  onBoardClick?: () => void;
  pointerDropBoard?: boolean;
}) {
  return (
    <section
      className={
        styles.boardSection
      }
    >
      <div
        className={
          styles.sectionHeading
        }
      >
        <div>
          <div
            className={
              styles.sectionTitle
            }
          >
            {title}
          </div>

          <small>
            {units.length}/6
            unit slots
          </small>
        </div>
      </div>

      <div
        className={`${styles.board} ${
          canReceivePlay
            ? styles.playableBoard
            : ""
        }`}
        onClick={
          canReceivePlay
            ? onBoardClick
            : undefined
        }
        data-card-drop-board={
          pointerDropBoard
            ? "true"
            : undefined
        }
      >
        {units.length ===
          0 && (
          <div
            className={
              styles.emptyBoard
            }
          >
            {canReceivePlay
              ? "Click or drop here to deploy."
              : "No units in play."}
          </div>
        )}

        {units.map(
          (unit) => (
            <BoardUnit
              key={
                unit.instanceId
              }
              unit={unit}
              state={state}
              targetable={
                targetable(
                  unit
                )
              }
              selected={
                selectedInstanceId ===
                unit.instanceId
              }
              onClick={() =>
                onUnitClick(
                  unit
                )
              }
              onInspect={() =>
                onInspectUnit?.(unit)
              }
              actions={
                renderActions?.(
                  unit
                )
              }
            />
          )
        )}
      </div>
    </section>
  );
}

function BoardUnit({
  unit,
  state,
  targetable,
  selected,
  onClick,
  onInspect,
  actions,
}: {
  unit: UnitState;
  state: GameState;
  targetable: boolean;
  selected: boolean;
  onClick: () => void;
  onInspect: () => void;
  actions?: ReactNode;
}) {
  const card =
    getGameCard(
      unit.cardId
    );

  if (!isUnitCard(card)) {
    return null;
  }

  const power =
    getEffectivePower(
      state,
      unit
    );

  const influence =
    getEffectiveInfluence(
      state,
      unit
    );

  const maxHealth =
    getMaximumHealth(
      unit
    );

  const weylarProgress =
    card.id ===
    "weylar-rocke"
      ? Math.min(
          3,
          unit.counters[
            "turns-in-play"
          ] ?? 0
        )
      : null;

  const hasEffects =
    unit.modifiers.length > 0 ||
    Boolean(unit.attachedArtifactId);

  return (
    <div className={styles.unitCardWrapper}>
    <div
      className={[
        styles.unitCard,

        targetable
          ? styles.targetableUnit
          : "",

        selected
          ? styles.selectedUnit
          : "",

        unit.exhausted
          ? styles.exhaustedUnit
          : "",

        unit.grounded
          ? styles.groundedUnit
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        tierStyle(card)
      }
      data-unit-instance-id={
        unit.instanceId
      }
      onClick={(
        event
      ) => {
        event.stopPropagation();

        if (
          targetable
        ) {
          onClick();
        } else {
          onInspect();
        }
      }}
    >
      <CardArtwork
        card={card}
        className={
          styles.fullCardArtwork
        }
      />

      <CardChrome
        card={card}
      />

      <CardSparkles />

      <div
        className={
          styles.statusOverlay
        }
      >
        {unit.deployedThisTurn && (
          <span>
            Deployed
          </span>
        )}

        {unit.exhausted && (
          <span>
            Exhausted
          </span>
        )}

        {unit.grounded && (
          <span>
            Grounded
          </span>
        )}
      </div>

      <CardInfoPanel
        card={card}
        runtimeStats={{
          power,
          influence,
          health:
            unit.currentHealth,
          maxHealth,
        }}
        baseStats={{
          power: card.power,
          influence:
            card.cardType === "character"
              ? card.influence
              : undefined,
          health: card.health,
        }}
        actions={
          actions
        }
        footer={
          <>
            {weylarProgress !==
              null && (
              <div
                className={
                  styles.skillProgress
                }
              >
                <span>
                  Price of Loyalty
                </span>

                <div
                  className={
                    styles.skillProgressMeter
                  }
                  aria-label={
                    unit.flags[
                      "weylar-triggered"
                    ]
                      ? "Price of Loyalty triggered"
                      : `Price of Loyalty ${weylarProgress} of 3 turns`
                  }
                >
                  {[0, 1, 2].map(
                    (step) => (
                      <i
                        key={step}
                        className={
                          step <
                          weylarProgress
                            ? styles.skillProgressPipFilled
                            : undefined
                        }
                      />
                    )
                  )}

                  <strong>
                    {unit.flags[
                      "weylar-triggered"
                    ]
                      ? "✓"
                      : `${weylarProgress}/3`}
                  </strong>
                </div>
              </div>
            )}

            {unit.attachedArtifactId && (
              <div
                className={
                  styles.artifact
                }
              >
                ◆{" "}
                {
                  getGameCard(
                    unit.attachedArtifactId
                  ).name
                }
              </div>
            )}
          </>
        }
      />
    </div>

    {hasEffects && (
      <UnitEffectsTooltip unit={unit} />
    )}
    </div>
  );
}

function HandCard({
  handCard,
  state,
  playerId,
  selected,
  dragging,
  fanIndex,
  fanCount,
  drawHidden,
  interactionLocked,
  onPlay,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  handCard: HandCardState;
  state: GameState;
  playerId: PlayerId;
  selected: boolean;
  dragging: boolean;
  fanIndex: number;
  fanCount: number;
  drawHidden: boolean;
  interactionLocked: boolean;
  onPlay: () => void;
  onPointerDown: (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
  onPointerMove: (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
  onPointerUp: (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
  onPointerCancel: (
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void;
}) {
  const card =
    getGameCard(
      handCard.cardId
    );

  const cost =
    getEffectiveCost(
      state,
      playerId,
      handCard
    );

  const affordable =
    state.players[
      playerId
    ].command >= cost;

  return (
    <button
      className={[
        styles.handCard,

        !affordable
          ? styles.unaffordableCard
          : "",

        selected
          ? styles.selectedHandCard
          : "",

        dragging
          ? styles.draggingHandCard
          : "",

        drawHidden
          ? styles.drawHiddenHandCard
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        fanCardStyle(
          card,
          fanIndex,
          fanCount
        )
      }
      data-hand-instance-id={
        handCard.instanceId
      }
      disabled={
        interactionLocked
      }
      onClick={
        onPlay
      }
      draggable={false}
      onPointerDown={
        onPointerDown
      }
      onPointerMove={
        onPointerMove
      }
      onPointerUp={
        onPointerUp
      }
      onPointerCancel={
        onPointerCancel
      }
      onDragStart={(event) =>
        event.preventDefault()
      }
    >
      <CardArtwork
        card={card}
        className={
          styles.fullCardArtwork
        }
      />

      <CardChrome
        card={card}
        cost={cost}
      />

      <CardSparkles />

      <CardInfoPanel
        card={card}
        showDescription={false}
      />
    </button>
  );
}

function HandCardVisual({
  card,
  cost,
  targetable = false,
  onClick,
}: {
  card: GameCard;
  cost: number;
  targetable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`${styles.handCard} ${
        targetable
          ? styles.targetableHandCard
          : ""
      }`}
      style={
        tierStyle(card)
      }
      onClick={
        onClick
      }
    >
      <CardArtwork
        card={card}
        className={
          styles.fullCardArtwork
        }
      />

      <CardChrome
        card={card}
        cost={cost}
      />

      <CardSparkles />

      <CardInfoPanel
        card={card}
        showDescription={false}
      />
    </button>
  );
}

function CardChrome({
  card,
  cost,
}: {
  card: GameCard;
  cost?: number;
}) {
  return (
    <>
      {typeof cost ===
        "number" && (
        <span
          className={
            styles.cost
          }
          title="Command cost"
          aria-label={`${cost} Command`}
        >
          <CommandSigil
            value={cost}
          />
        </span>
      )}

      <span
        className={
          styles.tierBadge
        }
        title={`${tierLabel(card)} Tier`}
      >
        {tierLabel(
          card
        )}
      </span>

      {card.traits.includes(
        "unique"
      ) && (
        <span
          className={
            styles.uniqueMark
          }
          title="Unique"
          aria-label="Unique"
        >
          ◆
        </span>
      )}
    </>
  );
}

function CardInfoPanel({
  card,
  runtimeStats,
  baseStats,
  actions,
  footer,
  showDescription = true,
}: {
  card: GameCard;
  runtimeStats?: {
    power: number;
    influence: number;
    health: number;
    maxHealth: number;
  };
  baseStats?: {
    power: number;
    influence?: number;
    health: number;
  };
  actions?: ReactNode;
  footer?: ReactNode;
  showDescription?: boolean;
}) {
  const traits =
    visibleTraits(
      card
    );

  const statTone = (
    current: number,
    base: number | undefined
  ) => {
    if (typeof base !== "number" || current === base) {
      return "";
    }

    return current > base
      ? styles.statBuffed
      : styles.statDebuffed;
  };

  return (
    <div
      className={[
        styles.cardInfoPanel,
        actions
          ? styles.cardInfoPanelWithActions
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={
          styles.cardIdentity
        }
      >
        <span
          className={
            styles.cardType
          }
        >
          {
            card.cardType
          }
        </span>

        <strong>
          {card.name}
        </strong>

        <small
          className={
            card.subtitle
              ? undefined
              : styles.emptySubtitle
          }
          aria-hidden={
            card.subtitle
              ? undefined
              : true
          }
        >
          {card.subtitle ??
            "\u00a0"}
        </small>
      </div>

      <div
        className={[
          styles.cardStats,
          !isUnitCard(card)
            ? styles.emptyCardStats
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={
          !isUnitCard(card)
            ? true
            : undefined
        }
      >
        {isUnitCard(card) && (
          <>
          <span
            className={[
              styles.cardStat,
              statTone(
                runtimeStats?.power ?? card.power,
                baseStats?.power
              ),
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <i
              className={
                styles.cardStatIcon
              }
              aria-hidden
            >
              ⚔
            </i>

            <b>
              {runtimeStats
                ?.power ??
                card.power}
            </b>
          </span>

          {card.cardType ===
            "character" && (
            <span
              className={[
                styles.cardStat,
                statTone(
                  runtimeStats?.influence ?? card.influence,
                  baseStats?.influence
                ),
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <i
                className={
                  styles.cardStatIcon
                }
                aria-hidden
              >
                ♛
              </i>

              <b>
                {runtimeStats
                  ?.influence ??
                  card.influence}
              </b>
            </span>
          )}

          <span
            className={[
              styles.cardStat,
              styles.healthStat,
              statTone(
                runtimeStats?.maxHealth ?? card.health,
                baseStats?.health
              ),
              runtimeStats &&
              runtimeStats.health < runtimeStats.maxHealth
                ? styles.statDamaged
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <i
              className={
                styles.cardStatIcon
              }
              aria-hidden
            >
              ♥
            </i>

            <b>
              {runtimeStats
                ? `${runtimeStats.health}/${runtimeStats.maxHealth}`
                : card.health}
            </b>
          </span>
          </>
        )}
      </div>

      <div
        className={[
          styles.traits,
          traits.length === 0
            ? styles.emptyTraits
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden={
          traits.length === 0
            ? true
            : undefined
        }
      >
        {traits.length > 0 && (
          <>
          {traits.map(
            (trait) => (
              <span
                key={
                  trait
                }
              >
                {trait}
              </span>
            )
          )}
          </>
        )}
      </div>

      {card.abilities[0] ? (
        <AbilityDisplay
          trigger={
            card.abilities[0]
              .trigger
          }
          name={
            card.abilities[0]
              .name
          }
          text={
            card.abilities[0]
              .text
          }
          showDescription={
            showDescription
          }
        />
      ) : (
        <div
          className={`${styles.abilityDisplay} ${styles.emptyAbility}`}
          aria-hidden
        />
      )}

      <div
        className={
          styles.cardFooter
        }
      >
        {footer}
      </div>

      {actions && (
        <div
          className={
            styles.unitActions
          }
        >
          {actions}
        </div>
      )}
    </div>
  );
}

function AbilityDisplay({
  trigger,
  name,
  text,
  showDescription,
}: {
  trigger: AbilityTrigger;
  name: string;
  text: string;
  showDescription: boolean;
}) {
  return (
    <div
      className={
        styles.abilityDisplay
      }
    >
      <div
        className={
          styles.abilityHeading
        }
      >
        <span>
          {abilityTypeLabel(
            trigger
          )}
        </span>

        <b>—</b>

        <strong>
          {abilityNameLabel(
            trigger,
            name
          )}
        </strong>
      </div>

      {showDescription && (
        <p>
          {text}
        </p>
      )}
    </div>
  );
}

function SelectedCardPreview({
  card,
  handCard,
  state,
  playerId,
  pendingPlay,
  onCancel,
  onConfirm,
}: {
  card: GameCard;
  handCard: HandCardState;
  state: GameState;
  playerId: PlayerId;
  pendingPlay: PendingPlay;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cost =
    getEffectiveCost(
      state,
      playerId,
      handCard
    );

  const actionLabel = (() => {
    switch (pendingPlay.kind) {
      case "deploy":
        return "Deploy";

      case "confirm":
        return "Play Card";

      case "artifact":
        return "Equip";

      case "word-in-right-ear":
      case "brothers-tilt":
        return "Choose Target";

      case "trial-by-combat":
        return "Begin Trial";
    }
  })();

  return (
    <div
      className={
        styles.selectedCardPreview
      }
    >
      <div
        className={
          styles.selectedCardInner
        }
        style={
          tierStyle(card)
        }
      >
        <CardArtwork
          card={card}
          className={
            styles.fullCardArtwork
          }
        />

      <CardChrome
        card={card}
        cost={cost}
      />

      <CardSparkles />

        <CardInfoPanel
          card={card}
        />

        <div
          className={
            styles.selectedActions
          }
        >
          <button
            onClick={
              onCancel
            }
          >
            Cancel
          </button>

          <button
            className={
              styles.selectedConfirm
            }
            onClick={
              onConfirm
            }
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitEffectsTooltip({
  unit,
}: {
  unit: UnitState;
}) {
  const artifact =
    unit.attachedArtifactId
      ? getGameCard(
          unit.attachedArtifactId
        )
      : null;

  return (
    <div
      className={
        styles.unitEffectsTooltip
      }
      role="tooltip"
    >
      <span
        className={
          styles.effectsEyebrow
        }
      >
        Active Effects
      </span>

      {artifact && (
        <div
          className={
            styles.effectTooltipRow
          }
        >
          <strong>
            ◆ {artifact.name}
          </strong>
          <small>
            {artifact.abilities[0]
              ?.text ??
              "Equipped Artifact"}
          </small>
        </div>
      )}

      {unit.modifiers.map(
        (modifier) => (
          <div
            key={modifier.id}
            className={
              styles.effectTooltipRow
            }
          >
            <strong>
              {modifierTitle(
                modifier
              )}
            </strong>
            <small>
              {modifierDescription(
                modifier
              )}
            </small>
          </div>
        )
      )}
    </div>
  );
}

function UnitDetailOverlay({
  unit,
  state,
  onClose,
}: {
  unit: UnitState;
  state: GameState;
  onClose: () => void;
}) {
  const card = getGameCard(
    unit.cardId
  );

  if (!isUnitCard(card)) {
    return null;
  }

  const artifact =
    unit.attachedArtifactId
      ? getGameCard(
          unit.attachedArtifactId
        )
      : null;

  const hasEffects =
    Boolean(artifact) ||
    unit.modifiers.length > 0;

  return (
    <div
      className={
        styles.unitDetailOverlay
      }
      style={tierStyle(card)}
      role="dialog"
      aria-modal="true"
      aria-label={`${card.name} details`}
    >
      <div
        className={
          styles.unitDetailCard
        }
      >
        <CardArtwork
          card={card}
          className={
            styles.fullCardArtwork
          }
        />

        <CardChrome card={card} />
        <CardSparkles />

        <CardInfoPanel
          card={card}
          runtimeStats={{
            power: getEffectivePower(
              state,
              unit
            ),
            influence:
              getEffectiveInfluence(
                state,
                unit
              ),
            health:
              unit.currentHealth,
            maxHealth:
              getMaximumHealth(unit),
          }}
          baseStats={{
            power: card.power,
            influence:
              card.cardType ===
              "character"
                ? card.influence
                : undefined,
            health: card.health,
          }}
        />
      </div>

      <aside
        className={
          styles.unitDetailEffects
        }
      >
        <span
          className={
            styles.effectsEyebrow
          }
        >
          Active Effects
        </span>

        <h2>{card.name}</h2>

        {!hasEffects && (
          <p
            className={
              styles.noEffects
            }
          >
            No active buffs,
            debuffs or equipped
            Artifacts.
          </p>
        )}

        {artifact && (
          <div
            className={`${styles.effectDetailRow} ${styles.artifactEffect}`}
          >
            <span>Artifact</span>
            <strong>
              ◆ {artifact.name}
            </strong>
            <p>
              {artifact.abilities[0]
                ?.text ??
                "Equipped Artifact"}
            </p>
          </div>
        )}

        {unit.modifiers.map(
          (modifier) => {
            const positive =
              (modifier.power ?? 0) > 0 ||
              (modifier.influence ?? 0) > 0 ||
              (modifier.health ?? 0) > 0 ||
              (modifier.cost ?? 0) < 0;

            return (
              <div
                key={modifier.id}
                className={`${styles.effectDetailRow} ${
                  positive
                    ? styles.positiveEffect
                    : styles.negativeEffect
                }`}
              >
                <span>
                  {positive
                    ? "Buff"
                    : "Debuff"}
                </span>
                <strong>
                  {modifierTitle(
                    modifier
                  )}
                </strong>
                <p>
                  {modifierDescription(
                    modifier
                  )}
                </p>
              </div>
            );
          }
        )}

        <button
          className={
            styles.detailCloseButton
          }
          onClick={onClose}
        >
          Close
        </button>
      </aside>
    </div>
  );
}

function ConfirmOverlay({
  title,
  text,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  text: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className={
        styles.confirmOverlay
      }
    >
      <div
        className={
          styles.confirmBox
        }
      >
        <h2>
          {title}
        </h2>

        <p>
          {text}
        </p>

        <div
          className={
            styles.menuActions
          }
        >
          <button
            className={
              styles.secondaryButton
            }
            onClick={
              onCancel
            }
          >
            Cancel
          </button>

          <button
            className={
              styles.dangerButton
            }
            onClick={
              onConfirm
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
