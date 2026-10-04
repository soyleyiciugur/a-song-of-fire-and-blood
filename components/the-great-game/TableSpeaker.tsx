"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pickTableSpeaker, type TableSpeakerId } from "@/lib/the-great-game/table-speaker";
import MiniPortrait from "@/components/MiniPortrait";
import styles from "./TableSpeaker.module.css";
import { useSupporter } from "./SupporterContext";

export default function TableSpeaker({ children, speaker: explicitSpeaker, size = 28 }: { children?: (speaker: "mara" | "aldren") => ReactNode; speaker?: TableSpeakerId; size?: number }) {
  const assigned = useSupporter();
  const [randomSpeaker, setSpeaker] = useState<TableSpeakerId | null>(null);
  const speaker = explicitSpeaker ?? assigned ?? randomSpeaker;
  useEffect(() => {
    if (explicitSpeaker || assigned) return;
    // Cancel abandoned mounts and Strict Mode's trial effect before consuming pity.
    const timer = setTimeout(() => setSpeaker(pickTableSpeaker()), 0);
    return () => clearTimeout(timer);
  }, [explicitSpeaker, assigned]);
  if (!speaker) return null;
  const name = speaker === "mara" ? "Mara" : "Aldren";
  return (
    <>
      <div className={styles.frame} data-table-speaker={speaker} title={name}>
        <MiniPortrait
          id={speaker === "mara" ? "mara-tapster" : "aldren-innkeeper"}
          alt={name}
          size={size}
        />
      </div>
      {children?.(speaker)}
    </>
  );
}
