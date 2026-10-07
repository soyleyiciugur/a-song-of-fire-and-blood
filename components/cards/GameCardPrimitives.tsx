"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { getGameCard, isUnitCard } from "@/lib/the-great-game/cards";
import type { AbilityTrigger, GameCard, TierId, Trait } from "@/lib/the-great-game/types";
import { CardArtwork } from "./CardArtwork";
import styles from "@/app/cards/play/play.module.css";
import { pickTableSpeaker } from "@/lib/the-great-game/table-speaker";
import { useSupporter } from "@/components/the-great-game/SupporterContext";

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
    summon: "Created by an ability. Summons cannot be included in a deck.",
    dragonrider:
      "This Character is bonded to a specific Dragon. That Dragon's Bond discount applies while its rider is ruled by the same Ruler.",
    guard:
      "Enemy Units must face Guard Units before attacking other legal Military targets or Standing.",
    intrigue:
      "While this Character is Ready, normal Political attackers must choose a Ready Intrigue Character as the defender.",
    swift:
      "This Unit may initiate a Military Conflict on the turn it is deployed.",
    schemer:
      "This Character may initiate a Political Conflict on the turn it is deployed.",
    challenge:
      "This Unit ignores Guard restrictions and may choose any Military target or attack enemy Standing directly.",
    confront:
      "This Character ignores Political defender restrictions and may choose any Ready enemy Character or attack enemy Standing directly.",
  },
  courtly: {
    summon: "A Summon at your service, my liege. Summons are created by abilities and never included in your deck.",
    dragonrider:
      "A rare bond, my liege. Keep rider and Dragon beneath the same Ruler, and the Dragon's Bond discount is honored.",
    guard:
      "Your faithful shield, my liege. A Guard must be faced before lesser Military targets—or your Standing—may be attacked.",
    intrigue:
      "A watchful courtier, my liege. While Ready, Intrigue compels ordinary Political attackers to answer this Character first.",
    swift:
      "No need to keep them waiting, my liege. Swift Units may begin a Military Conflict the very turn they are deployed.",
    schemer:
      "Already whispering before the chair is warm, my liege. A Schemer may begin a Political Conflict on the turn it is deployed.",
    challenge:
      "A bold soul, my liege. Challenge ignores Guard entirely: this Unit may choose any Military target or strike enemy Standing directly.",
    confront:
      "Direct and most useful, my liege. Confront ignores Political defender restrictions: choose any Ready enemy Character or strike enemy Standing directly.",
  },
  stoic: {
    summon: "An ability brought this Summon to the table. Summons do not go in your deck.",
    dragonrider:
      "Rider and Dragon share a bond. Same Ruler, Bond discount applies. Simple.",
    guard:
      "Guard stands in the way. Deal with it before other Military targets or Standing.",
    intrigue:
      "Ready Intrigue controls the Political defense. Ordinary schemes answer to it first.",
    swift:
      "Swift fights immediately. Deployment sickness does not stop its Military Conflict.",
    schemer:
      "Schemer plots immediately. It may start a Political Conflict on deployment turn.",
    challenge:
      "Challenge ignores Guard entirely. Choose any Military target or attack Standing directly.",
    confront:
      "Confront ignores Political defender restrictions. Pick any Ready enemy Character or attack Standing directly.",
  },
};

const UNIQUE_RULES: Record<InnkeeperVoice, string> = {
  neutral:
    "Unique — Your deck may contain only one copy of this card.",
  courtly:
    "Unique, my liege. Your deck may contain only one copy of this card. One such presence is distinction enough.",
  stoic:
    "Unique. One copy of this card per deck. One is enough.",
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
  const supporter = useSupporter();
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
              ? supporter ? UNIQUE_RULES[supporter === "mara" ? "stoic" : "courtly"] : uniqueRule()
              : "Unique"}
          </span>,
          document.querySelector("dialog[open]") ?? document.body
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
      <span className={styles.commandGemInterior}>
        <Image src={`${src}.png`} alt="" fill sizes="96px" className={styles.commandGemNormal} draggable={false} />
        <Image src={`${src}-highlighted.png`} alt="" fill sizes="96px" className={styles.commandGemHighlighted} draggable={false} />
      </span>
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

export function StatIcon({ kind }: { kind: "military" | "political" | "health" }) {
  if (kind === "political") {
    // Original crown silhouette, with every interior cutout removed.
    return <svg viewBox="0 0 20 20" width="100%" height="100%" fill="currentColor" data-stat-icon="political" aria-hidden="true"><path d="M8.7695 3.7891Q8.7695 3.4863 8.877 3.2568Q8.9844 3.0273 9.1553 2.8711Q9.3262 2.7148 9.541 2.6367Q9.7559 2.5586 9.9805 2.5586Q10.2051 2.5586 10.4297 2.6367Q10.6543 2.7148 10.8301 2.8662Q11.0059 3.0176 11.1182 3.252Q11.2305 3.4863 11.2305 3.7891Q11.2305 4.2773 10.9863 4.5605Q10.7422 4.8438 10.4004 4.9512L11.5137 9.873L13.0566 5.5762Q12.6855 5.459 12.4609 5.1514Q12.2363 4.8438 12.2363 4.4336Q12.2363 4.1309 12.3486 3.8965Q12.4609 3.6621 12.6416 3.5059Q12.8223 3.3496 13.042 3.2715Q13.2617 3.1934 13.4863 3.1934Q13.7109 3.1934 13.9355 3.2715Q14.1602 3.3496 14.3359 3.5059Q14.5117 3.6621 14.6191 3.8965Q14.7266 4.1309 14.7266 4.4336Q14.7266 4.6484 14.6533 4.8535Q14.5801 5.0586 14.4434 5.2197Q14.3066 5.3809 14.1113 5.4932Q13.916 5.6055 13.6719 5.6348L14.082 10.0586L16.1426 6.9043Q15.8594 6.748 15.6934 6.46Q15.5273 6.1719 15.5273 5.8203Q15.5273 5.5176 15.6396 5.2881Q15.752 5.0586 15.9277 4.9023Q16.1035 4.7461 16.3281 4.668Q16.5527 4.5898 16.7773 4.5898Q17.002 4.5898 17.2217 4.668Q17.4414 4.7461 17.6123 4.9023Q17.7832 5.0586 17.8906 5.2881Q17.998 5.5176 17.998 5.8203Q17.998 6.0547 17.915 6.2744Q17.832 6.4941 17.6758 6.665Q17.5195 6.8359 17.2949 6.9336Q17.0703 7.0313 16.7871 7.0313L16.6211 7.0313L15.8105 12.3633L15.8105 17.0605Q14.3945 17.2559 12.8857 17.3486Q11.377 17.4414 9.9805 17.4414Q8.5449 17.4414 7.0605 17.3486Q5.5762 17.2559 4.1699 17.0605L4.1699 12.3633L3.3789 7.0313L3.2129 7.0313Q2.9297 7.0313 2.7051 6.9336Q2.4805 6.8359 2.3242 6.665Q2.168 6.4941 2.085 6.2744Q2.002 6.0547 2.002 5.8203Q2.002 5.5176 2.1094 5.2881Q2.2168 5.0586 2.3877 4.9023Q2.5586 4.7461 2.7783 4.668Q2.998 4.5898 3.2227 4.5898Q3.4473 4.5898 3.6719 4.668Q3.8965 4.7461 4.0723 4.9023Q4.248 5.0586 4.3604 5.2881Q4.4727 5.5176 4.4727 5.8203Q4.4727 6.1719 4.3066 6.46Q4.1406 6.748 3.8574 6.9043L5.918 10.0586L6.3281 5.6348Q6.084 5.6055 5.8887 5.4932Q5.6934 5.3809 5.5566 5.2197Q5.4199 5.0586 5.3467 4.8535Q5.2734 4.6484 5.2734 4.4336Q5.2734 4.1309 5.3809 3.8965Q5.4883 3.6621 5.6641 3.5059Q5.8398 3.3496 6.0645 3.2715Q6.2891 3.1934 6.5137 3.1934Q6.7285 3.1934 6.9531 3.2715Q7.1777 3.3496 7.3584 3.5059Q7.5391 3.6621 7.6514 3.8965Q7.7637 4.1309 7.7637 4.4336Q7.7637 4.8438 7.5391 5.1514Q7.3145 5.459 6.9434 5.5762L8.4863 9.873L9.5996 4.9512Q9.2578 4.8438 9.0137 4.5605Q8.7695 4.2773 8.7695 3.7891Z" /></svg>;
  }
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
  const withGlow = (artwork: ReactNode) => active ? (
    <span className={styles.traitIconActive} data-trait-active="true" aria-hidden="true">
      <span className={styles.traitIconGlow}>{artwork}</span>
      {artwork}
    </span>
  ) : artwork;
  if (trait !== "unique" && trait !== "dragon") {
    return withGlow(<Image
      className={styles.traitIconArtwork}
      src={`/images/cards/keywords/${trait}.png`}
      width={64}
      height={64}
      sizes="32px"
      alt=""
      aria-hidden="true"
    />);
  }
  const paths: Record<Trait, string> = {
    summon: "M10 2 18 7v8l-8 4-8-4V7ZM10 6v8M6 10h8",
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
  return withGlow(<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d={paths[trait]} /></svg>);
}

const STATUS_RULES: Record<"Deployed" | "Exhausted" | "Grounded", [string, string]> = {
  Deployed: [
    "Just arrived this turn. No Military Conflict without Swift; no Political Conflict without Schemer. Give them a moment.",
    "Newly arrived, my liege. This turn, initiating a Military Conflict requires Swift, and a Political Conflict requires Schemer.",
  ],
  Exhausted: [
    "Spent for now. Cannot initiate another Conflict until readied. All Units ready when the turn ends.",
    "Their efforts are spent, Your Grace. They cannot initiate a Conflict until readied. All Units ready when the turn ends.",
  ],
  Grounded: [
    "The Dragon is down. Cannot initiate a Conflict. Recovers one Health at the start of its controller's turn; Grounded clears at half maximum Health, rounded up.",
    "Your Dragon must recover, my liege. It cannot initiate a Conflict while Grounded. It regains one Health at the start of its controller's turn, recovering at half maximum Health, rounded up.",
  ],
};

function TraitRuleTooltip({
  label,
  rule,
  icon,
  triggerClassName,
  statusRules,
}: {
  label: string;
  rule: string;
  icon?: ReactNode;
  triggerClassName?: string;
  statusRules?: [string, string];
}) {
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const [statusRule, setStatusRule] = useState(rule);
  const supporter = useSupporter();
  const openTooltip = () => {
    if (!open && statusRules) setStatusRule(statusRules[(supporter ?? pickTableSpeaker()) === "mara" ? 0 : 1]);
    setOpen(true);
  };
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
      ? { left: effectRect.left, top: statusRules ? Math.max(8, effectRect.top - (tooltipRef.current?.getBoundingClientRect().height ?? 90) - 6) : effectRect.bottom + 6, width: effectRect.width }
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
        onClick={event => { event.stopPropagation(); openTooltip(); }}
        onMouseEnter={() => {
          openTooltip();
        }}
        onMouseLeave={() => {
          if (document.activeElement !== triggerRef.current) setOpen(false);
        }}
        onFocus={() => {
          openTooltip();
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
            ref={tooltipRef}
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
            {statusRules ? statusRule : supporter ? TRAIT_RULES_BY_VOICE[supporter === "mara" ? "stoic" : "courtly"][label.toLowerCase() as Trait] ?? rule : rule}
          </span>,
          document.querySelector("dialog[open]") ?? document.body
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
  artifactBadgeAbovePanel = false,
  showArtifactBadge = true,
  runtimeStats,
  baseStats,
  actions,
  footer,
  showDescription = true,
  showTraitTooltips = false,
  compact = false,
  statuses = [],
  statusBadge,
}: {
  card: GameCard;
  activeTraits?: Trait[];
  artifactId?: string | null;
  artifactBadgeDetailed?: boolean;
  artifactBadgeAbovePanel?: boolean;
  showArtifactBadge?: boolean;
  runtimeStats?: {
    strength: number;
    influence: number;
    health: number;
    maxHealth: number;
  };
  baseStats?: {
    strength: number;
    influence?: number;
    health: number;
  };
  actions?: ReactNode;
  footer?: ReactNode;
  showDescription?: boolean;
  showTraitTooltips?: boolean;
  compact?: boolean;
  statuses?: Array<"Deployed" | "Exhausted" | "Grounded">;
  statusBadge?: ReactNode;
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
      {artifactId && showArtifactBadge && artifactBadgeAbovePanel && (
        <EquippedArtifactBadge
          artifactId={artifactId}
          detailed={artifactBadgeDetailed}
        />
      )}

      {(statuses.length > 0 || statusBadge) && (
        <div className={styles.statusOverlay}>
          {statusBadge}
          {statuses.map(status => (
            <TraitRuleTooltip key={status} label={status} rule={STATUS_RULES[status][0]} statusRules={STATUS_RULES[status]} />
          ))}
        </div>
      )}

      <div className={`${styles.cardMetadata} ${artifactId && showArtifactBadge ? styles.cardMetadataWithArtifact : ""}`}>
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
                runtimeStats?.strength ?? card.strength,
                baseStats?.strength
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
                ?.strength ??
                card.strength}
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


          {artifactId && showArtifactBadge && !artifactBadgeAbovePanel && (
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
