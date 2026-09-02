"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import {
  applyAction,
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
  GameState,
  HandCardState,
  PlayerId,
  UnitState,
} from "@/lib/the-great-game/types";

import styles from "./play.module.css";

// ─────────────────────────────────────────────
// Local UI state
// ─────────────────────────────────────────────

type PendingPlay =
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
    }
  | {
      kind: "iron-wrath";
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
      selectionBy: "attacker" | "defender";
    };

function playerName(playerId: PlayerId) {
  return playerId === "player1"
    ? "Player 1"
    : "Player 2";
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function GreatGamePlayPage() {
  const [game, setGame] = useState<GameState | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [pendingPlay, setPendingPlay] =
    useState<PendingPlay | null>(null);

  const [pendingConflict, setPendingConflict] =
    useState<PendingConflict | null>(null);

  const [handoff, setHandoff] = useState(false);

  // Deck shuffling uses Math.random(), so game creation
  // happens client-side after mount.
  useEffect(() => {
    setGame(createGame());
  }, []);

  const activePlayerId = game?.activePlayerId ?? null;

  const enemyPlayerId = activePlayerId
    ? opponentOf(activePlayerId)
    : null;

  const activePlayer =
    game && activePlayerId
      ? game.players[activePlayerId]
      : null;

  const enemyPlayer =
    game && enemyPlayerId
      ? game.players[enemyPlayerId]
      : null;

  // ───────────────────────────────────────────
  // Board lists
  // ───────────────────────────────────────────

  const alliedCharacters = useMemo(() => {
    if (!game || !activePlayer) {
      return [];
    }

    return activePlayer.board.filter((unit) => {
      return (
        getGameCard(unit.cardId).cardType ===
        "character"
      );
    });
  }, [game, activePlayer]);

  const enemyCharacters = useMemo(() => {
    if (!game || !enemyPlayer) {
      return [];
    }

    return enemyPlayer.board.filter((unit) => {
      return (
        getGameCard(unit.cardId).cardType ===
        "character"
      );
    });
  }, [game, enemyPlayer]);

  const allCharacters = useMemo(
    () => [
      ...alliedCharacters,
      ...enemyCharacters,
    ],
    [alliedCharacters, enemyCharacters]
  );

  // ───────────────────────────────────────────
  // Action dispatcher
  // ───────────────────────────────────────────

  function dispatch(action: GameAction): boolean {
    if (!game) {
      return false;
    }

    const result = applyAction(game, action);

    if (!result.ok) {
      setError(
        result.error ?? "Action failed."
      );

      return false;
    }

    setGame(result.state);
    setError(null);

    setPendingPlay(null);
    setPendingConflict(null);

    return true;
  }

  // ───────────────────────────────────────────
  // Restart
  // ───────────────────────────────────────────

  function restartGame() {
    setGame(createGame());

    setError(null);
    setPendingPlay(null);
    setPendingConflict(null);
    setHandoff(false);
  }

  // ───────────────────────────────────────────
  // End Turn
  // ───────────────────────────────────────────

  function endTurn() {
    if (!game) {
      return;
    }

    const result = applyAction(game, {
      type: "end-turn",
    });

    if (!result.ok) {
      setError(
        result.error ?? "Could not end turn."
      );

      return;
    }

    setGame(result.state);

    setError(null);
    setPendingPlay(null);
    setPendingConflict(null);

    // Hot-seat privacy screen before the next player sees
    // their hand.
    setHandoff(true);
  }

  // ───────────────────────────────────────────
  // Card play
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

    setError(null);
    setPendingConflict(null);

    const card = getGameCard(
      handCard.cardId
    );

    // Artifact
    if (card.cardType === "artifact") {
      const validTargets =
        alliedCharacters.filter(
          (unit) =>
            !unit.attachedArtifactId
        );

      if (validTargets.length === 0) {
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

    // Renrose — The Mander's Pact
    if (
      card.id === "renrose-tyrell" &&
      allCharacters.length > 0
    ) {
      setPendingPlay({
        kind: "manders-pact",
        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // Saera — Veiled Sight
    if (
      card.id === "saera-targaryen" &&
      enemyPlayer.hand.length > 0
    ) {
      setPendingPlay({
        kind: "veiled-sight",
        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // Baelenys — Iron Wrath
    if (
      card.id ===
        "baelenys-targaryen" &&
      enemyCharacters.length > 0
    ) {
      setPendingPlay({
        kind: "iron-wrath",
        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // Trial by Combat
    if (
      card.id === "trial-by-combat"
    ) {
      if (
        alliedCharacters.length === 0 ||
        enemyCharacters.length === 0
      ) {
        setError(
          "Trial by Combat requires an allied Character and an enemy Character."
        );

        return;
      }

      setPendingPlay({
        kind: "trial-by-combat",
        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // The Brothers' Tilt
    if (
      card.id === "brothers-tilt"
    ) {
      if (
        alliedCharacters.length === 0
      ) {
        setError(
          "The Brothers' Tilt requires a Character you control."
        );

        return;
      }

      setPendingPlay({
        kind: "brothers-tilt",
        handInstanceId:
          handCard.instanceId,
      });

      return;
    }

    // No target required
    dispatch({
      type: "play-card",
      handInstanceId:
        handCard.instanceId,
    });
  }

  // ───────────────────────────────────────────
  // Board target
  // ───────────────────────────────────────────

  function handleUnitTarget(
    unit: UnitState
  ) {
    if (!game) {
      return;
    }

    // ── Pending card play ──

    if (pendingPlay) {
      switch (pendingPlay.kind) {
        case "artifact": {
          if (
            unit.ownerId !==
            game.activePlayerId
          ) {
            return;
          }

          if (
            getGameCard(unit.cardId)
              .cardType !== "character"
          ) {
            return;
          }

          if (
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
            getGameCard(unit.cardId)
              .cardType !== "character"
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
            game.activePlayerId
          ) {
            return;
          }

          if (
            getGameCard(unit.cardId)
              .cardType !== "character"
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
            game.activePlayerId
          ) {
            return;
          }

          if (
            getGameCard(unit.cardId)
              .cardType !== "character"
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
          // First target = allied Character
          if (
            !pendingPlay
              .firstTargetInstanceId
          ) {
            if (
              unit.ownerId !==
              game.activePlayerId
            ) {
              return;
            }

            if (
              getGameCard(unit.cardId)
                .cardType !== "character"
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

          // Second target = enemy Character
          if (
            unit.ownerId ===
            game.activePlayerId
          ) {
            return;
          }

          if (
            getGameCard(unit.cardId)
              .cardType !== "character"
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

        case "veiled-sight":
          return;
      }
    }

    // ── Pending Military target ──

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
        type: "military-attack",

        attackerInstanceId:
          pendingConflict
            .attackerInstanceId,

        targetUnitInstanceId:
          unit.instanceId,
      });

      return;
    }

    // ── Pending Political defender ──

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
        type: "political-attack",

        attackerInstanceId:
          pendingConflict
            .attackerInstanceId,

        defenderInstanceId:
          unit.instanceId,
      });
    }
  }

  // ───────────────────────────────────────────
  // Veiled Sight
  // ───────────────────────────────────────────

  function targetEnemyHandCard(
    handCard: HandCardState
  ) {
    if (
      pendingPlay?.kind !==
      "veiled-sight"
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
  // Military
  // ───────────────────────────────────────────

  function beginMilitary(
    unit: UnitState
  ) {
    if (!game) {
      return;
    }

    setError(null);
    setPendingPlay(null);

    const options =
      getMilitaryTargetOptions(
        game,
        unit.instanceId
      );

    if (
      options.unitInstanceIds.length === 0 &&
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

  function attackStanding() {
    if (
      !game ||
      pendingConflict?.kind !==
        "military"
    ) {
      return;
    }

    const enemyId = opponentOf(
      game.activePlayerId
    );

    dispatch({
      type: "military-attack",

      attackerInstanceId:
        pendingConflict
          .attackerInstanceId,

      targetPlayerId: enemyId,
    });
  }

  // ───────────────────────────────────────────
  // Political
  // ───────────────────────────────────────────

  function beginPolitical(
    unit: UnitState
  ) {
    if (!game) {
      return;
    }

    setError(null);
    setPendingPlay(null);

    const defense =
      getPoliticalDefenseOptions(
        game,
        unit.instanceId
      );

    // No ready defender — immediately resolve.
    if (defense.unopposed) {
      dispatch({
        type: "political-attack",

        attackerInstanceId:
          unit.instanceId,
      });

      return;
    }

    if (
      defense.selectionBy === "none"
    ) {
      return;
    }

    setPendingConflict({
      kind: "political",

      attackerInstanceId:
        unit.instanceId,

      legalDefenders:
        defense.defenderInstanceIds,

      selectionBy:
        defense.selectionBy,
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
      game.activePlayerId
    ) {
      return false;
    }

    if (
      unit.exhausted ||
      unit.grounded
    ) {
      return false;
    }

    if (!unit.deployedThisTurn) {
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

    const card = getGameCard(
      unit.cardId
    );

    if (
      card.cardType !== "character"
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

    if (!unit.deployedThisTurn) {
      return true;
    }

    return unitHasTrait(
      game,
      unit,
      "schemer"
    );
  }

  // ───────────────────────────────────────────
  // Target highlighting
  // ───────────────────────────────────────────

  function isUnitTargetable(
    unit: UnitState
  ) {
    if (!game) {
      return false;
    }

    if (pendingPlay) {
      switch (pendingPlay.kind) {
        case "artifact":
          return (
            unit.ownerId ===
              game.activePlayerId &&
            getGameCard(unit.cardId)
              .cardType ===
              "character" &&
            !unit.attachedArtifactId
          );

        case "brothers-tilt":
          return (
            unit.ownerId ===
              game.activePlayerId &&
            getGameCard(unit.cardId)
              .cardType ===
              "character"
          );

        case "manders-pact":
          return (
            getGameCard(unit.cardId)
              .cardType ===
            "character"
          );

        case "iron-wrath":
          return (
            unit.ownerId !==
              game.activePlayerId &&
            getGameCard(unit.cardId)
              .cardType ===
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
              getGameCard(unit.cardId)
                .cardType ===
                "character"
            );
          }

          return (
            unit.ownerId !==
              game.activePlayerId &&
            getGameCard(unit.cardId)
              .cardType ===
              "character"
          );

        case "veiled-sight":
          return false;
      }
    }

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

      return options.unitInstanceIds.includes(
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

  // ───────────────────────────────────────────
  // Prompt
  // ───────────────────────────────────────────

  function getPrompt() {
    if (pendingPlay) {
      switch (pendingPlay.kind) {
        case "artifact":
          return "Choose a Character you control to equip.";

        case "manders-pact":
          return "Choose another Character for The Mander's Pact.";

        case "veiled-sight":
          return "Veiled Sight — choose a card from your opponent's hand.";

        case "iron-wrath":
          return "Choose an enemy Character to suffer Iron Wrath.";

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
      return "Military Conflict — choose an enemy unit or attack Standing.";
    }

    if (
      pendingConflict?.kind ===
      "political"
    ) {
      return pendingConflict.selectionBy ===
        "attacker"
        ? `${playerName(
            game!.activePlayerId
          )} chooses the Political defender.`
        : `${playerName(
            opponentOf(
              game!.activePlayerId
            )
          )} chooses the Political defender.`;
    }

    return null;
  }

  // ───────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────

  if (!game) {
    return (
      <main className={styles.loading}>
        <div
          className={styles.pageBackground}
          aria-hidden
        />

        <span>
          Preparing The Great Game...
        </span>
      </main>
    );
  }

  const prompt = getPrompt();

  const activeLocation =
    game.activeLocation
      ? getGameCard(
          game.activeLocation.cardId
        )
      : null;

  // ───────────────────────────────────────────
  // Winner
  // ───────────────────────────────────────────

  if (game.winner) {
    return (
      <main className={styles.game}>
        <div
          className={styles.pageBackground}
          aria-hidden
        />

        <div className={styles.winner}>
          <span className={styles.eyebrow}>
            The Realm&apos;s Reckoning
          </span>

          <h1>
            {game.winner === "draw"
              ? "The Realm Lies Broken"
              : `${playerName(
                  game.winner
                )} Prevails`}
          </h1>

          <p>
            {game.winner === "draw"
              ? "Neither claimant remains standing."
              : "The opposing claimant has lost all Standing."}
          </p>

          <button
            className={
              styles.primaryButton
            }
            onClick={restartGame}
          >
            Begin Another Game
          </button>
        </div>
      </main>
    );
  }

  // ───────────────────────────────────────────
  // Hot-seat handoff
  // ───────────────────────────────────────────

  if (handoff) {
    return (
      <main
        className={`${styles.game} ${styles.handoffScreen}`}
      >
        <div
          className={styles.pageBackground}
          aria-hidden
        />

        <div
          className={styles.handoffCard}
        >
          <span
            className={styles.eyebrow}
          >
            Turn {game.turnNumber}
          </span>

          <h1>Pass the Realm</h1>

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
              setHandoff(false)
            }
          >
            Begin{" "}
            {playerName(
              game.activePlayerId
            )}
            &apos;s Turn
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.game}>
      <div
        className={styles.pageBackground}
        aria-hidden
      />

      {/* HEADER */}

      <header className={styles.topbar}>
        <div>
          <span
            className={styles.eyebrow}
          >
            The Realm&apos;s Reckoning
          </span>

          <h1
            className={styles.title}
          >
            The Great Game
          </h1>
        </div>

        <div className={styles.turnInfo}>
          <span>
            Turn {game.turnNumber}
          </span>

          <strong>
            {playerName(
              game.activePlayerId
            )}
          </strong>

          <button
            className={
              styles.smallButton
            }
            onClick={restartGame}
          >
            New Game
          </button>
        </div>
      </header>

      {/* LOCATION */}

      <section
        className={styles.locationBar}
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

        {activeLocation
          ?.abilities[0] && (
          <small>
            {
              activeLocation
                .abilities[0].text
            }
          </small>
        )}
      </section>

      {/* ERROR */}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {/* PROMPT */}

      {prompt && (
        <div className={styles.prompt}>
          <span>{prompt}</span>

          <button
            onClick={() => {
              setPendingPlay(null);
              setPendingConflict(null);
              setError(null);
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* OPPONENT HEADER */}

      <PlayerHeader
        playerId={enemyPlayerId!}
        state={game}
        opponent
      />

      {/* VEILED SIGHT */}

      {pendingPlay?.kind ===
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
            Opponent&apos;s Hand
          </div>

          <div className={styles.hand}>
            {enemyPlayer!.hand.map(
              (handCard) => {
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

                    <span
                      className={
                        styles.cardType
                      }
                    >
                      {card.cardType}
                    </span>

                    <strong>
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

                    {card.abilities[0] && (
                      <p
                        className={
                          styles.handAbility
                        }
                      >
                        <b>
                          {
                            card.abilities[0]
                              .name
                          }
                          .
                        </b>{" "}
                        {
                          card.abilities[0]
                            .text
                        }
                      </p>
                    )}
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
        units={enemyPlayer!.board}
        state={game}
        targetable={
          isUnitTargetable
        }
        onUnitClick={
          handleUnitTarget
        }
      />

      {/* DIRECT MILITARY ATTACK */}

      {pendingConflict?.kind ===
        "military" &&
        getMilitaryTargetOptions(
          game,
          pendingConflict
            .attackerInstanceId
        ).canAttackStanding && (
          <div
            className={
              styles.standingTarget
            }
          >
            <button
              onClick={attackStanding}
            >
              <span>⚔</span>
              Attack{" "}
              {playerName(
                enemyPlayerId!
              )}{" "}
              Standing
            </button>
          </div>
        )}

      <div className={styles.battleLine}>
        <span>✦ The Realm ✦</span>
      </div>

      {/* ACTIVE BOARD */}

      <Board
        title="Your Board"
        units={activePlayer!.board}
        state={game}
        targetable={
          isUnitTargetable
        }
        onUnitClick={
          handleUnitTarget
        }
        renderActions={(unit) => (
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
              onClick={(event) => {
                event.stopPropagation();

                beginMilitary(unit);
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
                onClick={(event) => {
                  event.stopPropagation();

                  beginPolitical(unit);
                }}
              >
                Political
              </button>
            )}
          </>
        )}
      />

      {/* ACTIVE PLAYER HEADER */}

      <PlayerHeader
        playerId={activePlayerId!}
        state={game}
      />

      {/* HAND */}

      <section
        className={styles.handSection}
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
              {activePlayer!.hand.length}
              /8 cards
            </small>
          </div>

          <button
            className={
              styles.endTurnButton
            }
            onClick={endTurn}
          >
            End Turn
          </button>
        </div>

        <div className={styles.hand}>
          {activePlayer!.hand.map(
            (handCard) => (
              <HandCard
                key={
                  handCard.instanceId
                }
                handCard={handCard}
                state={game}
                playerId={
                  activePlayerId!
                }
                disabled={Boolean(
                  pendingPlay ||
                    pendingConflict
                )}
                onPlay={() =>
                  beginPlayCard(
                    handCard
                  )
                }
              />
            )
          )}
        </div>
      </section>

      {/* GAME LOG */}

      <section
        className={styles.logSection}
      >
        <div
          className={
            styles.sectionTitle
          }
        >
          Chronicle
        </div>

        <div className={styles.log}>
          {[...game.log]
            .reverse()
            .slice(0, 20)
            .map((entry) => (
              <div
                key={entry.id}
                className={
                  styles.logEntry
                }
              >
                <span>
                  T{entry.turn}
                </span>

                <p>{entry.message}</p>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}

// ─────────────────────────────────────────────
// Player Header
// ─────────────────────────────────────────────

function PlayerHeader({
  playerId,
  state,
  opponent = false,
}: {
  playerId: PlayerId;
  state: GameState;
  opponent?: boolean;
}) {
  const player =
    state.players[playerId];

  return (
    <section
      className={`${styles.playerHeader} ${
        opponent
          ? styles.opponentPlayer
          : ""
      }`}
    >
      <div
        className={
          styles.playerIdentity
        }
      >
        <span>
          {playerName(playerId)}
        </span>

        <strong>
          {player.standing} Standing
        </strong>
      </div>

      <div
        className={
          styles.playerStats
        }
      >
        {!opponent && (
          <span>
            Command{" "}
            <strong>
              {player.command}/
              {player.maxCommand}
            </strong>
          </span>
        )}

        <span>
          Deck{" "}
          <strong>
            {player.deck.length}
          </strong>
        </span>

        <span>
          Hand{" "}
          <strong>
            {player.hand.length}
          </strong>
        </span>

        <span>
          Discard{" "}
          <strong>
            {player.discard.length}
          </strong>
        </span>

        {player.burnedCards.length >
          0 && (
          <span>
            Burned{" "}
            <strong>
              {
                player.burnedCards
                  .length
              }
            </strong>
          </span>
        )}
      </div>
    </section>
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
  renderActions,
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

  renderActions?: (
    unit: UnitState
  ) => ReactNode;
}) {
  return (
    <section
      className={styles.boardSection}
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
            {units.length}/6 unit
            slots
          </small>
        </div>
      </div>

      <div className={styles.board}>
        {units.length === 0 && (
          <div
            className={
              styles.emptyBoard
            }
          >
            No units in play.
          </div>
        )}

        {units.map((unit) => (
          <BoardUnit
            key={unit.instanceId}
            unit={unit}
            state={state}
            targetable={targetable(
              unit
            )}
            onClick={() =>
              onUnitClick(unit)
            }
            actions={renderActions?.(
              unit
            )}
          />
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Board Unit
// ─────────────────────────────────────────────

function BoardUnit({
  unit,
  state,
  targetable,
  onClick,
  actions,
}: {
  unit: UnitState;
  state: GameState;
  targetable: boolean;
  onClick: () => void;
  actions?: ReactNode;
}) {
  const card = getGameCard(
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
    getMaximumHealth(unit);

  return (
    <div
      className={[
        styles.unitCard,
        targetable
          ? styles.targetableUnit
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
      onClick={
        targetable
          ? onClick
          : undefined
      }
    >
      <div
        className={styles.unitTop}
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

      <h3>{card.name}</h3>

      {card.subtitle && (
        <div
          className={
            styles.cardSubtitle
          }
        >
          {card.subtitle}
        </div>
      )}

      <div className={styles.stats}>
        <span title="Power">
          <b>⚔</b> {power}
        </span>

        {card.cardType ===
          "character" && (
          <span title="Influence">
            <b>♛</b> {influence}
          </span>
        )}

        <span title="Health">
          <b>♥</b>{" "}
          {unit.currentHealth}/
          {maxHealth}
        </span>
      </div>

      {card.traits.length > 0 && (
        <div
          className={styles.traits}
        >
          {card.traits.map(
            (trait) => (
              <span key={trait}>
                {trait}
              </span>
            )
          )}
        </div>
      )}

      {card.abilities.map(
        (ability) => (
          <div
            key={ability.id}
            className={
              styles.ability
            }
          >
            <strong>
              {ability.name}
            </strong>

            <p>{ability.text}</p>
          </div>
        )
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
          <span>Exhausted</span>
        )}

        {unit.grounded && (
          <span>Grounded</span>
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
// Hand Card
// ─────────────────────────────────────────────

function HandCard({
  handCard,
  state,
  playerId,
  disabled,
  onPlay,
}: {
  handCard: HandCardState;
  state: GameState;
  playerId: PlayerId;
  disabled: boolean;
  onPlay: () => void;
}) {
  const card = getGameCard(
    handCard.cardId
  );

  const cost = getEffectiveCost(
    state,
    playerId,
    handCard
  );

  const player =
    state.players[playerId];

  const affordable =
    player.command >= cost;

  return (
    <button
      className={[
        styles.handCard,

        !affordable
          ? styles.unaffordableCard
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={
        disabled || !affordable
      }
      onClick={onPlay}
    >
      <span
        className={styles.cost}
      >
        {cost}
      </span>

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
            <b>⚔</b> {card.power}
          </span>

          {card.cardType ===
            "character" && (
            <span>
              <b>♛</b>{" "}
              {card.influence}
            </span>
          )}

          <span>
            <b>♥</b>{" "}
            {card.health}
          </span>
        </div>
      )}

      {card.traits.length > 0 && (
        <div
          className={styles.traits}
        >
          {card.traits.map(
            (trait) => (
              <span key={trait}>
                {trait}
              </span>
            )
          )}
        </div>
      )}

      {card.abilities.map(
        (ability) => (
          <p
            key={ability.id}
            className={
              styles.handAbility
            }
          >
            <b>
              {ability.name}.
            </b>{" "}
            {ability.text}
          </p>
        )
      )}
    </button>
  );
}