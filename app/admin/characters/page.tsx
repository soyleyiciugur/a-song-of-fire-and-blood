"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { PromptModal, ConfirmModal } from "../_components/Modal";
import charactersData from "../../../data/characters/characters.json";
import housesData from "../../../data/houses.json";
import initialQuotes from "../../../data/quotes.json";
import { collectAllPendingDrafts, clearAllDrafts, isDraftDifferentFromOriginal } from "@/lib/adminDrafts";

const globalStyles = `
  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--muted); }
  .dropdown-enter { animation: fadeIn 0.2s ease-out forwards; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
`;

const Avatar = ({ id, name, size = 32, border = "1px solid rgba(255,255,255,0.1)" }: { id: string, name: string, size?: number, border?: string }) => {
  const [imgError, setImgError] = useState(false);

  const getInitials = (fullName: string) => {
    const titles = ["Ser", "Lord", "Lady", "Prince", "Princess", "Queen", "King", "Maester"];
    const nameParts = fullName.split(" ").filter(part => !titles.includes(part));
    if (nameParts.length === 0) return "?";
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    const lastName = nameParts[nameParts.length - 1];
    return (nameParts[0].charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  if (!id || imgError) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", background: "var(--surface)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, color: "var(--gold)", border: "1px solid var(--gold)",
        flexShrink: 0, fontWeight: "bold", userSelect: "none"
      }}>
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={`/images/miniportraits/${id}.webp`}
      alt={name}
      onError={() => setImgError(true)}
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border, flexShrink: 0, background: "var(--surface)" }}
    />
  );
};

const SearchableSelect = ({ value, options, onChange, label, placeholder = "Select...", searchable = true }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (searchable ? options.filter((o: any) => o.name.toLowerCase().includes(search.toLowerCase())) : options),
    [options, search, searchable]
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
      {label && <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: isOpen ? "1px solid var(--gold)" : "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {options.find((o: any) => o.id === value)?.name || placeholder}
        </span>
        <span style={{ fontSize: "10px", opacity: 0.5 }}>▼</span>
      </div>

      {isOpen && (
        <div className="custom-scroll dropdown-enter" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "var(--surface)", border: "1px solid var(--border)", marginTop: "4px", borderRadius: "6px", maxHeight: "220px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
          {searchable && (
            <div style={{ padding: "8px", position: "sticky", top: 0, background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
              <input autoFocus placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", padding: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text)", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
            </div>
          )}
          {filtered.length > 0 ? filtered.map((opt: any) => (
            <div key={opt.id} onClick={() => { onChange(opt.id); setIsOpen(false); setSearch(""); }} style={{ padding: "10px 12px", cursor: "pointer", transition: "background 0.15s", borderBottom: "1px solid rgba(255,255,255,0.05)" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {opt.name}
            </div>
          )) : <div style={{ padding: "12px", opacity: 0.5, textAlign: "center" }}>No results found</div>}
        </div>
      )}
    </div>
  );
};

const STATUS_OPTIONS = [
  { id: "Alive", name: "Alive" },
  { id: "Dead", name: "Dead" },
  { id: "Unknown", name: "Unknown" },
  { id: "Missing", name: "Missing" },
];

const SECRET_STATUS_OPTIONS = [
  { id: "-", name: "None" },
  ...STATUS_OPTIONS,
];

const CHARACTER_FIELD_ORDER = [
  "id", "name", "nickname", "aliases", "house", "title", "status", "secret",
  "age", "height", "father", "mother", "spouse", "siblings", "children",
  "mentor", "dragon", "traits", "goals", "relationships", "summary", "quotes",
];

const orderCharacterForExport = (char: any) => {
  const ordered: any = {};
  CHARACTER_FIELD_ORDER.forEach((key) => {
    if (key === "secret") {
      if (char.secret && char.secret.note && char.secret.note.trim() !== "") {
        ordered.secret = char.secret;
      }
      return;
    }
    if (char[key] !== undefined) ordered[key] = char[key];
  });
  Object.keys(char).forEach((key) => {
    if (!(key in ordered)) ordered[key] = char[key];
  });
  return ordered;
};

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

const createBlankCharacter = (id: string, name: string) => ({
  id,
  name,
  nickname: "",
  aliases: [],
  house: "-",
  title: "",
  status: "Alive",
  age: 0,
  height: "",
  father: "-",
  mother: "-",
  spouse: "-",
  siblings: [],
  children: [],
  mentor: "-",
  dragon: "-",
  traits: [],
  goals: [],
  relationships: {},
  summary: "",
});

export default function AdminCharactersPage() {
  const [chars, setChars] = useState<any[]>(charactersData as any[]);
  const [allQuotes, setAllQuotes] = useState<any[]>(initialQuotes as any[]);
  const [listSearch, setListSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);  
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const draftChars = localStorage.getItem("draft-characters");
    const draftQuotes = localStorage.getItem("draft-quotes");

    let loadedChars = charactersData as any[];
    let loadedQuotes = initialQuotes as any[];

    if (draftChars) {
      try {
        loadedChars = JSON.parse(draftChars);
        setChars(loadedChars);
      } catch {}
    }
    if (draftQuotes) {
      try {
        loadedQuotes = JSON.parse(draftQuotes);
        setAllQuotes(loadedQuotes);
      } catch {}
    }

    const charsChanged = isDraftDifferentFromOriginal(loadedChars, charactersData);
    const quotesChanged = isDraftDifferentFromOriginal(loadedQuotes, initialQuotes);
    setHasDraft(charsChanged || quotesChanged);
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-characters", JSON.stringify(chars));
    const charsChanged = isDraftDifferentFromOriginal(chars, charactersData);
    const quotesChanged = isDraftDifferentFromOriginal(allQuotes, initialQuotes);
    setHasDraft(charsChanged || quotesChanged);
  }, [chars]);

  useEffect(() => {
    localStorage.setItem("draft-quotes", JSON.stringify(allQuotes));
    const charsChanged = isDraftDifferentFromOriginal(chars, charactersData);
    const quotesChanged = isDraftDifferentFromOriginal(allQuotes, initialQuotes);
    setHasDraft(charsChanged || quotesChanged);
  }, [allQuotes]);

  const filteredChars = useMemo(() => chars.filter(c => c.name.toLowerCase().includes(listSearch.toLowerCase())), [chars, listSearch]);
  const activeChar = chars.find(c => c.id === selectedId);

  const activeCharQuotes = useMemo(() => {
    if (!activeChar) return [];
    return allQuotes.map((q, i) => ({ ...q, globalIndex: i })).filter(q => q.speakerId === activeChar.id);
  }, [allQuotes, activeChar]);

  const charOptions = [{ id: "-", name: "None" }, ...chars.map(c => ({ id: c.id, name: c.name }))];
  const houseOptions = [{ id: "-", name: "None" }, ...housesData.map(h => ({ id: h.name, name: h.name }))];
  const dragonOptions = [{ id: "-", name: "None" }, ...Array.from(new Set(chars.map(c => c.dragon).filter(d => d && d !== "-"))).map(d => ({ id: d as string, name: d as string }))];

  const handleChange = (field: string, value: any) => {
    if (!activeChar) return;
    setChars(chars.map(c => c.id === activeChar.id ? { ...c, [field]: value } : c));
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNewCharacter = (name: string) => {
  if (!name || !name.trim()) {
    setShowAddModal(false);
    return;
  }

  const id = slugify(name);
  if (chars.some(c => c.id === id)) {
    showNotification("A character with this name/ID already exists.", "error");
    return;
  }

  const newChar = createBlankCharacter(id, name.trim());
  setChars([...chars, newChar]);
  setSelectedId(id);
  setListSearch("");
  setShowAddModal(false);
};

  const handleDeleteCharacter = () => {
  if (!activeChar) return;
  setChars(chars.filter(c => c.id !== activeChar.id));
  setAllQuotes(allQuotes.filter(q => q.speakerId !== activeChar.id));
  setSelectedId(null);
  setShowDeleteModal(false);
  showNotification("Character removed from draft.", "success");
};

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const orderedChars = chars.map(orderCharacterForExport);
      localStorage.setItem("draft-characters", JSON.stringify(orderedChars));
      localStorage.setItem("draft-quotes", JSON.stringify(allQuotes));

      const pending = collectAllPendingDrafts();

      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const data = await res.json();

      if (data.success) {
        showNotification("Published! Site will update in ~1 minute.", "success");
        clearAllDrafts();
        setHasDraft(false);
      } else {
        showNotification("Error saving data.", "error");
      }
    } catch {
      showNotification("A system error occurred while saving.", "error");
    }
    setIsSaving(false);
  };

  const handleDiscardDraft = () => {
    if (!confirm("Discard all unpublished changes and reset to the live version?")) return;
    localStorage.removeItem("draft-characters");
    localStorage.removeItem("draft-quotes");
    setChars(charactersData as any[]);
    setAllQuotes(initialQuotes as any[]);
    setSelectedId(null);
    setHasDraft(false);
    showNotification("Draft discarded.", "success");
  };

  const handleRelationshipChange = (charId: string, desc: string) => {
    if (!activeChar) return;
    const newRels = { ...(activeChar.relationships || {}), [charId]: desc };
    handleChange("relationships", newRels);
  };

  const removeRelationship = (charId: string) => {
    if (!activeChar) return;
    const newRels = { ...activeChar.relationships };
    delete newRels[charId];
    handleChange("relationships", newRels);
  };

  const handleQuoteChange = (globalIndex: number, field: string, value: string) => {
    const newQuotes = [...allQuotes];
    newQuotes[globalIndex] = { ...newQuotes[globalIndex], [field]: value };
    setAllQuotes(newQuotes);
  };

  const addQuote = () => {
    if (!activeChar) return;
    setAllQuotes([...allQuotes, { speakerId: activeChar.id, speakerName: activeChar.name, text: "", chapterSlug: "", chapterTitle: "" }]);
  };

  const removeQuote = (globalIndex: number) => {
    setAllQuotes(allQuotes.filter((_, idx) => idx !== globalIndex));
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative", fontFamily: "inherit" }}>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />

      {/* Sol Taraf: Karakter Listesi */}
      <div style={{ width: "320px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0 }}>Characters</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>
        <input
          placeholder="Search characters..."
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text)", borderRadius: "6px", outline: "none", marginBottom: "15px", fontFamily: "inherit" }}
        />
        <ul className="custom-scroll" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          {filteredChars.map((char: any) => {
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
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: "12px"
                  }}
                >
                  <Avatar id={char.id} name={char.name} size={32} border={isSelected ? "1px solid rgba(255,255,255,0.5)" : "1px solid rgba(255,255,255,0.1)"} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {char.name}
                  </span>
                </button>
              </li>
            );
          })}
          {filteredChars.length === 0 && <div style={{ opacity: 0.5, textAlign: "center", padding: "20px" }}>No characters found.</div>}
        </ul>
      </div>

      {/* Sağ Taraf: Düzenleme Formu */}
      <div className="custom-scroll" style={{ flex: 1, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        {activeChar ? (
          <>
            <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--background)", padding: "0 15px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 15px -10px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Avatar id={activeChar.id} name={activeChar.name} size={70} border="2px solid var(--gold)" />
                <div>
                  <h1 style={{ margin: 0, fontSize: "2rem", color: "var(--gold)" }}>{activeChar.name}</h1>
                  <div style={{ opacity: 0.6, fontSize: "0.9rem", marginTop: "4px" }}>ID: {activeChar.id}</div>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                Delete Character
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", paddingRight: "15px" }}>
              <div style={{ display: "flex", gap: "20px" }}>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Full Name</span>
                  <input value={activeChar.name} onChange={(e) => handleChange("name", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                </label>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Nickname</span>
                  <input value={activeChar.nickname || ""} onChange={(e) => handleChange("nickname", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <label style={{ flex: 2, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Title</span>
                  <input value={activeChar.title} onChange={(e) => handleChange("title", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                </label>
                <SearchableSelect label="Status" searchable={false} value={activeChar.status} options={STATUS_OPTIONS} onChange={(v: string) => handleChange("status", v)} />
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <SearchableSelect label="House" value={activeChar.house} options={houseOptions} onChange={(v: string) => handleChange("house", v)} />
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Age</span>
                  <input type="number" value={activeChar.age} onChange={(e) => handleChange("age", parseInt(e.target.value) || 0)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                </label>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Height</span>
                  <input value={activeChar.height || ""} onChange={(e) => handleChange("height", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <SearchableSelect label="Father" value={activeChar.father} options={charOptions} onChange={(v: string) => handleChange("father", v)} />
                <SearchableSelect label="Mother" value={activeChar.mother} options={charOptions} onChange={(v: string) => handleChange("mother", v)} />
                <SearchableSelect label="Spouse" value={activeChar.spouse} options={charOptions} onChange={(v: string) => handleChange("spouse", v)} />
                <SearchableSelect label="Dragon" value={activeChar.dragon} options={dragonOptions} onChange={(v: string) => handleChange("dragon", v)} />
              </div>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Summary</span>
                <textarea value={activeChar.summary} onChange={(e) => handleChange("summary", e.target.value)} className="custom-scroll" style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "180px", fontFamily: "inherit", resize: "vertical", lineHeight: "1.6", outline: "none" }} />
              </label>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Secret Info <span style={{ fontSize: "0.75rem", opacity: 0.5, fontWeight: "normal", textTransform: "none" }}>(spoiler / editor-only)</span></h3>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px", background: "rgba(178, 34, 34, 0.06)", border: "1px dashed rgba(178, 34, 34, 0.4)", borderRadius: "6px", padding: "15px" }}>
                  <div style={{ display: "flex", gap: "20px" }}>
                    <SearchableSelect
                      label="Secret Status"
                      searchable={false}
                      value={activeChar.secret?.status ?? "-"}
                      options={SECRET_STATUS_OPTIONS}
                      onChange={(v: string) =>
                        handleChange(
                          "secret",
                          v === "-" ? undefined : { status: v, note: activeChar.secret?.note ?? "" }
                        )
                      }
                    />
                  </div>
                  <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Secret Note</span>
                    <textarea
                      value={activeChar.secret?.note ?? ""}
                      onChange={(e) =>
                        handleChange("secret", { status: activeChar.secret?.status ?? "Unknown", note: e.target.value })
                      }
                      className="custom-scroll"
                      placeholder="Editor-only notes..."
                      style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "100px", resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: "1.6" }}
                    />
                  </label>
                </div>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Relationships</h3>
                  <div style={{ width: "250px" }}>
                    <SearchableSelect label="" placeholder="+ Add Character..." options={charOptions.filter(o => o.id !== "-" && o.id !== activeChar.id && !Object.keys(activeChar.relationships || {}).includes(o.id))} onChange={(v: string) => handleRelationshipChange(v, "")} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {Object.entries(activeChar.relationships || {}).map(([relId, desc]) => {
                    const relChar = chars.find(c => c.id === relId);
                    return (
                      <div key={relId} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "15px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <Avatar id={relId} name={relChar?.name || relId} size={24} />
                            <strong style={{ fontSize: "1.1rem" }}>{relChar?.name || relId}</strong>
                          </div>
                          <button onClick={() => removeRelationship(relId)} style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 5px" }}>Remove</button>
                        </div>
                        <textarea value={desc as string} onChange={(e) => handleRelationshipChange(relId, e.target.value)} className="custom-scroll" placeholder="Describe their relationship..." style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "inherit", borderRadius: "4px", minHeight: "60px", fontFamily: "inherit", resize: "vertical", outline: "none" }} />
                      </div>
                    );
                  })}
                  {Object.keys(activeChar.relationships || {}).length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>No relationships added yet.</div>}
                </div>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Quotes</h3>
                  <button onClick={addQuote} style={{ background: "transparent", color: "var(--gold)", border: "1px solid var(--gold)", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}>+ Add Quote</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px", paddingBottom: "40px" }}>
                  {activeCharQuotes.map((quote: any, idx: number) => (
                    <div key={quote.globalIndex} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ opacity: 0.7, fontSize: "0.9rem" }}>Quote #{idx + 1}</span>
                        <button onClick={() => removeQuote(quote.globalIndex)} style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 5px" }}>Remove</button>
                      </div>
                      <textarea value={quote.text} onChange={(e) => handleQuoteChange(quote.globalIndex, "text", e.target.value)} className="custom-scroll" placeholder='"The quote itself..."' style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "inherit", borderRadius: "4px", minHeight: "80px", fontFamily: "inherit", resize: "vertical", outline: "none", marginBottom: "10px" }} />
                      <div style={{ display: "flex", gap: "15px" }}>
                        <input value={quote.chapterTitle || ""} onChange={(e) => handleQuoteChange(quote.globalIndex, "chapterTitle", e.target.value)} placeholder="Chapter / Context (Optional)" style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                        <input value={quote.chapterSlug || ""} onChange={(e) => handleQuoteChange(quote.globalIndex, "chapterSlug", e.target.value)} placeholder="Chapter ID" style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" }} />
                      </div>
                    </div>
                  ))}
                  {activeCharQuotes.length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>No quotes added yet.</div>}
                </div>
              </div>

              <div style={{ position: "sticky", bottom: "0", background: "linear-gradient(to top, var(--background) 70%, transparent)", padding: "20px 0", marginTop: "-20px", zIndex: 40 }}>
                {hasDraft && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", fontSize: "0.85rem", opacity: 0.8 }}>
                    <span>⚠ You have unpublished changes (saved locally)</span>
                    <button onClick={handleDiscardDraft} style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                      Discard draft
                    </button>
                  </div>
                )}
                <button onClick={handlePublish} disabled={isSaving} style={{ width: "100%", padding: "16px", background: "#B22222", color: "#fff", border: "none", borderRadius: "4px", cursor: isSaving ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "16px", textTransform: "uppercase", letterSpacing: "2px", opacity: isSaving ? 0.7 : 1, transition: "all 0.2s" }}>
                  {isSaving ? "Publishing..." : "Publish Changes"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "1.2rem", padding: "40px" }}>
            ← Select a character from the list, or click "+ Add New" to create one.
          </div>
        )}
      </div>
      {showAddModal && (
  <PromptModal
    title="Add New Character"
    placeholder="Full name"
    onConfirm={handleAddNewCharacter}
    onCancel={() => setShowAddModal(false)}
  />
)}

{showDeleteModal && activeChar && (
  <ConfirmModal
    title="Delete Character"
    message={`Are you sure you want to delete "${activeChar.name}"?\n\nThis cannot be undone once you Publish.`}
    confirmLabel="Delete"
    onConfirm={handleDeleteCharacter}
    onCancel={() => setShowDeleteModal(false)}
  />
)}
      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "12px", zIndex: 1000, fontSize: "1rem", fontWeight: "bold", backdropFilter: "blur(4px)" }}>
          <span style={{ fontSize: "1.2rem" }}>{notification.type === "success" ? "✓" : "⚠"}</span>
          {notification.message}
        </div>
      )}
    </div>
  );
}