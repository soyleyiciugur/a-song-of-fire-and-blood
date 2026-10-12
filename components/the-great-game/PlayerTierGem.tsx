"use client";

import Image from "next/image";
import type { TierId } from "@/lib/the-great-game/types";
import styles from "./PlayerTierGem.module.css";
import { playerTierForRating } from "@/lib/the-great-game/rank-progression";
export { playerTierForRating, playerTierLabel } from "@/lib/the-great-game/rank-progression";

const TIER_LABELS: Record<TierId, string> = {
  "s-plus": "S+",
  s: "S",
  a: "A",
  b: "B",
  c: "C",
};

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
      <Image src={`${src}.webp`} alt="" unoptimized fill sizes="72px" draggable={false} data-gem-normal />
      <Image src={`${src}-highlighted.webp`} alt="" unoptimized fill sizes="72px" draggable={false} data-gem-highlighted />
    </span>
  );
}
