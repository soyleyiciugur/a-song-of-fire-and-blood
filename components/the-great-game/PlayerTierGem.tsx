"use client";

import Image from "next/image";
import type { TierId } from "@/lib/the-great-game/types";
import styles from "./PlayerTierGem.module.css";

const TIER_LABELS: Record<TierId, string> = {
  "s-plus": "S+",
  s: "S",
  a: "A",
  b: "B",
  c: "C",
};

export function playerTierForRating(rating: number): TierId {
  if (rating >= 1500) return "s-plus";
  if (rating >= 1350) return "s";
  if (rating >= 1200) return "a";
  if (rating >= 1100) return "b";
  return "c";
}

export function playerTierLabel(rating: number) {
  return TIER_LABELS[playerTierForRating(rating)];
}

export default function PlayerTierGem({
  rating,
  size = "medium",
  className = "",
}: {
  rating: number;
  size?: "small" | "medium" | "large";
  className?: string;
}) {
  const tier = playerTierForRating(rating);
  const label = TIER_LABELS[tier];
  const src = `/images/cards/command-gems/${tier}`;

  return (
    <span
      className={`${styles.gem} ${styles[size]} ${className}`}
      data-player-tier-gem
      data-tier={tier}
      title={`${label} Tier · ${rating} rating`}
      aria-label={`${label} Tier, ${rating} rating`}
    >
      <Image src={`${src}.png`} alt="" fill sizes="72px" draggable={false} data-gem-normal />
      <Image src={`${src}-highlighted.png`} alt="" fill sizes="72px" draggable={false} data-gem-highlighted />
    </span>
  );
}
