"use client";

import { useState, type ReactNode } from "react";
import styles from "./characterProfileTabs.module.css";

type TabId = "overview" | "appearances" | "quotes" | "chronology";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "appearances", label: "Character Appearances" },
  { id: "quotes", label: "Notable Quotes" },
  { id: "chronology", label: "Personal Chronology" },
];

export default function CharacterProfileTabs({
  overview,
  appearances,
  quotes,
  chronology,
}: {
  overview: ReactNode;
  appearances: ReactNode;
  quotes: ReactNode;
  chronology: ReactNode;
}) {
  const [active, setActive] = useState<TabId>("overview");
  const panels: Record<TabId, ReactNode> = { overview, appearances, quotes, chronology };

  return (
    <div className={styles.root}>
      <nav className={styles.tabs} aria-label="Character profile sections" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`character-tab-${tab.id}`}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`character-panel-${tab.id}`}
            className={active === tab.id ? styles.active : undefined}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div key={active} id={`character-panel-${active}`} className={styles.panel} role="tabpanel" aria-labelledby={`character-tab-${active}`}>
        {panels[active]}
      </div>
    </div>
  );
}
