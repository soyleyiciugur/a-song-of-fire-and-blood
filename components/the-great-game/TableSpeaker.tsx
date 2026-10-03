"use client";

import { useEffect, useState, type ReactNode } from "react";
import { pickTableSpeaker, type TableSpeakerId } from "@/lib/the-great-game/table-speaker";
import MiniPortrait from "@/components/MiniPortrait";
import styles from "./TableSpeaker.module.css";

export default function TableSpeaker({ children }: { children?: (speaker: "mara" | "aldren") => ReactNode }) {
  const [speaker, setSpeaker] = useState<TableSpeakerId | null>(null);
  useEffect(() => {
    // Cancel abandoned mounts and Strict Mode's trial effect before consuming pity.
    const timer = setTimeout(() => setSpeaker(pickTableSpeaker()), 0);
    return () => clearTimeout(timer);
  }, []);
  if (!speaker) return null;
  const name = speaker === "mara" ? "Mara" : "Aldren";
  return (
    <>
      <div className={styles.frame} data-table-speaker={speaker} title={name}>
        <MiniPortrait
          id={speaker === "mara" ? "mara-tapster" : "aldren-innkeeper"}
          alt={name}
          size={28}
        />
      </div>
      {children?.(speaker)}
    </>
  );
}
