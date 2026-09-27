"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { getGameCard, isUnitCard } from "@/lib/the-great-game/cards";
import type { AbilityTrigger, GameCard, TierId, Trait } from "@/lib/the-great-game/types";
import { CardArtwork } from "./CardArtwork";
import styles from "@/app/cards/play/play.module.css";

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

type InnkeeperVoice =
  | "neutral"
  | "courtly"
  | "stoic";

// Change this one constant later when the Alekeeper picker is wired into the UI.
// For now the flattering old courtier is the default voice.
const DEFAULT_INNKEEPER_VOICE: InnkeeperVoice =
  "courtly";

const TRAIT_RULES_BY_VOICE: Record<
  InnkeeperVoice,
  Partial<Record<Trait, string>>
> = {
  neutral: {
    dragonrider:
      "This Character is bonded to a specific Dragon. That Dragon's Bond discount applies while its rider is ruled by the same Ruler.",
    guard:
      "Enemy Units must face Ready Guard Units before attacking other legal Military targets or Standing.",
    intrigue:
      "While this Character is Ready, normal Political attackers must choose a Ready Intrigue Character as the defender.",
    swift:
      "This Unit may initiate a Military Conflict on the turn it is deployed.",
    schemer:
      "This Character may initiate a Political Conflict on the turn it is deployed.",
    challenge:
      "This Unit may ignore Guard when choosing a Military target.",
    confront:
      "This Character may ignore Intrigue priority and choose any Ready enemy Character as the Political defender.",
  },
  courtly: {
    dragonrider:
      "A rare bond, my liege. Keep rider and Dragon beneath the same Ruler, and the Dragon's Bond discount is honored.",
    guard:
      "Your faithful shield, my liege. A Ready Guard must be faced before lesser Military targets—or your Standing—may be attacked.",
    intrigue:
      "A watchful courtier, my liege. While Ready, Intrigue compels ordinary Political attackers to answer this Character first.",
    swift:
      "No need to keep them waiting, my liege. Swift Units may begin a Military Conflict the very turn they are deployed.",
    schemer:
      "Already whispering before the chair is warm, my liege. A Schemer may begin a Political Conflict on the turn it is deployed.",
    challenge:
      "A bold soul, my liege. Challenge permits this Unit to ignore Guard when choosing a Military target.",
    confront:
      "Direct and most useful, my liege. Confront lets this Character ignore Intrigue priority and choose any Ready enemy Character to defend.",
  },
  stoic: {
    dragonrider:
      "Rider and Dragon share a bond. Same Ruler, Bond discount applies. Simple.",
    guard:
      "Ready Guard stands in the way. Deal with it before other Military targets or Standing.",
    intrigue:
      "Ready Intrigue controls the Political defense. Ordinary schemes answer to it first.",
    swift:
      "Swift fights immediately. Deployment sickness does not stop its Military Conflict.",
    schemer:
      "Schemer plots immediately. It may start a Political Conflict on deployment turn.",
    challenge:
      "Challenge ignores Guard when choosing a Military target.",
    confront:
      "Confront ignores Intrigue priority. Pick any Ready enemy Character to defend.",
  },
};

const UNIQUE_RULES: Record<InnkeeperVoice, string> = {
  neutral:
    "Unique — A Ruler cannot play another copy of this card while one is already in play under that Ruler.",
  courtly:
    "Unique, my liege. One such presence is distinction enough; a Ruler cannot play another copy while one already stands beneath their rule.",
  stoic:
    "Unique. One copy per Ruler in play. Another cannot be played until it leaves.",
};

function traitRule(trait: Trait): string | undefined {
  return TRAIT_RULES_BY_VOICE[DEFAULT_INNKEEPER_VOICE][trait];
}

function uniqueRule(): string {
  return UNIQUE_RULES[DEFAULT_INNKEEPER_VOICE];
}

export function tierStyle(
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

export function CommandSigil({
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
          y="21.6"
          textAnchor="middle"
          dominantBaseline="central"
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

function UniqueDiamond({
  detailed = false,
}: {
  detailed?: boolean;
}) {
  const triggerRef =
    useRef<HTMLSpanElement | null>(
      null
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    position,
    setPosition,
  ] = useState<{
    left: number;
    top: number;
  } | null>(null);

  const timerRef =
    useRef<
      ReturnType<typeof setTimeout> |
      null
    >(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(
        timerRef.current
      );

      timerRef.current =
        null;
    }
  };

  const updatePosition = () => {
    const element =
      triggerRef.current;

    if (!element) {
      return;
    }

    const rect =
      element.getBoundingClientRect();

    setPosition({
      left:
        Math.max(8, Math.min(rect.right + 8, window.innerWidth - 226)),
      top:
        Math.max(8, Math.min(rect.top, window.innerHeight - 90)),
    });
  };

  const openAfterDelay = () => {
    clearTimer();
    updatePosition();

    timerRef.current =
      setTimeout(
        () => {
          updatePosition();
          setOpen(true);
        },
        detailed
          ? 320
          : 560
      );
  };

  const closeTooltip = () => {
    clearTimer();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleViewportChange =
      () => updatePosition();

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true
    );

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );

      window.removeEventListener(
        "resize",
        handleViewportChange
      );
    };
  }, [open]);

  useEffect(
    () => () => clearTimer(),
    []
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={
          styles.uniqueMark
        }
        aria-label="Unique"
        tabIndex={0}
        onMouseEnter={
          openAfterDelay
        }
        onMouseLeave={
          closeTooltip
        }
        onFocus={
          openAfterDelay
        }
        onBlur={
          closeTooltip
        }
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => { event.stopPropagation(); clearTimer(); updatePosition(); setOpen(value => !value); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            updatePosition();
            setOpen(value => !value);
          }
        }}
      >
        ◆
      </span>

      {open &&
        position &&
        typeof document !==
          "undefined" &&
        createPortal(
          <span
            className={[
              styles.uniqueTooltipPortal,
              detailed
                ? styles.uniqueTooltipDetailed
                : styles.uniqueTooltipCompact,
            ]
              .filter(Boolean)
              .join(" ")}
            role="tooltip"
            style={{
              left:
                position.left,
              top:
                position.top,
            }}
          >
            {detailed
              ? uniqueRule()
              : "Unique"}
          </span>,
          document.body
        )}
    </>
  );
}

function CommandGem({ tierId, value }: { tierId: TierId; value: number }) {
  const src = `/images/cards/command-gems/${tierId}`;
  return (
    <span className={styles.commandGem} aria-hidden="true">
      <Image src={`${src}.png`} alt="" fill sizes="96px" className={styles.commandGemNormal} draggable={false} />
      <Image src={`${src}-highlighted.png`} alt="" fill sizes="96px" className={styles.commandGemHighlighted} draggable={false} />
      <svg viewBox="0 0 100 100" className={styles.commandGemNumber}>
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className={styles.commandCostText}>{value}</text>
      </svg>
    </span>
  );
}

export function CardChrome({
  card,
  cost,
  detailed = false,
  board = false,
}: {
  card: GameCard;
  cost?: number;
  detailed?: boolean;
  board?: boolean;
}) {
  const command = cost ?? card.cost;
  return (
    <>
        <TraitRuleTooltip
          triggerClassName={[
            styles.cost,
            styles.commandGemBadge,
            board ? styles.commandGemBoard : "",
            command > card.cost
              ? styles.costIncreased
              : "",
            command < card.cost
              ? styles.costReduced
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          label={`${tierLabel(card)} Tier`}
          rule={command === card.cost ? `${command} Command` : `${command} Command (base ${card.cost})`}
          icon={<CommandGem tierId={card.tierId} value={command} />}
        />

      {card.traits.includes(
        "unique"
      ) && (
        <UniqueDiamond
          detailed={
            detailed
          }
        />
      )}
    </>
  );
}

function StatIcon({ kind }: { kind: "military" | "political" | "health" }) {
  if (kind !== "health") {
    return <i className={styles.statGlyph} data-stat-icon={kind} aria-hidden="true">{kind === "military" ? "⚔\uFE0E" : "♛\uFE0E"}</i>;
  }
  const paths = {
    health: "M10 17 3 10C-2 4 6 0 10 6C14 0 22 4 17 10Z",
  };
  return <svg viewBox="0 0 20 20" width="100%" height="100%" fill="currentColor" data-stat-icon="health" aria-hidden="true"><path d={paths.health} /></svg>;
}

export function IndicatorIcon({ kind }: { kind: "military" | "political" | "health" }) {
  return <i className={styles.indicatorIcon}><StatIcon kind={kind} /></i>;
}

function TraitIcon({ trait, active = false }: { trait: Trait; active?: boolean }) {
  const paths: Record<Trait, string> = {
    unique: "M10 2 18 10 10 18 2 10Z",
    dragon: "M3 15 6 6 10 10 15 3 17 12 12 10 9 16Z",
    dragonrider: "M2 16Q8 19 11 13L10 10 5 12 7 4 12 8 14 5 14 2 16 4 18 5 17 8 14 9Q17 16 10 17M7 4 8 10M14 12 17 14",
    guard: "M10 2 17 5 16 12 10 18 4 12 3 5Z",
    intrigue: "M2 10Q10 1 18 10Q10 19 2 10ZM7 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
    swift: "M12 2 4 11 10 11 8 18 16 8 10 8Z",
    schemer: "M3 16 13 3 17 3 17 7 7 17 3 17ZM7 13 11 13M3 19H17",
    challenge: "M4 3 15 14M3 13 7 17M13 3 4 14M13 17 17 13",
    confront: "M3 4 8 10 3 16M17 4 12 10 17 16M8 10H12",
  };
  return <svg className={active ? styles.traitIconActive : undefined} data-trait-active={active || undefined} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d={paths[trait]} /></svg>;
}

function TraitRuleTooltip({
  label,
  rule,
  icon,
  triggerClassName,
}: {
  label: string;
  rule: string;
  icon?: ReactNode;
  triggerClassName?: string;
}) {
  const triggerRef =
    useRef<HTMLSpanElement | null>(
      null
    );

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    position,
    setPosition,
  ] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const updatePosition = () => {
    const element =
      triggerRef.current;

    if (!element) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const unitId = element.closest('[data-unit-instance-id]')?.getAttribute('data-unit-instance-id');
    const effects = unitId ? Array.from(document.querySelectorAll<HTMLElement>('[data-effects-for]')).find(node => node.dataset.effectsFor === unitId) : null;
    const effectRect = effects?.getBoundingClientRect();
    const next = effectRect
      ? { left: effectRect.left, top: effectRect.bottom + 6, width: effectRect.width }
      : { left: Math.max(8, Math.min(rect.right + 8, window.innerWidth - 226)), top: Math.max(8, Math.min(rect.top, window.innerHeight - 90)), width: 218 };
    setPosition(previous => previous?.left === next.left && previous?.top === next.top && previous?.width === next.width ? previous : next);
  };

  useEffect(() => {
    if (!open) { setPosition(null); return; }
    // Measure after the card's effects portal mounts, and follow its live size.
    let frame: number;
    const measure = () => { updatePosition(); frame = requestAnimationFrame(measure); };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <>
      <span
        ref={triggerRef}
        className={
          [styles.traitTooltipTrigger, triggerClassName].filter(Boolean).join(" ")
        }
        data-tooltip-open={open || undefined}
        tabIndex={0}
        aria-label={label}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => { event.stopPropagation(); setOpen(true); }}
        onMouseEnter={() => {
          setOpen(true);
        }}
        onMouseLeave={() => {
          if (document.activeElement !== triggerRef.current) setOpen(false);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() =>
          setOpen(false)
        }
      >
        {icon ?? label}
      </span>

      {open &&
        position &&
        typeof document !==
          "undefined" &&
        createPortal(
          <span
            className={
              styles.traitTooltipPortal
            }
            role="tooltip"
            style={{
              left:
                position.left,
              top:
                position.top,
              width: position.width,
            }}
          >
            <strong>{label}</strong>
            {rule}
          </span>,
          document.body
        )}
    </>
  );
}

function EquippedArtifactBadge({
  artifactId,
  detailed = false,
}: {
  artifactId: string;
  detailed?: boolean;
}) {
  const artifact =
    getGameCard(
      artifactId
    );

  return (
    <span
      aria-label={artifact.name}
      className={[
        styles.equippedArtifactBadge,
        detailed
          ? styles.equippedArtifactBadgeDetailed
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardArtwork card={artifact} className={styles.equippedArtifactArtwork} />
    </span>
  );
}

export function CardInfoPanel({
  card,
  activeTraits = [],
  artifactId,
  artifactBadgeDetailed = false,
  runtimeStats,
  baseStats,
  actions,
  footer,
  showDescription = true,
  showTraitTooltips = false,
  compact = false,
}: {
  card: GameCard;
  activeTraits?: Trait[];
  artifactId?: string | null;
  artifactBadgeDetailed?: boolean;
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
  showTraitTooltips?: boolean;
  compact?: boolean;
}) {
  const traits =
    visibleTraits(
      card
    );
  // Equipment traits last only as long as the artifact is attached.
  if (artifactId === "dark-sister" && !traits.includes("challenge")) {
    traits.push("challenge");
  }

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
        compact ? styles.cardInfoCompact : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`${styles.cardMetadata} ${artifactId ? styles.cardMetadataWithArtifact : ""}`}>
      <div
        className={
          styles.cardIdentity
        }
      >
        <div className={styles.cardTypeRow}>
          <span className={styles.cardType}>{card.cardType}</span>
          {traits.length > 0 && <div className={styles.traitIcons}>
            {traits.map(trait => {
              const label = trait[0].toUpperCase() + trait.slice(1);
              return <TraitRuleTooltip key={trait} label={label} rule={traitRule(trait) ?? label} icon={<TraitIcon trait={trait} active={activeTraits.includes(trait)} />} />;
            })}
          </div>}


        </div>

        <strong>
          {card.name}
        </strong>

        {!compact && <small
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
        </small>}
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
              <StatIcon kind="military" />
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
              <StatIcon kind="political" />
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
              <StatIcon kind="health" />
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


          {artifactId && (
            <EquippedArtifactBadge
              artifactId={artifactId}
              detailed={artifactBadgeDetailed}
            />
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

