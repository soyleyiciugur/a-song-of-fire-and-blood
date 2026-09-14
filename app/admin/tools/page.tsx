"use client";

import { useEffect, useState } from "react";
import { SearchableSelect } from "../_components/SearchableSelect";
import { NumberStepper } from "../_components/NumberStepper";
import worldDateDefault from "@/data/worldDate.json";
import { getDraft, setDraft } from "@/lib/adminDrafts";

type WorldDate = typeof worldDateDefault;
const ERA_OPTIONS = [{ id: "AC", name: "AC" }, { id: "BC", name: "BC" }];
const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export default function AdminToolsPage() {
  const [date, setDate] = useState<WorldDate>(worldDateDefault);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const draft = getDraft<WorldDate>("worldDate");
      if (draft) setDate(draft);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const changeDate = (field: keyof WorldDate, value: number | string) => {
    const next = { ...date, [field]: value };
    setDate(next);
    setDraft("worldDate", next);
  };

  return (
    <main style={{ display: "grid", gap: 24, padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <header>
        <h1 style={{ margin: 0 }}>Tools</h1>
        <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: ".9rem" }}>Admin-only world state controls. Player-facing utilities now live in The Workbench.</p>
      </header>
      <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 24, boxShadow: "var(--shadow-card)" }}>
        <h2 style={{ marginTop: 0, color: "var(--gold)" }}>World Date</h2>
        <p style={{ opacity: .7, marginTop: -8, marginBottom: 20 }}>The in-world date shown across the site. Changes remain a draft until published from the admin bar.</p>
        <p style={{ fontSize: "1.3rem", marginBottom: 20 }}>{ordinal(date.day)} day of the {ordinal(date.moon)} moon, {date.year} {date.era}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 16 }}>
          <NumberStepper label="Day" min={1} max={30} value={date.day} onChange={(value) => changeDate("day", value)} />
          <NumberStepper label="Moon" min={1} max={12} value={date.moon} onChange={(value) => changeDate("moon", value)} />
          <NumberStepper label="Year" min={0} value={date.year} onChange={(value) => changeDate("year", value)} />
          <SearchableSelect label="Era" value={date.era} options={ERA_OPTIONS} onChange={(value: string) => changeDate("era", value)} searchable={false} />
        </div>
      </section>
    </main>
  );
}
