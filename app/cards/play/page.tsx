"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  DragEvent,
  ReactNode,
} from "react";

import {
  applyAction,
  BOARD_LIMIT,
  createGame,
  getEffectiveCost,
  getEffectiveInfluence,
  getEffectivePower,
  getMaximumHealth,
  getMilitaryTargetOptions,
  getPoliticalDefenseOptions,
  opponentOf,
  unitHasTrait,
} from "@/lib/the-great-game/engine";

import {
  getGameCard,
  isUnitCard,
} from "@/lib/the-great-game/cards";

import type {
  GameAction,
  GameCard,
  GameState,
  HandCardState,
  PlayerId,
  UnitState,
} from "@/lib/the-great-game/types";

import styles from "./play.module.css";

// ─────────────────────────────────────────────
// UI state
// ─────────────────────────────────────────────

type PendingPlay =
  | {
      kind: "deploy";
      handInstanceId: string;
    }
  | {
      kind: "confirm";
      handInstanceId: string;
    }
  | {
      kind: "artifact";
      handInstanceId: string;
    }
  | {
      kind: "manders-pact";
      handInstanceId: string;
    }
  | {
      kind: "veiled-sight";
      handInstanceId: string;
      committed: boolean;
    }
  | {
      kind: "iron-wrath";
      handInstanceId: string;
    }
  | {
      kind: "word-in-right-ear";
      handInstanceId: string;
    }
  | {
      kind: "brothers-tilt";
      handInstanceId: string;
    }
  | {
      kind: "trial-by-combat";
      handInstanceId: string;
      firstTargetInstanceId?: string;
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

function playerName(
  playerId: PlayerId
) {
  return playerId ===
    "player1"
    ? "Player 1"
    : "Player 2";
}

// ─────────────────────────────────────────────
// Artwork resolution
// ─────────────────────────────────────────────

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
  ] = useState(0);

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
    // Deliberately using img because the source
    // extension is resolved dynamically via onError.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        candidates[
          candidateIndex
        ]
      }
      alt={card.name}
      className={className}
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

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function GreatGamePlayPage() {
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

  useEffect(() => {
    setGame(
      createGame()
    );
  }, []);

  useEffect(() => {
    setMulliganSelected(
      []
    );
  }, [game?.phase]);

  const activePlayerId =
    game?.activePlayerId ??
    null;

  const enemyPlayerId =
    activePlayerId
      ? opponentOf(
          activePlayerId
        )
      : null;

  const activePlayer =
    game &&
    activePlayerId
      ? game.players[
          activePlayerId
        ]
      : null;

  const enemyPlayer =
    game &&
    enemyPlayerId
      ? game.players[
          enemyPlayerId
        ]
      : null;

  const alliedCharacters =
    useMemo(() => {
      if (
        !game ||
        !activePlayer
      ) {
        return [];
      }

      return activePlayer.board.filter(
        (unit) =>
          getGameCard(
            unit.cardId
          ).cardType ===
          "character"
      );
    }, [
      game,
      activePlayer,
    ]);

  const enemyCharacters =
    useMemo(() => {
      if (
        !game ||
        !enemyPlayer
      ) {
        return [];
      }

      return enemyPlayer.board.filter(
        (unit) =>
          getGameCard(
            unit.cardId
          ).cardType ===
          "character"
      );
    }, [
      game,
      enemyPlayer,
    ]);

  const allCharacters =
    useMemo(
      () => [
        ...alliedCharacters,
        ...enemyCharacters,
      ],
      [
        alliedCharacters,
        enemyCharacters,
      ]
    );

  const selectedHandCard =
    pendingPlay &&
    activePlayer
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

  const irreversibleVeiledSight =
    pendingPlay?.kind ===
      "veiled-sight" &&
    pendingPlay.committed;

  // ───────────────────────────────────────────
  // Generic dispatcher
  // ───────────────────────────────────────────

  function dispatch(
    action: GameAction
  ): boolean {
    if (!game) {
      return false;
    }

    const result =
      applyAction(
        game,
        action
      );

    if (!result.ok) {
      setError(
        result.error ??
          "Action failed."
      );

      return false;
    }

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

    return true;
  }

  function cancelSelection() {
    if (
      irreversibleVeiledSight
    ) {
      setError(
        "Veiled Sight has been committed. Choose a card from the opponent's hand."
      );

      return;
    }

    setPendingPlay(
      null
    );

    setPendingConflict(
      null
    );

    setError(null);

    setDraggingHandInstanceId(
      null
    );
  }

  // ───────────────────────────────────────────
  // Mulligan
  // ───────────────────────────────────────────

  function toggleMulliganCard(
    instanceId: string
  ) {
    setMulliganSelected(
      (current) =>
        current.includes(
          instanceId
        )
          ? current.filter(
              (id) =>
                id !==
                instanceId
            )
          : [
              ...current,
              instanceId,
            ]
    );
  }

  function confirmMulligan() {
    if (!game) {
      return;
    }

    const result =
      applyAction(
        game,
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

    setGame(
      result.state
    );

    setMulliganSelected(
      []
    );

    setError(null);

    // Privacy handoff:
    // P1 → P2 mulligan
    // P2 → P1 first turn
    setHandoff(true);
  }

  // ───────────────────────────────────────────
  // Restart
  // ───────────────────────────────────────────

  function restartGame() {
    setGame(
      createGame()
    );

    setError(null);

    setPendingPlay(null);

    setPendingConflict(
      null
    );

    setMulliganSelected(
      []
    );

    setDraggingHandInstanceId(
      null
    );

    setHandoff(false);
  }

  // ───────────────────────────────────────────
  // End turn
  // ───────────────────────────────────────────

  function endTurn() {
    if (!game) {
      return;
    }

    if (
      irreversibleVeiledSight
    ) {
      setError(
        "Resolve Veiled Sight before ending the turn."
      );

      return;
    }

    const result =
      applyAction(
        game,
        {
          type: "end-turn",
        }
      );

    if (!result.ok) {
      setError(
        result.error ??
          "Could not end turn."
      );

      return;
    }

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

    setHandoff(true);
  }

  // ───────────────────────────────────────────
  // Select hand card
  // ───────────────────────────────────────────

  function beginPlayCard(
    handCard: HandCardState
  ) {
    if (
      !game ||
      !activePlayer ||
      !enemyPlayer
    ) {
      return;
    }

    if (
      irreversibleVeiledSight
    ) {
      setError(
        "Resolve Veiled Sight first."
      );

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

    // Artifact
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
        kind: "artifact",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // Renrose
    if (
      card.id ===
        "renrose-tyrell" &&
      allCharacters.length >
        0
    ) {
      setPendingPlay({
        kind:
          "manders-pact",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // Saera
    if (
      card.id ===
        "saera-targaryen" &&
      enemyPlayer.hand.length >
        0
    ) {
      setPendingPlay({
        kind:
          "veiled-sight",

        handInstanceId:
          handCard.instanceId,

        committed: false,
      });

      return;
    }

    // Baelenys
    if (
      card.id ===
        "baelenys-targaryen" &&
      enemyCharacters.length >
        0
    ) {
      setPendingPlay({
        kind:
          "iron-wrath",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // A Word in the Right Ear
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

    // Trial by Combat
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

    // Brothers' Tilt
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

    // Normal Character / Dragon
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

    // Location / untargeted Event / Royal Favor
    setPendingPlay({
      kind: "confirm",

      handInstanceId:
        handCard.instanceId,
    });
  }

  // ───────────────────────────────────────────
  // Saera hidden-information commit
  // ───────────────────────────────────────────

  function commitVeiledSight() {
    if (
      !game ||
      !activePlayer ||
      pendingPlay?.kind !==
        "veiled-sight" ||
      pendingPlay.committed
    ) {
      return;
    }

    const handCard =
      activePlayer.hand.find(
        (card) =>
          card.instanceId ===
          pendingPlay.handInstanceId
      );

    if (!handCard) {
      return;
    }

    const cost =
      getEffectiveCost(
        game,
        game.activePlayerId,
        handCard
      );

    if (
      activePlayer.command <
      cost
    ) {
      setError(
        `Not enough Command. Saera Targaryen costs ${cost}.`
      );

      return;
    }

    if (
      activePlayer.board.length >=
      BOARD_LIMIT
    ) {
      setError(
        "Your board is full."
      );

      return;
    }

    /**
     * From this point onward the player has
     * committed to playing Saera.
     *
     * We reveal the opponent hand only now,
     * so selecting Saera and cancelling cannot
     * be abused to inspect hidden information.
     */
    setPendingPlay({
      ...pendingPlay,

      committed: true,
    });

    setError(null);
  }

  // ───────────────────────────────────────────
  // Confirm simple board play
  // ───────────────────────────────────────────

  function confirmSelectedOnBoard() {
    if (!pendingPlay) {
      return;
    }

    if (
      pendingPlay.kind ===
      "veiled-sight"
    ) {
      commitVeiledSight();

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
      type: "play-card",

      handInstanceId:
        pendingPlay.handInstanceId,
    });
  }

  // ───────────────────────────────────────────
  // Unit target
  // ───────────────────────────────────────────

  function handleUnitTarget(
    unit: UnitState
  ) {
    if (!game) {
      return;
    }

    if (pendingPlay) {
      switch (
        pendingPlay.kind
      ) {
        case "artifact": {
          if (
            unit.ownerId !==
              game.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character" ||
            unit.attachedArtifactId
          ) {
            return;
          }

          dispatch({
            type: "play-card",

            handInstanceId:
              pendingPlay.handInstanceId,

            targetInstanceId:
              unit.instanceId,
          });

          return;
        }

        case "manders-pact": {
          if (
            getGameCard(
              unit.cardId
            ).cardType !==
            "character"
          ) {
            return;
          }

          dispatch({
            type: "play-card",

            handInstanceId:
              pendingPlay.handInstanceId,

            targetInstanceId:
              unit.instanceId,
          });

          return;
        }

        case "iron-wrath": {
          if (
            unit.ownerId ===
              game.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character"
          ) {
            return;
          }

          dispatch({
            type: "play-card",

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
            type: "play-card",

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
              game.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character"
          ) {
            return;
          }

          dispatch({
            type: "play-card",

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
                game.activePlayerId ||
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
            });

            return;
          }

          if (
            unit.ownerId ===
              game.activePlayerId ||
            getGameCard(
              unit.cardId
            ).cardType !==
              "character"
          ) {
            return;
          }

          dispatch({
            type: "play-card",

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
        case "veiled-sight":
          break;
      }
    }

    // Military target
    if (
      pendingConflict?.kind ===
      "military"
    ) {
      const options =
        getMilitaryTargetOptions(
          game,
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

    // Political target
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

  // ───────────────────────────────────────────
  // Veiled Sight hand target
  // ───────────────────────────────────────────

  function targetEnemyHandCard(
    handCard: HandCardState
  ) {
    if (
      pendingPlay?.kind !==
        "veiled-sight" ||
      !pendingPlay.committed
    ) {
      return;
    }

    dispatch({
      type: "play-card",

      handInstanceId:
        pendingPlay.handInstanceId,

      targetHandInstanceId:
        handCard.instanceId,
    });
  }

  // ───────────────────────────────────────────
  // Military selection
  // ───────────────────────────────────────────

  function beginMilitary(
    unit: UnitState
  ) {
    if (!game) {
      return;
    }

    if (
      irreversibleVeiledSight
    ) {
      return;
    }

    setError(null);

    setPendingPlay(
      null
    );

    const options =
      getMilitaryTargetOptions(
        game,
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
      kind: "military",

      attackerInstanceId:
        unit.instanceId,
    });
  }

  function attackStandingMilitary() {
    if (
      !game ||
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
          game.activePlayerId
        ),
    });
  }

  // ───────────────────────────────────────────
  // Political selection
  // ───────────────────────────────────────────

  function beginPolitical(
    unit: UnitState
  ) {
    if (!game) {
      return;
    }

    if (
      irreversibleVeiledSight
    ) {
      return;
    }

    setError(null);

    setPendingPlay(
      null
    );

    const defense =
      getPoliticalDefenseOptions(
        game,
        unit.instanceId
      );

    /**
     * IMPORTANT:
     * Even when unopposed, Political does
     * NOT auto-resolve anymore.
     *
     * Enemy Standing becomes a target and
     * requires a second click.
     */
    setPendingConflict({
      kind: "political",

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
      !game ||
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

  // ───────────────────────────────────────────
  // Eligibility
  // ───────────────────────────────────────────

  function canMilitaryAttack(
    unit: UnitState
  ) {
    if (!game) {
      return false;
    }

    if (
      unit.ownerId !==
        game.activePlayerId ||
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
      game,
      unit,
      "swift"
    );
  }

  function canPoliticalAttack(
    unit: UnitState
  ) {
    if (!game) {
      return false;
    }

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
        game.activePlayerId ||
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
      game,
      unit,
      "schemer"
    );
  }

  // ───────────────────────────────────────────
  // Target highlights
  // ───────────────────────────────────────────

  function isUnitTargetable(
    unit: UnitState
  ) {
    if (!game) {
      return false;
    }

    if (pendingPlay) {
      switch (
        pendingPlay.kind
      ) {
        case "artifact":
          return (
            unit.ownerId ===
              game.activePlayerId &&
            getGameCard(
              unit.cardId
            ).cardType ===
              "character" &&
            !unit.attachedArtifactId
          );

        case "manders-pact":
          return (
            getGameCard(
              unit.cardId
            ).cardType ===
            "character"
          );

        case "iron-wrath":
          return (
            unit.ownerId !==
              game.activePlayerId &&
            getGameCard(
              unit.cardId
            ).cardType ===
              "character"
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
              game.activePlayerId &&
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
                game.activePlayerId &&
              getGameCard(
                unit.cardId
              ).cardType ===
                "character"
            );
          }

          return (
            unit.ownerId !==
              game.activePlayerId &&
            getGameCard(
              unit.cardId
            ).cardType ===
              "character"
          );

        case "deploy":
        case "confirm":
        case "veiled-sight":
          return false;
      }
    }

    if (
      pendingConflict?.kind ===
      "military"
    ) {
      return getMilitaryTargetOptions(
        game,
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

        case "manders-pact":
          return "Choose another Character for The Mander's Pact.";

        case "veiled-sight":
          return pendingPlay.committed
            ? "Veiled Sight — choose a card from the opponent's revealed hand."
            : "Deploy Saera to commit Veiled Sight and reveal the opponent's hand.";

        case "iron-wrath":
          return "Choose an enemy Character to suffer Iron Wrath.";

        case "word-in-right-ear":
          return "Choose any Character to gain +1 Influence this turn.";

        case "brothers-tilt":
          return "Choose a Character you control for The Brothers' Tilt.";

        case "trial-by-combat":
          return pendingPlay
            .firstTargetInstanceId
            ? "Trial by Combat — now choose the enemy Character."
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
        return "Political Conflict — enemy Standing is unopposed. Click Standing to confirm the attack.";
      }

      return pendingConflict.selectionBy ===
        "attacker"
        ? "Choose the Political defender."
        : "The defending player chooses the Political defender.";
    }

    return null;
  }

  // ───────────────────────────────────────────
  // Drag
  // ───────────────────────────────────────────

  function handleHandDragStart(
    event: DragEvent,
    handCard: HandCardState
  ) {
    if (
      pendingConflict ||
      irreversibleVeiledSight
    ) {
      event.preventDefault();

      return;
    }

    beginPlayCard(
      handCard
    );

    setDraggingHandInstanceId(
      handCard.instanceId
    );

    event.dataTransfer.effectAllowed =
      "move";

    event.dataTransfer.setData(
      "text/plain",
      handCard.instanceId
    );
  }

  function handleHandDragEnd() {
    setDraggingHandInstanceId(
      null
    );
  }

  function handleBoardDragOver(
    event: DragEvent
  ) {
    if (
      pendingPlay?.kind ===
        "deploy" ||
      pendingPlay?.kind ===
        "confirm" ||
      (
        pendingPlay?.kind ===
          "veiled-sight" &&
        !pendingPlay.committed
      )
    ) {
      event.preventDefault();

      event.dataTransfer.dropEffect =
        "move";
    }
  }

  function handleBoardDrop(
    event: DragEvent
  ) {
    event.preventDefault();

    confirmSelectedOnBoard();

    setDraggingHandInstanceId(
      null
    );
  }

  // ───────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────

  if (!game) {
    return (
      <main
        className={
          styles.loading
        }
      >
        <div
          className={
            styles.pageBackground
          }
          aria-hidden
        />

        Preparing The Great Game...
      </main>
    );
  }

  // ───────────────────────────────────────────
  // Winner
  // ───────────────────────────────────────────

  if (game.winner) {
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
            {game.winner ===
            "draw"
              ? "The Realm Lies Broken"
              : `${playerName(game.winner)} Prevails`}
          </h1>

          <p>
            {game.winner ===
            "draw"
              ? "Neither claimant remains standing."
              : "The opposing claimant has lost all Standing."}
          </p>

          <button
            className={
              styles.primaryButton
            }
            onClick={
              restartGame
            }
          >
            Begin Another Game
          </button>
        </div>
      </main>
    );
  }

  // ───────────────────────────────────────────
  // Privacy handoff
  // ───────────────────────────────────────────

  if (handoff) {
    const mulliganHandoff =
      game.phase ===
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
              : `Turn ${game.players[game.activePlayerId].turnsTaken}`}
          </span>

          <h1>
            Pass the Realm
          </h1>

          <p>
            Give the device to{" "}
            <strong>
              {playerName(
                game.activePlayerId
              )}
            </strong>
            .
          </p>

          <button
            className={
              styles.primaryButton
            }
            onClick={() =>
              setHandoff(
                false
              )
            }
          >
            {mulliganHandoff
              ? `Review ${playerName(game.activePlayerId)} Opening Hand`
              : `Begin ${playerName(game.activePlayerId)}'s Turn`}
          </button>
        </div>
      </main>
    );
  }

  // ───────────────────────────────────────────
  // Mulligan
  // ───────────────────────────────────────────

  if (
    game.phase ===
      "mulligan-player1" ||
    game.phase ===
      "mulligan-player2"
  ) {
    return (
      <MulliganScreen
        game={game}
        selectedIds={
          mulliganSelected
        }
        onToggle={
          toggleMulliganCard
        }
        onConfirm={
          confirmMulligan
        }
        onRestart={
          restartGame
        }
        error={error}
      />
    );
  }

  const prompt =
    getPrompt();

  const activeLocation =
    game.activeLocation
      ? getGameCard(
          game.activeLocation.cardId
        )
      : null;

  const militaryStandingTarget =
    pendingConflict?.kind ===
      "military" &&
    getMilitaryTargetOptions(
      game,
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
      "confirm" ||
    (
      pendingPlay?.kind ===
        "veiled-sight" &&
      !pendingPlay.committed
    );

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

      {/* HEADER */}

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
              game.activePlayerId
            )}
          </span>

          <strong>
            Turn{" "}
            {
              game.players[
                game.activePlayerId
              ].turnsTaken
            }
          </strong>

          <button
            className={
              styles.smallButton
            }
            onClick={
              restartGame
            }
          >
            New Game
          </button>
        </div>
      </header>

      {/* LOCATION */}

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
              irreversibleVeiledSight
            }
            onClick={
              cancelSelection
            }
          >
            {irreversibleVeiledSight
              ? "Committed"
              : "Cancel"}
          </button>
        </div>
      )}

      {/* OPPONENT HUD */}

      <PlayerHeader
        playerId={
          enemyPlayerId!
        }
        state={game}
        opponent
        standingTarget={
          militaryStandingTarget ||
          politicalStandingTarget
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

      {/* VEILED SIGHT */}

      {pendingPlay?.kind ===
        "veiled-sight" &&
        pendingPlay.committed && (
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
              Opponent&apos;s
              Revealed Hand
            </div>

            <div
              className={
                styles.hand
              }
            >
              {enemyPlayer!.hand.map(
                (
                  handCard
                ) => {
                  const card =
                    getGameCard(
                      handCard.cardId
                    );

                  return (
                    <button
                      key={
                        handCard.instanceId
                      }
                      className={`${styles.handCard} ${styles.targetableHandCard}`}
                      onClick={() =>
                        targetEnemyHandCard(
                          handCard
                        )
                      }
                      onDragOver={(
                        event
                      ) => {
                        event.preventDefault();
                      }}
                      onDrop={(
                        event
                      ) => {
                        event.preventDefault();

                        targetEnemyHandCard(
                          handCard
                        );
                      }}
                    >
                      <span
                        className={
                          styles.cost
                        }
                      >
                        {getEffectiveCost(
                          game,
                          enemyPlayerId!,
                          handCard
                        )}
                      </span>

                      <CardArtwork
                        card={
                          card
                        }
                        className={
                          styles.handArtwork
                        }
                      />

                      <span
                        className={
                          styles.cardType
                        }
                      >
                        {
                          card.cardType
                        }
                      </span>

                      <strong
                        className={
                          styles.handCardName
                        }
                      >
                        {card.name}
                      </strong>
                    </button>
                  );
                }
              )}
            </div>
          </section>
        )}

      {/* OPPONENT BOARD */}

      <Board
        title="Opponent's Board"
        units={
          enemyPlayer!.board
        }
        state={game}
        targetable={
          isUnitTargetable
        }
        onUnitClick={
          handleUnitTarget
        }
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

      {/* ACTIVE BOARD */}

      <Board
        title="Your Board"
        units={
          activePlayer!.board
        }
        state={game}
        targetable={
          isUnitTargetable
        }
        onUnitClick={
          handleUnitTarget
        }
        selectedInstanceId={
          selectedAttacker
        }
        canReceivePlay={
          Boolean(
            canReceiveBoardPlay
          )
        }
        onBoardClick={
          canReceiveBoardPlay
            ? confirmSelectedOnBoard
            : undefined
        }
        onBoardDragOver={
          canReceiveBoardPlay
            ? handleBoardDragOver
            : undefined
        }
        onBoardDrop={
          canReceiveBoardPlay
            ? handleBoardDrop
            : undefined
        }
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
                    pendingConflict
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
                      pendingConflict
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

      {/* PLAYER HUD */}

      <PlayerHeader
        playerId={
          activePlayerId!
        }
        state={game}
      />

      {/* HAND */}

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
              Drag a card or
              click to select it
            </small>
          </div>

          <button
            className={
              styles.endTurnButton
            }
            onClick={
              endTurn
            }
          >
            End Turn
          </button>
        </div>

        <div
          className={
            styles.hand
          }
        >
          {activePlayer!.hand.map(
            (handCard) => (
              <HandCard
                key={
                  handCard.instanceId
                }
                handCard={
                  handCard
                }
                state={
                  game
                }
                playerId={
                  activePlayerId!
                }
                selected={
                  pendingPlay?.handInstanceId ===
                  handCard.instanceId
                }
                dragging={
                  draggingHandInstanceId ===
                  handCard.instanceId
                }
                interactionLocked={
                  Boolean(
                    pendingConflict
                  ) ||
                  irreversibleVeiledSight
                }
                onPlay={() =>
                  beginPlayCard(
                    handCard
                  )
                }
                onDragStart={(
                  event
                ) =>
                  handleHandDragStart(
                    event,
                    handCard
                  )
                }
                onDragEnd={
                  handleHandDragEnd
                }
              />
            )
          )}
        </div>
      </section>

      {/* CHRONICLE */}

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
          {[...game.log]
            .reverse()
            .slice(0, 30)
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

      {/* SELECTED HAND CARD */}

      {selectedHandCard &&
        selectedCard && (
          <>
            <div
              className={
                styles.selectionShade
              }
              aria-hidden
            />

            <SelectedCardPreview
              card={
                selectedCard
              }
              handCard={
                selectedHandCard
              }
              state={game}
              playerId={
                activePlayerId!
              }
              pendingPlay={
                pendingPlay!
              }
              canCancel={
                !irreversibleVeiledSight
              }
              onCancel={
                cancelSelection
              }
              onConfirm={
                confirmSelectedOnBoard
              }
            />
          </>
        )}
    </main>
  );
}

// ─────────────────────────────────────────────
// Mulligan screen
// ─────────────────────────────────────────────

function MulliganScreen({
  game,
  selectedIds,
  onToggle,
  onConfirm,
  onRestart,
  error,
}: {
  game: GameState;

  selectedIds: string[];

  onToggle: (
    instanceId: string
  ) => void;

  onConfirm: () => void;

  onRestart: () => void;

  error: string | null;
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
            onRestart
          }
        >
          New Game
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
          Choose cards to
          replace
        </h2>

        <p>
          Selected cards are set
          aside, replacements are
          drawn, then the replaced
          cards are shuffled back
          into your deck.
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
                onClick={() =>
                  onToggle(
                    handCard.instanceId
                  )
                }
              >
                <span
                  className={
                    styles.cost
                  }
                >
                  {
                    card.cost
                  }
                </span>

                <CardArtwork
                  card={card}
                  className={
                    styles.mulliganArtwork
                  }
                />

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
                  {
                    card.name
                  }
                </strong>

                {isUnitCard(
                  card
                ) && (
                  <div
                    className={
                      styles.miniStats
                    }
                  >
                    <span>
                      ⚔{" "}
                      {
                        card.power
                      }
                    </span>

                    {card.cardType ===
                      "character" && (
                      <span>
                        ♛{" "}
                        {
                          card.influence
                        }
                      </span>
                    )}

                    <span>
                      ♥{" "}
                      {
                        card.health
                      }
                    </span>
                  </div>
                )}

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
          </strong>{" "}
          selected for replacement
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
    </main>
  );
}

// ─────────────────────────────────────────────
// Player HUD
// ─────────────────────────────────────────────

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

      <div
        className={
          styles.playerStats
        }
      >
        {!opponent && (
          <HudStat
            label="Command"
            value={`${player.command}/${player.maxCommand}`}
            accent
          />
        )}

        <HudStat
          label="Deck"
          value={
            player.deck.length
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

        {player.nextCommandBonus >
          0 && (
          <HudStat
            label="Next Turn"
            value={`+${player.nextCommandBonus} Command`}
            accent
          />
        )}
      </div>
    </section>
  );
}

function HudStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value:
    | string
    | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`${styles.hudStat} ${
        accent
          ? styles.hudStatAccent
          : ""
      }`}
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

// ─────────────────────────────────────────────
// Board
// ─────────────────────────────────────────────

function Board({
  title,
  units,
  state,
  targetable,
  onUnitClick,
  selectedInstanceId,
  renderActions,
  canReceivePlay = false,
  onBoardClick,
  onBoardDragOver,
  onBoardDrop,
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

  selectedInstanceId?:
    | string
    | null;

  renderActions?: (
    unit: UnitState
  ) => ReactNode;

  canReceivePlay?: boolean;

  onBoardClick?: () => void;

  onBoardDragOver?: (
    event: DragEvent
  ) => void;

  onBoardDrop?: (
    event: DragEvent
  ) => void;
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
        onDragOver={
          onBoardDragOver
        }
        onDrop={
          onBoardDrop
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

// ─────────────────────────────────────────────
// Board card
// ─────────────────────────────────────────────

function BoardUnit({
  unit,
  state,
  targetable,
  selected,
  onClick,
  actions,
}: {
  unit: UnitState;

  state: GameState;

  targetable: boolean;

  selected: boolean;

  onClick: () => void;

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

  return (
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
      onClick={(
        event
      ) => {
        event.stopPropagation();

        if (
          targetable
        ) {
          onClick();
        }
      }}
      onDragOver={(
        event
      ) => {
        if (
          targetable
        ) {
          event.preventDefault();

          event.stopPropagation();
        }
      }}
      onDrop={(
        event
      ) => {
        if (
          targetable
        ) {
          event.preventDefault();

          event.stopPropagation();

          onClick();
        }
      }}
    >
      <CardArtwork
        card={card}
        className={
          styles.boardArtwork
        }
      />

      <div
        className={
          styles.unitTop
        }
      >
        <span
          className={
            styles.cardType
          }
        >
          {card.cardType}
        </span>

        {unit.deployedThisTurn && (
          <span
            className={
              styles.deployedBadge
            }
          >
            Deployed
          </span>
        )}
      </div>

      <h3>
        {card.name}
      </h3>

      {card.subtitle && (
        <div
          className={
            styles.cardSubtitle
          }
        >
          {card.subtitle}
        </div>
      )}

      <div
        className={
          styles.stats
        }
      >
        <span>
          <b>⚔</b>{" "}
          {power}
        </span>

        {card.cardType ===
          "character" && (
          <span>
            <b>♛</b>{" "}
            {influence}
          </span>
        )}

        <span>
          <b>♥</b>{" "}
          {
            unit.currentHealth
          }
          /{maxHealth}
        </span>
      </div>

      {card.traits.length >
        0 && (
        <div
          className={
            styles.traits
          }
        >
          {card.traits.map(
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
        </div>
      )}

      {card.abilities.map(
        (ability) => (
          <div
            key={
              ability.id
            }
            className={
              styles.ability
            }
          >
            <strong>
              {
                ability.name
              }
            </strong>

            <p>
              {
                ability.text
              }
            </p>
          </div>
        )
      )}

      {weylarProgress !==
        null && (
        <div
          className={
            styles.skillProgress
          }
        >
          <span>
            The Price of
            Loyalty
          </span>

          <strong>
            {unit.flags[
              "weylar-triggered"
            ]
              ? "Triggered"
              : `${weylarProgress}/3`}
          </strong>
        </div>
      )}

      {unit.attachedArtifactId && (
        <div
          className={
            styles.artifact
          }
        >
          Equipped{" "}
          <strong>
            {
              getGameCard(
                unit.attachedArtifactId
              ).name
            }
          </strong>
        </div>
      )}

      <div
        className={
          styles.statuses
        }
      >
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

// ─────────────────────────────────────────────
// Hand card
// ─────────────────────────────────────────────

function HandCard({
  handCard,
  state,
  playerId,
  selected,
  dragging,
  interactionLocked,
  onPlay,
  onDragStart,
  onDragEnd,
}: {
  handCard: HandCardState;

  state: GameState;

  playerId: PlayerId;

  selected: boolean;

  dragging: boolean;

  interactionLocked: boolean;

  onPlay: () => void;

  onDragStart: (
    event: DragEvent
  ) => void;

  onDragEnd: () => void;
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
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={
        interactionLocked
      }
      onClick={
        onPlay
      }
      draggable={
        !interactionLocked
      }
      onDragStart={
        onDragStart
      }
      onDragEnd={
        onDragEnd
      }
    >
      <span
        className={
          styles.cost
        }
      >
        {cost}
      </span>

      <CardArtwork
        card={card}
        className={
          styles.handArtwork
        }
      />

      <span
        className={
          styles.cardType
        }
      >
        {card.cardType}
      </span>

      <strong
        className={
          styles.handCardName
        }
      >
        {card.name}
      </strong>

      {card.subtitle && (
        <small
          className={
            styles.cardSubtitle
          }
        >
          {card.subtitle}
        </small>
      )}

      {isUnitCard(card) && (
        <div
          className={
            styles.miniStats
          }
        >
          <span>
            <b>⚔</b>{" "}
            {card.power}
          </span>

          {card.cardType ===
            "character" && (
            <span>
              <b>♛</b>{" "}
              {
                card.influence
              }
            </span>
          )}

          <span>
            <b>♥</b>{" "}
            {card.health}
          </span>
        </div>
      )}

      {card.traits.length >
        0 && (
        <div
          className={
            styles.traits
          }
        >
          {card.traits.map(
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
        </div>
      )}

      {card.abilities.map(
        (ability) => (
          <p
            key={
              ability.id
            }
            className={
              styles.handAbility
            }
          >
            <b>
              {
                ability.name
              }
              .
            </b>{" "}
            {ability.text}
          </p>
        )
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
// Selected large card
// ─────────────────────────────────────────────

function SelectedCardPreview({
  card,
  handCard,
  state,
  playerId,
  pendingPlay,
  canCancel,
  onCancel,
  onConfirm,
}: {
  card: GameCard;

  handCard: HandCardState;

  state: GameState;

  playerId: PlayerId;

  pendingPlay: PendingPlay;

  canCancel: boolean;

  onCancel: () => void;

  onConfirm: () => void;
}) {
  const cost =
    getEffectiveCost(
      state,
      playerId,
      handCard
    );

  const confirmable =
    pendingPlay.kind ===
      "deploy" ||
    pendingPlay.kind ===
      "confirm" ||
    (
      pendingPlay.kind ===
        "veiled-sight" &&
      !pendingPlay.committed
    );

  const label =
    pendingPlay.kind ===
      "deploy"
      ? "Deploy"
      : pendingPlay.kind ===
          "veiled-sight"
        ? "Deploy Saera"
        : "Play Card";

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
      >
        <span
          className={
            styles.selectedCost
          }
        >
          {cost}
        </span>

        <CardArtwork
          card={card}
          className={
            styles.selectedArtwork
          }
        />

        <span
          className={
            styles.cardType
          }
        >
          {card.cardType}
        </span>

        <h2>
          {card.name}
        </h2>

        {card.subtitle && (
          <div
            className={
              styles.cardSubtitle
            }
          >
            {card.subtitle}
          </div>
        )}

        {isUnitCard(card) && (
          <div
            className={
              styles.selectedStats
            }
          >
            <span>
              ⚔ {card.power}
            </span>

            {card.cardType ===
              "character" && (
              <span>
                ♛{" "}
                {
                  card.influence
                }
              </span>
            )}

            <span>
              ♥ {card.health}
            </span>
          </div>
        )}

        {card.traits.length >
          0 && (
          <div
            className={
              styles.traits
            }
          >
            {card.traits.map(
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
          </div>
        )}

        {card.abilities.map(
          (ability) => (
            <div
              key={
                ability.id
              }
              className={
                styles.selectedAbility
              }
            >
              <strong>
                {
                  ability.name
                }
              </strong>

              <p>
                {
                  ability.text
                }
              </p>
            </div>
          )
        )}

        <div
          className={
            styles.selectedActions
          }
        >
          {canCancel && (
            <button
              onClick={
                onCancel
              }
            >
              Cancel
            </button>
          )}

          {confirmable && (
            <button
              className={
                styles.selectedConfirm
              }
              onClick={
                onConfirm
              }
            >
              {label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}