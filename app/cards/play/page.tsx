"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CSSProperties,
  DragEvent,
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

import {
  getTiers,
} from "@/lib/cards";

import type {
  AbilityTrigger,
  GameAction,
  GameCard,
  GameState,
  HandCardState,
  PlayerId,
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

const TIER_MAP =
  new Map(
    getTiers().map(
      (tier) => [
        tier.id,
        tier,
      ]
    )
  );

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

function playerName(
  playerId: PlayerId
) {
  return playerId ===
    "player1"
    ? "Player 1"
    : "Player 2";
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
    currentGame,
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
    exitConfirm,
    setExitConfirm,
  ] =
    useState(false);

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
    setExitConfirm(false);
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
    setExitConfirm(false);
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

  const gameInteractionLocked =
    Boolean(
      currentGame.pendingEffect
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
      currentGame.pendingEffect
    ) {
      setError(
        "Resolve the pending Arrival ability first."
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

  function handleHandDragStart(
    event: DragEvent,
    handCard: HandCardState
  ) {
    if (
      currentGame.pendingEffect ||
      pendingConflict
    ) {
      event.preventDefault();

      return;
    }

    setPendingPlay(null);

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

  function handleBoardDragOver(
    event: DragEvent
  ) {
    if (
      !draggingHandInstanceId
    ) {
      return;
    }

    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";
  }

  function handleBoardDrop(
    event: DragEvent
  ) {
    event.preventDefault();

    const handCard =
      getDraggedHandCard();

    if (!handCard) {
      return;
    }

    const card =
      getGameCard(
        handCard.cardId
      );

    setDraggingHandInstanceId(
      null
    );

    if (
      isUnitCard(card) ||
      card.cardType ===
        "location" ||
      card.id ===
        "oldtown-massacre" ||
      card.id ===
        "royal-favor"
    ) {
      dispatch({
        type:
          "play-card",

        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    setError(
      `${card.name} must be dropped onto a valid target.`
    );
  }

  function handleDropOnUnit(
    event: DragEvent,
    unit: UnitState
  ) {
    event.preventDefault();
    event.stopPropagation();

    const handCard =
      getDraggedHandCard();

    if (!handCard) {
      return;
    }

    const card =
      getGameCard(
        handCard.cardId
      );

    setDraggingHandInstanceId(
      null
    );

    if (
      isUnitCard(card)
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

    dispatch({
      type:
        "play-card",

      handInstanceId:
        handCard.instanceId,
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
            onClick={() =>
              setHandoff(
                false
              )
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

          <div
            className={
              styles.hand
            }
          >
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
          </div>
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
        selectedInstanceId={
          selectedAttacker
        }
        onDropOnUnit={
          handleDropOnUnit
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
        selectedInstanceId={
          selectedAttacker
        }
        canReceivePlay={
          Boolean(
            canReceiveBoardPlay ||
              draggingHandInstanceId
          )
        }
        onBoardClick={
          canReceiveBoardPlay
            ? confirmSelectedOnBoard
            : undefined
        }
        onBoardDragOver={
          handleBoardDragOver
        }
        onBoardDrop={
          handleBoardDrop
        }
        onDropOnUnit={
          handleDropOnUnit
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

          <button
            className={`${styles.endTurnButton} ${
              highlightEndTurn
                ? styles.endTurnReady
                : ""
            }`}
            disabled={
              Boolean(
                currentGame.pendingEffect
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

        <div
          className={
            styles.hand
          }
        >
          {activePlayer.hand.map(
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
                interactionLocked={
                  Boolean(
                    currentGame.pendingEffect ||
                      pendingConflict
                  )
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
                confirmSelectedOnBoard
              }
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
  currentGame,
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
    currentGame.activePlayerId;

  const player =
    currentGame.players[
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

      <div
        className={
          styles.playerStats
        }
      >
        {/* Always visible for BOTH players */}
        <HudStat
          label="Command"
          value={`${player.command}/${player.maxCommand}`}
          accent
        />

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
  onDropOnUnit,
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
  onDropOnUnit?: (
    event: DragEvent,
    unit: UnitState
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
              onDrop={(
                event
              ) =>
                onDropOnUnit?.(
                  event,
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

function BoardUnit({
  unit,
  state,
  targetable,
  selected,
  onClick,
  onDrop,
  actions,
}: {
  unit: UnitState;
  state: GameState;
  targetable: boolean;
  selected: boolean;
  onClick: () => void;
  onDrop: (
    event: DragEvent
  ) => void;
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
      style={
        tierStyle(card)
      }
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
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={
        onDrop
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
      />

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

                <strong>
                  {unit.flags[
                    "weylar-triggered"
                  ]
                    ? "✓"
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
  );
}

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
      style={
        tierStyle(card)
      }
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

      <CardInfoPanel
        card={card}
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

      <CardInfoPanel
        card={card}
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
        >
          {cost}
        </span>
      )}

      <span
        className={
          styles.tierBadge
        }
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
  actions,
  footer,
}: {
  card: GameCard;
  runtimeStats?: {
    power: number;
    influence: number;
    health: number;
    maxHealth: number;
  };
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  const traits =
    visibleTraits(
      card
    );

  return (
    <div
      className={
        styles.cardInfoPanel
      }
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

        {card.subtitle && (
          <small>
            {card.subtitle}
          </small>
        )}
      </div>

      {isUnitCard(card) && (
        <div
          className={
            styles.cardStats
          }
        >
          <span>
            ⚔{" "}
            {runtimeStats
              ?.power ??
              card.power}
          </span>

          {card.cardType ===
            "character" && (
            <span>
              ♛{" "}
              {runtimeStats
                ?.influence ??
                card.influence}
            </span>
          )}

          <span>
            ♥{" "}
            {runtimeStats
              ? `${runtimeStats.health}/${runtimeStats.maxHealth}`
              : card.health}
          </span>
        </div>
      )}

      {traits.length >
        0 && (
        <div
          className={
            styles.traits
          }
        >
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
        </div>
      )}

      {card.abilities[0] && (
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
        />
      )}

      {footer}

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
}: {
  trigger: AbilityTrigger;
  name: string;
  text: string;
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
          {name}
        </strong>
      </div>

      <p>
        {text}
      </p>
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

  const confirmable =
    pendingPlay.kind ===
      "deploy" ||
    pendingPlay.kind ===
      "confirm";

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

          {confirmable && (
            <button
              className={
                styles.selectedConfirm
              }
              onClick={
                onConfirm
              }
            >
              {pendingPlay.kind ===
              "deploy"
                ? "Deploy"
                : "Play Card"}
            </button>
          )}
        </div>
      </div>
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