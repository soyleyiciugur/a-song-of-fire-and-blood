"use client";

import { useState, useEffect } from "react";
import { SearchableSelect } from "../_components/SearchableSelect";
import { NumberStepper } from "../_components/NumberStepper";
import { MAP_LOCATION_NAMES } from "@/data/map/locations";
import { calculateTravel, TravelResult } from "@/lib/travel";
import worldDateDefault from "@/data/worldDate.json";
import { getDraft, setDraft } from "@/lib/adminDrafts";
import { NAME_CULTURES } from "@/data/nameGenerator";
import { generateName, GeneratedName } from "@/lib/nameGenerator";

type WorldDate = typeof worldDateDefault;

const LOCATION_OPTIONS = MAP_LOCATION_NAMES.map((name) => ({ id: name, name }));
const ERA_OPTIONS = [{ id: "AC", name: "AC" }, { id: "BC", name: "BC" }];
const CULTURE_OPTIONS = NAME_CULTURES.map((c) => ({ id: c.id, name: `${c.name} (${c.group})` }));

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

const fmtDays = (d: number) => {
  const rounded = Math.max(1, Math.round(d));
  return d < 0.5 ? `${Math.max(1, Math.round(d * 24))} hours` : `${rounded} day${rounded === 1 ? "" : "s"}`;
};
const fmtRange = (a: number, b: number, unit: string) =>
  `${Math.max(1, Math.round(a))}-${Math.max(1, Math.round(b))} ${unit}`;

const cardStyle: React.CSSProperties = {
  background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px",
  padding: "24px", boxShadow: "var(--shadow-card)",
};

// Small segmented control used for gender / mode toggles in the name generator.
const SegmentedControl = ({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) => (
  <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px", overflow: "hidden" }}>
    {options.map((opt) => (
      <button
        key={opt.id}
        type="button"
        onClick={() => onChange(opt.id)}
        style={{
          flex: 1,
          padding: "10px 12px",
          background: value === opt.id ? "var(--gold)" : "transparent",
          color: value === opt.id ? "#000" : "var(--text)",
          border: "none",
          cursor: "pointer",
          fontWeight: value === opt.id ? "bold" : "normal",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          transition: "all 0.15s",
        }}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// Themed checkbox to match the rest of the admin UI (native checkboxes
// render with the browser's default look, which clashes with the dark/gold
// theme used everywhere else on this page).
const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }}
  >
    <div
      style={{
        width: "18px", height: "18px", borderRadius: "4px", flexShrink: 0,
        border: checked ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.3)",
        background: checked ? "var(--gold)" : "rgba(0,0,0,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
    <span style={{ fontSize: "0.9rem", opacity: 0.85 }}>{label}</span>
  </div>
);

export default function AdminToolsPage() {
  const [date, setDate] = useState<WorldDate>(worldDateDefault);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Name generator state
  const [cultureId, setCultureId] = useState(NAME_CULTURES[0].id);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [mode, setMode] = useState<"curated" | "procedural">("curated");
  const [includeByname, setIncludeByname] = useState(true);
  const [nameResult, setNameResult] = useState<GeneratedName | null>(null);
  const [nameHistory, setNameHistory] = useState<GeneratedName[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const draft = getDraft<WorldDate>("worldDate");
    if (draft) setDate(draft);
  }, []);

  const handleDateChange = (field: keyof WorldDate, value: number | string) => {
    const updated = { ...date, [field]: value };
    setDate(updated);
    setDraft("worldDate", updated);
  };

  const result: TravelResult | null = from && to ? calculateTravel(from, to) : null;

  const handleGenerateName = () => {
    const generated = generateName(mode, cultureId, gender, includeByname, nameResult?.full);
    if (!generated) return;
    setNameResult(generated);
    setNameHistory((prev) => [generated, ...prev].slice(0, 5));
    setCopied(false);
  };

  const handleCopyName = () => {
    if (!nameResult) return;
    navigator.clipboard.writeText(nameResult.full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ margin: 0 }}>Tools</h1>

      {/* Westeros Calendar */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "var(--gold)" }}>Westeros Calendar</h2>
        <p style={{ opacity: 0.7, marginTop: "-8px", marginBottom: "20px" }}>
          The in-world date shown on the site. Publish to push it live.
        </p>
        <p style={{ fontSize: "1.3rem", marginBottom: "20px" }}>
          {ordinal(date.day)} day of the {ordinal(date.moon)} moon, {date.year} {date.era}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "16px" }}>
          <NumberStepper label="Day" min={1} max={30} value={date.day} onChange={(v) => handleDateChange("day", v)} />
          <NumberStepper label="Moon" min={1} max={12} value={date.moon} onChange={(v) => handleDateChange("moon", v)} />
          <NumberStepper label="Year" min={0} value={date.year} onChange={(v) => handleDateChange("year", v)} />
          <SearchableSelect
            label="Era"
            value={date.era}
            options={ERA_OPTIONS}
            onChange={(v: string) => handleDateChange("era", v)}
            searchable={false}
          />
        </div>
      </div>

      {/* Travel Calculator */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "var(--gold)" }}>Travel Calculator</h2>
        <p style={{ opacity: 0.7, marginTop: "-8px", marginBottom: "20px" }}>
          Estimated travel time between any two locations on the map, based on distance and canon travel speeds. A GM estimate, not gospel.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <SearchableSelect label="From" value={from} options={LOCATION_OPTIONS} onChange={setFrom} placeholder="Select location" />
          <SearchableSelect label="To" value={to} options={LOCATION_OPTIONS} onChange={setTo} placeholder="Select location" />
        </div>

        {from && to && from === to && (
          <p style={{ color: "#ff4c4c" }}>Pick two different locations.</p>
        )}

        {result && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
              {([
                ["On Foot", fmtDays(result.footDays)],
                ["Horseback", fmtRange(result.horseDays[0], result.horseDays[1], "days")],
                ["With Army", fmtRange(result.armyDays[0], result.armyDays[1], "days")],
                ["By Sea", fmtDays(result.seaDays)],
                ["Dragonback", fmtRange(result.dragonHours[0], result.dragonHours[1], "hours")],
                ["Raven", result.ravenHours < 24 ? `${Math.round(result.ravenHours)} hours` : fmtDays(result.ravenHours / 24)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "14px" }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>{label}</div>
                  <div style={{ fontWeight: "bold" }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "12px" }}>
              ~{Math.round(result.landMiles)} land miles / ~{Math.round(result.seaMiles)} sea miles (straight-line estimate — assumes a usable route exists)
            </div>
          </>
        )}
      </div>

      {/* Name Generator */}
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, color: "var(--gold)" }}>Westeros Name Generator</h2>
        <p style={{ opacity: 0.7, marginTop: "-8px", marginBottom: "20px" }}>
          Given names, surnames, and smallfolk-style bynames for any region of Westeros, Essos, or the Free Folk.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
          <SearchableSelect label="Culture" value={cultureId} options={CULTURE_OPTIONS} onChange={setCultureId} placeholder="Select culture" />
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Gender</span>
            <SegmentedControl
              options={[{ id: "male", label: "Male" }, { id: "female", label: "Female" }]}
              value={gender}
              onChange={(v) => setGender(v as "male" | "female")}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Mode</span>
            <SegmentedControl
              options={[{ id: "curated", label: "Curated" }, { id: "procedural", label: "Surprise Me" }]}
              value={mode}
              onChange={(v) => setMode(v as "curated" | "procedural")}
            />
          </label>
        </div>

        <p style={{ fontSize: "0.8rem", opacity: 0.55, marginTop: "-8px", marginBottom: "16px" }}>
          {mode === "curated"
            ? "Curated picks a name from a hand-written list for this culture."
            : "Surprise Me builds a brand-new name by combining that culture's syllable patterns — not from the list, so it can invent names that don't exist anywhere yet."}
        </p>

        <div style={{ marginBottom: "20px" }}>
          <Checkbox
            checked={includeByname}
            onChange={setIncludeByname}
            label='Include a byname (e.g. "the Bastard", trade names)'
          />
        </div>

        <button
          onClick={handleGenerateName}
          style={{
            padding: "12px 24px", background: "var(--gold)", color: "#000", border: "none",
            borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontFamily: "inherit",
            fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "20px",
          }}
        >
          Generate Name
        </button>

        {nameResult && (
          <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "18px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: "bold" }}>{nameResult.full}</div>
              <button
                onClick={handleCopyName}
                style={{
                  padding: "8px 14px", background: "transparent", color: "var(--gold)",
                  border: "1px solid var(--gold)", borderRadius: "4px", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "0.8rem",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            {nameResult.byname && (
              <div style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "8px" }}>
                Given: {nameResult.given}{nameResult.surname ? ` · Surname: ${nameResult.surname}` : ""} · Byname: {nameResult.byname}
              </div>
            )}
          </div>
        )}

        {nameHistory.length > 1 && (
          <div>
            <div style={{ fontSize: "0.75rem", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px" }}>
              Recent
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {nameHistory.slice(1).map((n, i) => (
                <div key={i} style={{ fontSize: "0.9rem", opacity: 0.6 }}>{n.full}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 1000, fontWeight: "bold" }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
