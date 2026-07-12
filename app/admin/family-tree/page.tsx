// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\family-tree\page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import charactersData from "../../../data/characters/characters.json";

const globalStyles = `
  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--muted); }
  .dropdown-enter { animation: fadeIn 0.2s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`;

type Character = {
  id: string;
  name: string;
  house?: string;
  father?: string;
  mother?: string;
  spouse?: string;
  siblings?: string[];
  children?: string[];
  [key: string]: any;
};

const Avatar = ({ id, name, size = 28 }: { id: string; name: string; size?: number }) => {
  const [imgError, setImgError] = useState(false);
  const getInitials = (fullName: string) => {
    const titles = ["Ser", "Lord", "Lady", "Prince", "Princess", "Queen", "King", "Maester"];
    const parts = fullName.split(" ").filter((p) => !titles.includes(p));
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  if (!id || imgError) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, color: "var(--gold)", border: "1px solid var(--gold)", flexShrink: 0, fontWeight: "bold" }}>
        {getInitials(name)}
      </div>
    );
  }
  return (
    <img
      src={`/images/miniportraits/${id}.webp`}
      alt={name}
      onError={() => setImgError(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0, background: "var(--surface)" }}
    />
  );
};

// A searchable select that also accepts a free-typed name for relatives who
// aren't in the character roster (e.g. "Aenys Targaryen II"). Values that
// don't resolve to a known character id are treated as plain display names.
const PersonCombo = ({
  value,
  onChange,
  options,
  label,
  placeholder = "None",
  excludeIds = [],
}: {
  value?: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  label?: string;
  placeholder?: string;
  excludeIds?: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) => !excludeIds.includes(o.id) && o.name.toLowerCase().includes(search.toLowerCase()));
  const resolved = options.find((o) => o.id === value);
  const isCustom = !!value && value !== "-" && !resolved;
  const exactMatch = options.some((o) => o.name.toLowerCase() === search.trim().toLowerCase());

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: "10px 12px", background: "rgba(0,0,0,0.2)", border: isOpen ? "1px solid var(--gold)" : isCustom ? "1px dashed rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", transition: "all 0.2s" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value && value !== "-" ? resolved?.name || value : placeholder}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {isCustom && (
            <span style={{ fontSize: "0.65rem", opacity: 0.6, border: "1px dashed currentColor", padding: "1px 6px", borderRadius: "3px" }}>
              custom
            </span>
          )}
          <span style={{ fontSize: "10px", opacity: 0.5 }}>▼</span>
        </span>
      </div>

      {isOpen && (
        <div className="custom-scroll dropdown-enter" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "var(--surface)", border: "1px solid var(--border)", marginTop: "4px", borderRadius: "6px", maxHeight: "260px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "8px", position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
            <input
              autoFocus
              placeholder="Search roster or type a custom name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text)", borderRadius: "4px", outline: "none", fontFamily: "inherit" }}
            />
          </div>
          <div
            onClick={() => { onChange("-"); setIsOpen(false); setSearch(""); }}
            style={{ padding: "10px 12px", cursor: "pointer", opacity: 0.6, borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            None
          </div>
          {filtered.map((opt) => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }}
              style={{ padding: "10px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Avatar id={opt.id} name={opt.name} size={22} />
              {opt.name}
            </div>
          ))}
          {filtered.length === 0 && !search.trim() && (
            <div style={{ padding: "12px", opacity: 0.5, textAlign: "center" }}>No results found</div>
          )}
          {search.trim() && !exactMatch && (
            <div
              onClick={() => { onChange(search.trim()); setIsOpen(false); setSearch(""); }}
              style={{ padding: "10px 12px", cursor: "pointer", fontStyle: "italic", opacity: 0.85, background: "rgba(212, 175, 55, 0.06)" }}
            >
              Use &ldquo;{search.trim()}&rdquo; as a custom name (not in the roster)
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Themed checkbox to match the rest of the admin UI (native checkboxes
// render with the browser's default look, which clashes with the dark/gold
// theme used everywhere else in the admin panel).
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

const chipListStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "8px" };

const Chip = ({ label, custom, onRemove, onClick }: { label: string; custom?: boolean; onRemove: () => void; onClick?: () => void }) => (
  <div
    style={{
      display: "flex", alignItems: "center", gap: "8px", padding: "6px 6px 6px 12px",
      background: "rgba(0,0,0,0.3)", border: custom ? "1px dashed rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.15)",
      borderRadius: "20px", fontSize: "0.9rem",
    }}
  >
    <span onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>{label}</span>
    {custom && <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>(custom)</span>}
    <button onClick={onRemove} style={{ background: "rgba(178,34,34,0.2)", color: "#ff8080", border: "none", width: "18px", height: "18px", borderRadius: "50%", cursor: "pointer", lineHeight: 1, fontSize: "0.8rem" }}>×</button>
  </div>
);

// --- Pure "auto-detect" helpers ---
// These only read the current character list and return suggestions; they
// never mutate anything themselves, so they're safe to compose.

const detectParentsFor = (person: Character, allChars: Character[]) => {
  const matches = allChars.filter((c) => (c.children || []).includes(person.id));
  let father = person.father && person.father !== "-" ? person.father : undefined;
  let mother = person.mother && person.mother !== "-" ? person.mother : undefined;
  matches.forEach((m) => {
    if (m.id === father || m.id === mother) return;
    if (!father) { father = m.id; return; }
    if (!mother) { mother = m.id; return; }
  });
  return { father, mother };
};

const detectSpouseFor = (person: Character, allChars: Character[]): string | undefined => {
  if (person.spouse && person.spouse !== "-") return undefined;
  const match = allChars.find((c) => c.spouse === person.id);
  return match?.id;
};

const detectChildrenFor = (person: Character, allChars: Character[]): string[] => {
  const existing = new Set(person.children || []);
  return allChars.filter((c) => c.id !== person.id && !existing.has(c.id) && (c.father === person.id || c.mother === person.id)).map((c) => c.id);
};

const detectSiblingsFor = (person: Character, allChars: Character[]): string[] => {
  const existing = new Set(person.siblings || []);
  return allChars
    .filter(
      (c) =>
        c.id !== person.id &&
        !existing.has(c.id) &&
        ((person.father && person.father !== "-" && c.father === person.father) ||
          (person.mother && person.mother !== "-" && c.mother === person.mother))
    )
    .map((c) => c.id);
};

// --- Conflict detector ---
// Cross-checks each character's stated relations against what the "other
// side" of that relation actually says, and surfaces plain-English
// mismatches. Only checked against characters that exist in the roster —
// custom/plain-text names are already flagged separately as "custom".

type Conflict = { type: "parent" | "spouse" | "sibling" | "child"; message: string };

const nameOf = (id: string | undefined, all: Character[]) =>
  (id && id !== "-" && all.find((c) => c.id === id)?.name) || id || "—";

const getConflicts = (char: Character, all: Character[]): Conflict[] => {
  const findC = (id?: string) => (id && id !== "-" ? all.find((c) => c.id === id) : undefined);
  const issues: Conflict[] = [];

  (["father", "mother"] as const).forEach((field) => {
    const parent = findC(char[field]);
    if (parent && !(parent.children || []).includes(char.id)) {
      issues.push({
        type: "parent",
        message: `Listed as a child of ${field} ${parent.name}, but ${parent.name}'s children list doesn't include ${char.name}.`,
      });
    }
  });

  const spouse = findC(char.spouse);
  if (spouse && spouse.spouse !== char.id) {
    issues.push({
      type: "spouse",
      message:
        spouse.spouse && spouse.spouse !== "-"
          ? `Listed as married to ${spouse.name}, but ${spouse.name} is listed as married to ${nameOf(spouse.spouse, all)} instead.`
          : `Listed as married to ${spouse.name}, but ${spouse.name} doesn't list a spouse back.`,
    });
  }

  (char.siblings || []).forEach((sid) => {
    const sib = findC(sid);
    if (sib && !(sib.siblings || []).includes(char.id)) {
      issues.push({
        type: "sibling",
        message: `Listed as a sibling of ${sib.name}, but ${sib.name} doesn't list ${char.name} back.`,
      });
    }
  });

  (char.children || []).forEach((cid) => {
    const child = findC(cid);
    if (child && child.father !== char.id && child.mother !== char.id) {
      issues.push({
        type: "child",
        message: `Listed as a parent of ${child.name}, but ${child.name}'s father/mother fields don't point back to ${char.name}.`,
      });
    }
  });

  return issues;
};

// Stylized consistently with the rest of the admin panel's outlined gold buttons.
const AutoDetectButton = ({ onClick, label = "Auto-detect", full }: { onClick: () => void; label?: string; full?: boolean }) => (
  <button
    onClick={onClick}
    style={{
      fontSize: "0.8rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)",
      padding: "6px 10px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: "6px", width: full ? "100%" : undefined, justifyContent: full ? "center" : undefined,
    }}
  >
    <span style={{ fontSize: "0.85rem" }}>✦</span> {label}
  </button>
);

export default function AdminFamilyTreePage() {
  const [chars, setChars] = useState<Character[]>(charactersData as Character[]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listSearch, setListSearch] = useState("");
  const [syncReciprocal, setSyncReciprocal] = useState(true);
  const [collapsedHouses, setCollapsedHouses] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Shares the same draft key as the Characters admin page, so edits made
  // here and there stay in sync and both publish through `characters`.
  useEffect(() => {
    const draft = localStorage.getItem("draft-characters");
    if (draft) {
      try {
        setChars(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-characters", JSON.stringify(chars));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [chars]);

  const activeChar = chars.find((c) => c.id === selectedId) || null;
  const charOptions = useMemo(() => chars.map((c) => ({ id: c.id, name: c.name })), [chars]);

  const findChar = (id?: string) => (id ? chars.find((c) => c.id === id) : undefined);
  const displayName = (id: string) => findChar(id)?.name || id;

  const conflictsByChar = useMemo(() => {
    const map: Record<string, Conflict[]> = {};
    chars.forEach((c) => {
      map[c.id] = getConflicts(c, chars);
    });
    return map;
  }, [chars]);

  const activeConflicts = activeChar ? conflictsByChar[activeChar.id] || [] : [];

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const housesGrouped = useMemo(() => {
    const filtered = chars.filter((c) => c.name.toLowerCase().includes(listSearch.toLowerCase()));
    const groups: Record<string, Character[]> = {};
    filtered.forEach((c) => {
      const house = c.house && c.house !== "-" ? c.house : "No House";
      if (!groups[house]) groups[house] = [];
      groups[house].push(c);
    });
    return Object.entries(groups).sort(([a], [b]) => (a === "No House" ? 1 : b === "No House" ? -1 : a.localeCompare(b)));
  }, [chars, listSearch]);

  const toggleHouse = (house: string) => setCollapsedHouses((prev) => ({ ...prev, [house]: !prev[house] }));

  // --- Parent (father/mother) ---
  const setParent = (field: "father" | "mother", newValue: string) => {
    if (!activeChar) return;
    const oldValue = activeChar[field];
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, [field]: newValue } : c));

    if (syncReciprocal) {
      if (oldValue && oldValue !== "-" && oldValue !== newValue && findChar(oldValue)) {
        updated = updated.map((c) => (c.id === oldValue ? { ...c, children: (c.children || []).filter((cid: string) => cid !== activeChar.id) } : c));
      }
      if (newValue && newValue !== "-" && findChar(newValue)) {
        updated = updated.map((c) => (c.id === newValue ? { ...c, children: Array.from(new Set([...(c.children || []), activeChar.id])) } : c));
      }
    }
    setChars(updated);
  };

  // --- Spouse ---
  const setSpouse = (newValue: string) => {
    if (!activeChar) return;
    const oldValue = activeChar.spouse;
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, spouse: newValue } : c));

    if (syncReciprocal) {
      if (oldValue && oldValue !== "-" && oldValue !== newValue) {
        updated = updated.map((c) => (c.id === oldValue && c.spouse === activeChar.id ? { ...c, spouse: "-" } : c));
      }
      if (newValue && newValue !== "-" && findChar(newValue)) {
        updated = updated.map((c) => (c.id === newValue ? { ...c, spouse: activeChar.id } : c));
      }
    }
    setChars(updated);
  };

  // --- Siblings ---
  const addSibling = (id: string) => {
    if (!activeChar || !id || id === "-" || id === activeChar.id) return;
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, siblings: Array.from(new Set([...(c.siblings || []), id])) } : c));
    if (syncReciprocal && findChar(id)) {
      updated = updated.map((c) => (c.id === id ? { ...c, siblings: Array.from(new Set([...(c.siblings || []), activeChar.id])) } : c));
    }
    setChars(updated);
  };
  const removeSibling = (id: string) => {
    if (!activeChar) return;
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, siblings: (c.siblings || []).filter((s: string) => s !== id) } : c));
    if (syncReciprocal) {
      updated = updated.map((c) => (c.id === id ? { ...c, siblings: (c.siblings || []).filter((s: string) => s !== activeChar.id) } : c));
    }
    setChars(updated);
  };

  // --- Section-specific auto-detect ---
  const autoDetectParentsAndSpouse = () => {
    if (!activeChar) return;
    const { father, mother } = detectParentsFor(activeChar, chars);
    const spouseId = detectSpouseFor(activeChar, chars);
    const changedFather = !!father && father !== activeChar.father;
    const changedMother = !!mother && mother !== activeChar.mother;
    const changedSpouse = !!spouseId && spouseId !== activeChar.spouse;

    if (!changedFather && !changedMother && !changedSpouse) {
      showNotification("No new parent or spouse matches found.", "error");
      return;
    }

    let updated = chars.map((c) =>
      c.id === activeChar.id
        ? { ...c, ...(changedFather ? { father } : {}), ...(changedMother ? { mother } : {}), ...(changedSpouse ? { spouse: spouseId } : {}) }
        : c
    );
    if (syncReciprocal && changedSpouse) {
      updated = updated.map((c) => (c.id === spouseId ? { ...c, spouse: activeChar.id } : c));
    }
    setChars(updated);
    const parts = [changedFather && "father", changedMother && "mother", changedSpouse && "spouse"].filter(Boolean);
    showNotification(`Detected ${parts.join(", ")} from existing records.`, "success");
  };

  const autoDetectSiblings = () => {
    if (!activeChar) return;
    const newIds = detectSiblingsFor(activeChar, chars);
    if (newIds.length === 0) {
      showNotification("No new shared-parent matches found.", "error");
      return;
    }
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, siblings: Array.from(new Set([...(c.siblings || []), ...newIds])) } : c));
    if (syncReciprocal) {
      updated = updated.map((c) => (newIds.includes(c.id) ? { ...c, siblings: Array.from(new Set([...(c.siblings || []), activeChar.id])) } : c));
    }
    setChars(updated);
    showNotification(`Added ${newIds.length} sibling(s) from shared parents.`, "success");
  };

  const autoDetectChildren = () => {
    if (!activeChar) return;
    const newIds = detectChildrenFor(activeChar, chars);
    if (newIds.length === 0) {
      showNotification("No new children matches found.", "error");
      return;
    }
    const updated = chars.map((c) => (c.id === activeChar.id ? { ...c, children: Array.from(new Set([...(c.children || []), ...newIds])) } : c));
    setChars(updated);
    showNotification(`Added ${newIds.length} child(ren) who already list ${activeChar.name} as a parent.`, "success");
  };

  // --- Auto-detect everything for this character in one pass ---
  const autoDetectAll = () => {
    if (!activeChar) return;
    const { father, mother } = detectParentsFor(activeChar, chars);
    const spouseId = detectSpouseFor(activeChar, chars);
    const newChildIds = detectChildrenFor(activeChar, chars);
    const newSiblingIds = detectSiblingsFor({ ...activeChar, father: father ?? activeChar.father, mother: mother ?? activeChar.mother }, chars);

    const changedFather = !!father && father !== activeChar.father;
    const changedMother = !!mother && mother !== activeChar.mother;
    const changedSpouse = !!spouseId && spouseId !== activeChar.spouse;

    if (!changedFather && !changedMother && !changedSpouse && newChildIds.length === 0 && newSiblingIds.length === 0) {
      showNotification("Nothing new to auto-detect for this character.", "error");
      return;
    }

    let updated = chars.map((c) => {
      if (c.id !== activeChar.id) return c;
      return {
        ...c,
        ...(changedFather ? { father } : {}),
        ...(changedMother ? { mother } : {}),
        ...(changedSpouse ? { spouse: spouseId } : {}),
        children: Array.from(new Set([...(c.children || []), ...newChildIds])),
        siblings: Array.from(new Set([...(c.siblings || []), ...newSiblingIds])),
      };
    });

    if (syncReciprocal) {
      if (changedSpouse) {
        updated = updated.map((c) => (c.id === spouseId ? { ...c, spouse: activeChar.id } : c));
      }
      if (newSiblingIds.length) {
        updated = updated.map((c) => (newSiblingIds.includes(c.id) ? { ...c, siblings: Array.from(new Set([...(c.siblings || []), activeChar.id])) } : c));
      }
      // newChildIds are already reciprocal by construction (they already list activeChar as a parent).
    }

    setChars(updated);
    const parts = [
      changedFather && "father",
      changedMother && "mother",
      changedSpouse && "spouse",
      newChildIds.length && `${newChildIds.length} child(ren)`,
      newSiblingIds.length && `${newSiblingIds.length} sibling(s)`,
    ].filter(Boolean);
    showNotification(`Auto-detected: ${parts.join(", ")}.`, "success");
  };

  // --- Children ---
  const addChild = (id: string) => {
    if (!activeChar || !id || id === "-" || id === activeChar.id) return;
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, children: Array.from(new Set([...(c.children || []), id])) } : c));
    if (syncReciprocal) {
      updated = updated.map((c) => {
        if (c.id !== id) return c;
        if (!c.father || c.father === "-") return { ...c, father: activeChar.id };
        if (!c.mother || c.mother === "-") return { ...c, mother: activeChar.id };
        return c; // both parent slots already filled — leave untouched
      });
    }
    setChars(updated);
  };
  const removeChild = (id: string) => {
    if (!activeChar) return;
    let updated = chars.map((c) => (c.id === activeChar.id ? { ...c, children: (c.children || []).filter((k: string) => k !== id) } : c));
    if (syncReciprocal) {
      updated = updated.map((c) => {
        if (c.id !== id) return c;
        const patch: any = {};
        if (c.father === activeChar.id) patch.father = "-";
        if (c.mother === activeChar.id) patch.mother = "-";
        return { ...c, ...patch };
      });
    }
    setChars(updated);
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1300px", margin: "0 auto", position: "relative", fontFamily: "inherit" }}>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Left: Characters grouped by house */}
      <div style={{ width: "320px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: "0 0 4px 0" }}>Family Tree</h2>
          <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.6 }}>Edit relations for any character below.</p>
        </div>
        <input
          placeholder="Search characters..."
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text)", borderRadius: "6px", outline: "none", marginBottom: "15px", fontFamily: "inherit" }}
        />
        <div className="custom-scroll" style={{ overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          {housesGrouped.map(([house, members]) => (
            <div key={house} style={{ marginBottom: "10px" }}>
              <button
                onClick={() => toggleHouse(house)}
                style={{ width: "100%", background: "transparent", border: "none", color: "var(--gold)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", padding: "6px 4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <span>{house} <span style={{ opacity: 0.5 }}>({members.length})</span></span>
                <span style={{ fontSize: "0.7rem" }}>{collapsedHouses[house] ? "▸" : "▾"}</span>
              </button>
              {!collapsedHouses[house] && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {members.map((char) => {
                    const isSelected = char.id === selectedId;
                    return (
                      <li key={char.id}>
                        <button
                          onClick={() => setSelectedId(char.id)}
                          style={{
                            width: "100%", padding: "8px 12px", textAlign: "left",
                            background: isSelected ? "#B22222" : "rgba(0, 0, 0, 0.2)",
                            color: isSelected ? "#fff" : "inherit", border: "1px solid",
                            borderColor: isSelected ? "#B22222" : "rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px", cursor: "pointer",
                            fontWeight: isSelected ? "bold" : "normal", transition: "all 0.2s",
                            fontFamily: "inherit", display: "flex", alignItems: "center", gap: "10px",
                          }}
                        >
                          <Avatar id={char.id} name={char.name} size={26} />
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{char.name}</span>
                          {conflictsByChar[char.id]?.length > 0 && (
                            <span
                              title={`${conflictsByChar[char.id].length} relationship conflict(s)`}
                              style={{ color: isSelected ? "#fff" : "#ff4c4c", fontSize: "0.9rem", flexShrink: 0 }}
                            >
                              ⚠
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
          {housesGrouped.length === 0 && <div style={{ opacity: 0.5, textAlign: "center", padding: "20px" }}>No characters found.</div>}
        </div>
      </div>

      {/* Right: Relationship editor */}
      <div className="custom-scroll" style={{ flex: 1, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        {activeChar ? (
          <>
            <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--background)", padding: "0 15px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 15px -10px rgba(0,0,0,0.5)" }}>
              <Link
                href={`/characters/${activeChar.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View public profile"
                style={{ display: "flex", alignItems: "center", gap: "18px", textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <Avatar id={activeChar.id} name={activeChar.name} size={60} />
                <div>
                  <h1 style={{ margin: 0, fontSize: "1.7rem", color: "var(--gold)" }}>{activeChar.name}</h1>
                  <div style={{ opacity: 0.6, fontSize: "0.85rem", marginTop: "4px" }}>{activeChar.house !== "-" ? activeChar.house : "No House"}</div>
                </div>
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
                <div style={{ whiteSpace: "nowrap" }}>
                  <Checkbox checked={syncReciprocal} onChange={setSyncReciprocal} label="Keep reciprocal relations in sync" />
                </div>
                <AutoDetectButton onClick={autoDetectAll} label="Sync All" />
              </div>
            </div>

            {activeConflicts.length > 0 && (
              <div
                style={{
                  background: "rgba(139,0,0,0.15)",
                  border: "1px solid rgba(255,76,76,0.4)",
                  borderRadius: "6px",
                  padding: "14px 16px",
                  marginBottom: "24px",
                  maxWidth: "820px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ff4c4c", fontWeight: "bold" }}>
                  <span>⚠</span>
                  {activeConflicts.length} relationship conflict{activeConflicts.length > 1 ? "s" : ""} detected
                </div>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.85rem", opacity: 0.9, display: "flex", flexDirection: "column", gap: "4px" }}>
                  {activeConflicts.map((issue, i) => (
                    <li key={i}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "28px", maxWidth: "820px", paddingRight: "15px" }}>
              {/* Parents & Spouse */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Parents &amp; Spouse</h3>
                  <AutoDetectButton onClick={autoDetectParentsAndSpouse} label="Sync" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <PersonCombo label="Father" value={activeChar.father} options={charOptions} excludeIds={[activeChar.id]} onChange={(v) => setParent("father", v)} />
                  <PersonCombo label="Mother" value={activeChar.mother} options={charOptions} excludeIds={[activeChar.id]} onChange={(v) => setParent("mother", v)} />
                  <PersonCombo label="Spouse" value={activeChar.spouse} options={charOptions} excludeIds={[activeChar.id]} onChange={setSpouse} />
                </div>
                <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "10px" }}>
                  Pick from the roster, or type a name not listed as a character (e.g. a name-only ancestor) — it&apos;ll be saved as plain text.
                </p>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: 0 }} />

              {/* Siblings */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Siblings</h3>
                  <AutoDetectButton onClick={autoDetectSiblings} label="Sync" />
                </div>
                <div style={{ marginBottom: "12px", maxWidth: "320px" }}>
                  <PersonCombo
                    value="-"
                    placeholder="+ Add sibling..."
                    options={charOptions}
                    excludeIds={[activeChar.id, ...(activeChar.siblings || [])]}
                    onChange={(v) => v !== "-" && addSibling(v)}
                  />
                </div>
                <div style={chipListStyle}>
                  {(activeChar.siblings || []).map((id: string) => (
                    <Chip key={id} label={displayName(id)} custom={!findChar(id)} onClick={findChar(id) ? () => setSelectedId(id) : undefined} onRemove={() => removeSibling(id)} />
                  ))}
                  {(activeChar.siblings || []).length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>No siblings added yet.</div>}
                </div>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: 0 }} />

              {/* Children */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Children</h3>
                  <AutoDetectButton onClick={autoDetectChildren} label="Sync" />
                </div>
                <div style={{ marginBottom: "12px", maxWidth: "320px" }}>
                  <PersonCombo
                    value="-"
                    placeholder="+ Add child..."
                    options={charOptions}
                    excludeIds={[activeChar.id, ...(activeChar.children || [])]}
                    onChange={(v) => v !== "-" && addChild(v)}
                  />
                </div>
                <div style={chipListStyle}>
                  {(activeChar.children || []).map((id: string) => (
                    <Chip key={id} label={displayName(id)} custom={!findChar(id)} onClick={findChar(id) ? () => setSelectedId(id) : undefined} onRemove={() => removeChild(id)} />
                  ))}
                  {(activeChar.children || []).length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>No children added yet.</div>}
                </div>
                <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "10px" }}>
                  Adding a child fills that character&apos;s empty Father or Mother slot with {activeChar.name} (when sync is on).
                </p>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: 0 }} />

              {/* Snapshot */}
              <div>
                <h3 style={{ margin: "0 0 12px 0", color: "var(--gold)" }}>Relatives Snapshot</h3>
                <div style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.9rem" }}>
                  <div><strong style={{ opacity: 0.7 }}>Father:</strong> {activeChar.father && activeChar.father !== "-" ? displayName(activeChar.father) : "—"}</div>
                  <div><strong style={{ opacity: 0.7 }}>Mother:</strong> {activeChar.mother && activeChar.mother !== "-" ? displayName(activeChar.mother) : "—"}</div>
                  <div><strong style={{ opacity: 0.7 }}>Spouse:</strong> {activeChar.spouse && activeChar.spouse !== "-" ? displayName(activeChar.spouse) : "—"}</div>
                  <div><strong style={{ opacity: 0.7 }}>Siblings:</strong> {(activeChar.siblings || []).length ? (activeChar.siblings || []).map(displayName).join(", ") : "—"}</div>
                  <div><strong style={{ opacity: 0.7 }}>Children:</strong> {(activeChar.children || []).length ? (activeChar.children || []).map(displayName).join(", ") : "—"}</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "1.2rem", padding: "40px", textAlign: "center" }}>
            ← Select a character from the list to edit their family relations.
          </div>
        )}
      </div>

      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "12px", zIndex: 1000, fontSize: "1rem", fontWeight: "bold", backdropFilter: "blur(4px)" }}>
          <span style={{ fontSize: "1.2rem" }}>{notification.type === "success" ? "✓" : "⚠"}</span>
          {notification.message}
        </div>
      )}
    </div>
  );
}