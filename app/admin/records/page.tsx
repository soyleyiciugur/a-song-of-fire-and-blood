// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\records\page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { PromptModal, ConfirmModal } from "../_components/Modal";
import { SearchableSelect } from "../_components/SearchableSelect";
import scrollsData from "../../../data/scrolls.json";
import entriesData from "../../../data/bookOfBrothers.json";
import charactersData from "../../../data/characters/characters.json";
import housesData from "../../../data/houses.json";

const globalStyles = `
  .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .custom-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.2); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  .custom-scroll::-webkit-scrollbar-thumb:hover { background: var(--muted); }
`;

// ─────────────────────────────────────────────────────────────────────────
// Shared checkbox (identical styling used by both tabs)
// ─────────────────────────────────────────────────────────────────────────

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
    <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>
  </div>
);

const inputStyle = { padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none", fontFamily: "inherit" };
const labelTextStyle = { fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase" as const, letterSpacing: "1px" };

// ─────────────────────────────────────────────────────────────────────────
// Scrolls tab (unchanged from the old /admin/scrolls page, just renamed)
// ─────────────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { id: "Natural History", name: "Natural History" },
  { id: "Religion & Faith", name: "Religion & Faith" },
  { id: "War & Conquest", name: "War & Conquest" },
  { id: "Medicine & Affliction", name: "Medicine & Affliction" },
  { id: "Genealogy & Lineage", name: "Genealogy & Lineage" },
  { id: "Law & Governance", name: "Law & Governance" },
  { id: "Myth & Legend", name: "Myth & Legend" },
];

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

const createBlankScroll = (id: string, title: string) => ({
  id,
  title,
  subtitle: "",
  author: "",
  authorTitle: "",
  category: "Natural History",
  summary: "",
  content: "",
  relatedCharacterIds: [],
  relatedHouses: [],
  chapterRef: "",
  dateWritten: "",
  sealHouse: "",
  published: false,
});

function ScrollsTab() {
  const [scrolls, setScrolls] = useState<any[]>(scrollsData as any[]);
  const [listSearch, setListSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isFirstRender = useRef(true);

  useEffect(() => {
    const draftScrolls = localStorage.getItem("draft-scrolls");
    if (draftScrolls) {
      try {
        setScrolls(JSON.parse(draftScrolls));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem("draft-scrolls", JSON.stringify(scrolls));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [scrolls]);

  const filteredScrolls = useMemo(
    () => scrolls.filter((s) => s.title.toLowerCase().includes(listSearch.toLowerCase())),
    [scrolls, listSearch]
  );
  const activeScroll = scrolls.find((s) => s.id === selectedId);

  const charOptions = [{ id: "-", name: "None" }, ...(charactersData as any[]).map((c) => ({ id: c.id, name: c.name }))];
  const houseOptions = [{ id: "-", name: "None" }, ...(housesData as any[]).map((h) => ({ id: h.name, name: h.name }))];

  const handleChange = (field: string, value: any) => {
    if (!activeScroll) return;
    setScrolls(scrolls.map((s) => (s.id === activeScroll.id ? { ...s, [field]: value } : s)));
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNewScroll = (title: string) => {
    if (!title || !title.trim()) {
      setShowAddModal(false);
      return;
    }
    const id = slugify(title);
    if (scrolls.some((s) => s.id === id)) {
      showNotification("A scroll with this title/ID already exists.", "error");
      return;
    }
    const newScroll = createBlankScroll(id, title.trim());
    setScrolls([...scrolls, newScroll]);
    setSelectedId(id);
    setListSearch("");
    setShowAddModal(false);
  };

  const handleDeleteScroll = () => {
    if (!activeScroll) return;
    setScrolls(scrolls.filter((s) => s.id !== activeScroll.id));
    setSelectedId(null);
    setShowDeleteModal(false);
    showNotification("Scroll removed from draft.", "success");
  };

  const addRelatedCharacter = (charId: string) => {
    if (!activeScroll || charId === "-") return;
    const current: string[] = activeScroll.relatedCharacterIds || [];
    if (current.includes(charId)) return;
    handleChange("relatedCharacterIds", [...current, charId]);
  };

  const removeRelatedCharacter = (charId: string) => {
    if (!activeScroll) return;
    handleChange(
      "relatedCharacterIds",
      (activeScroll.relatedCharacterIds || []).filter((id: string) => id !== charId)
    );
  };

  const addRelatedHouse = (houseName: string) => {
    if (!activeScroll || houseName === "-") return;
    const current: string[] = activeScroll.relatedHouses || [];
    if (current.includes(houseName)) return;
    handleChange("relatedHouses", [...current, houseName]);
  };

  const removeRelatedHouse = (houseName: string) => {
    if (!activeScroll) return;
    handleChange(
      "relatedHouses",
      (activeScroll.relatedHouses || []).filter((name: string) => name !== houseName)
    );
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <div style={{ width: "320px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Scrolls</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>
        <input
          placeholder="Search scrolls..."
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text)", borderRadius: "6px", outline: "none", marginBottom: "15px", fontFamily: "inherit" }}
        />
        <ul className="custom-scroll" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          {filteredScrolls.map((scroll: any) => {
            const isSelected = scroll.id === selectedId;
            return (
              <li key={scroll.id}>
                <button
                  onClick={() => setSelectedId(scroll.id)}
                  style={{
                    width: "100%", padding: "10px 12px", textAlign: "left",
                    background: isSelected ? "#B22222" : "rgba(0, 0, 0, 0.2)",
                    color: isSelected ? "#fff" : "inherit", border: "1px solid",
                    borderColor: isSelected ? "#B22222" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px", cursor: "pointer",
                    fontWeight: isSelected ? "bold" : "normal", transition: "all 0.2s",
                    fontFamily: "inherit", display: "flex", flexDirection: "column", gap: "4px"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {scroll.title}
                  </span>
                  {!scroll.published && (
                    <span style={{ fontSize: "0.7rem", opacity: 0.7, fontStyle: "italic" }}>Unpublished</span>
                  )}
                </button>
              </li>
            );
          })}
          {filteredScrolls.length === 0 && <div style={{ opacity: 0.5, textAlign: "center", padding: "20px" }}>No scrolls found.</div>}
        </ul>
      </div>

      <div className="custom-scroll" style={{ flex: 1, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        {activeScroll ? (
          <>
            <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--background)", padding: "0 15px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 15px -10px rgba(0,0,0,0.5)" }}>
              <Link
                href={`/scrolls/${activeScroll.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View public profile"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <h1 style={{ margin: 0, fontSize: "1.8rem", color: "var(--gold)" }}>{activeScroll.title || "Untitled Scroll"}</h1>
                <div style={{ opacity: 0.6, fontSize: "0.9rem", marginTop: "4px" }}>ID: {activeScroll.id}</div>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                Delete Scroll
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", paddingRight: "15px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={labelTextStyle}>Title</span>
                <input value={activeScroll.title} onChange={(e) => handleChange("title", e.target.value)} style={inputStyle} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={labelTextStyle}>Subtitle (optional)</span>
                <input value={activeScroll.subtitle || ""} onChange={(e) => handleChange("subtitle", e.target.value)} style={inputStyle} />
              </label>

              <div style={{ display: "flex", gap: "20px" }}>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Author</span>
                  <input value={activeScroll.author} onChange={(e) => handleChange("author", e.target.value)} placeholder="e.g. Maester Cellador" style={inputStyle} />
                </label>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Author&apos;s Title (optional)</span>
                  <input value={activeScroll.authorTitle || ""} onChange={(e) => handleChange("authorTitle", e.target.value)} placeholder="e.g. Maester of the Citadel" style={inputStyle} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <SearchableSelect label="Category" searchable={false} value={activeScroll.category} options={CATEGORY_OPTIONS} onChange={(v: string) => handleChange("category", v)} />
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Date Written (optional)</span>
                  <input value={activeScroll.dateWritten || ""} onChange={(e) => handleChange("dateWritten", e.target.value)} placeholder="e.g. 102 AC" style={inputStyle} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "20px" }}>
                <SearchableSelect label="Wax Seal (house)" value={activeScroll.sealHouse || "-"} options={houseOptions} onChange={(v: string) => handleChange("sealHouse", v === "-" ? "" : v)} />
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Chapter Reference (optional)</span>
                  <input value={activeScroll.chapterRef || ""} onChange={(e) => handleChange("chapterRef", e.target.value)} style={inputStyle} />
                </label>
              </div>

              <Checkbox
                checked={!!activeScroll.published}
                onChange={(checked) => handleChange("published", checked)}
                label="Published (visible on the public site)"
              />

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={labelTextStyle}>Summary <span style={{ opacity: 0.6, textTransform: "none" }}>(shown on the archive list)</span></span>
                <textarea value={activeScroll.summary} onChange={(e) => handleChange("summary", e.target.value)} className="custom-scroll" style={{ ...inputStyle, minHeight: "80px", resize: "vertical", lineHeight: "1.6" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={labelTextStyle}>Content <span style={{ opacity: 0.6, textTransform: "none" }}>(leave a blank line between paragraphs)</span></span>
                <textarea value={activeScroll.content} onChange={(e) => handleChange("content", e.target.value)} className="custom-scroll" style={{ ...inputStyle, minHeight: "320px", resize: "vertical", lineHeight: "1.6" }} />
              </label>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Related Characters</h3>
                  <div style={{ width: "250px" }}>
                    <SearchableSelect label="" placeholder="+ Add Character..." options={charOptions.filter((o) => o.id !== "-" && !(activeScroll.relatedCharacterIds || []).includes(o.id))} onChange={addRelatedCharacter} />
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {(activeScroll.relatedCharacterIds || []).map((charId: string) => {
                    const c = (charactersData as any[]).find((ch) => ch.id === charId);
                    return (
                      <div key={charId} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "6px 8px 6px 14px" }}>
                        <span>{c?.name || charId}</span>
                        <button onClick={() => removeRelatedCharacter(charId)} style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>✕</button>
                      </div>
                    );
                  })}
                  {(activeScroll.relatedCharacterIds || []).length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>None added yet.</div>}
                </div>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Related Houses</h3>
                  <div style={{ width: "250px" }}>
                    <SearchableSelect label="" placeholder="+ Add House..." options={houseOptions.filter((o) => o.id !== "-" && !(activeScroll.relatedHouses || []).includes(o.id))} onChange={addRelatedHouse} />
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {(activeScroll.relatedHouses || []).map((houseName: string) => (
                    <div key={houseName} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "6px 8px 6px 14px" }}>
                      <span>House {houseName}</span>
                      <button onClick={() => removeRelatedHouse(houseName)} style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>✕</button>
                    </div>
                  ))}
                  {(activeScroll.relatedHouses || []).length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>None added yet.</div>}
                </div>
              </div>

              <div style={{ height: "40px" }} />
            </div>
          </>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "1.2rem", padding: "40px" }}>
            &larr; Select a scroll from the list, or click &quot;+ Add New&quot; to create one.
          </div>
        )}
      </div>

      {showAddModal && (
        <PromptModal
          title="Add New Scroll"
          placeholder="Scroll title"
          onConfirm={handleAddNewScroll}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showDeleteModal && activeScroll && (
        <ConfirmModal
          title="Delete Scroll"
          message={`Are you sure you want to delete "${activeScroll.title}"?\n\nThis cannot be undone once you Publish.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteScroll}
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

// ─────────────────────────────────────────────────────────────────────────
// Book of Brothers tab (unchanged from the old page, just renamed)
// ─────────────────────────────────────────────────────────────────────────

const createBlankEntry = (id: string, characterId: string) => ({
  id,
  characterId,
  appointedDate: "",
  endDate: "",
  precedingCharacterId: "",
  oath: "",
  deeds: [],
  notes: "",
  published: false,
});

function BookOfBrothersTab() {
  const [entries, setEntries] = useState<any[]>(entriesData as any[]);
  const [listSearch, setListSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingNewCharId, setPendingNewCharId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isFirstRender = useRef(true);

  useEffect(() => {
    const draft = localStorage.getItem("draft-bookOfBrothers");
    if (draft) {
      try {
        setEntries(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    localStorage.setItem("draft-bookOfBrothers", JSON.stringify(entries));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [entries]);

  const formatIdToName = (slug: string) => {
    if (!slug) return "Unknown Knight";
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDisplayName = (entry: any) => {
    if (entry.characterId && entry.characterId !== "-") {
      const found = (charactersData as any[]).find((c) => c.id === entry.characterId);
      if (found) return found.name;
    }

    if (entry.manualName && entry.manualName.trim() !== "") {
      return entry.manualName;
    }

    return formatIdToName(entry.id);
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const name = getDisplayName(e);
      return name.toLowerCase().includes(listSearch.toLowerCase());
    });
  }, [entries, listSearch]);

  const activeEntry = entries.find((e) => e.id === selectedId);

  const charOptions = [
    { id: "-", name: "None" },
    ...(charactersData as any[]).map((c) => ({ id: c.id, name: c.name }))
  ];

  const unassignedCharOptions = (charactersData as any[])
    .filter((c) => !entries.some((e) => e.characterId === c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  const handleChange = (field: string, value: any) => {
    if (!selectedId) return;
    setEntries(entries.map((e) => (e.id === selectedId ? { ...e, [field]: value } : e)));
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNewEntry = () => {
    if (!pendingNewCharId) {
      showNotification("Choose a character first.", "error");
      return;
    }
    const id = pendingNewCharId;
    if (entries.some((e) => e.id === id)) {
      showNotification("This character already has an entry.", "error");
      return;
    }
    const newEntry = createBlankEntry(id, pendingNewCharId);
    setEntries([...entries, newEntry]);
    setSelectedId(id);
    setListSearch("");
    setShowAddModal(false);
    setPendingNewCharId(null);
  };

  const handleDeleteEntry = () => {
    if (!selectedId) return;
    setEntries(entries.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    setShowDeleteModal(false);
    showNotification("Entry removed from draft.", "success");
  };

  const addDeed = () => {
    if (!activeEntry) return;
    handleChange("deeds", [...(activeEntry.deeds || []), { date: "", description: "" }]);
  };

  const updateDeed = (index: number, field: "date" | "description", value: string) => {
    if (!activeEntry) return;
    const deeds = [...(activeEntry.deeds || [])];
    deeds[index] = { ...deeds[index], [field]: value };
    handleChange("deeds", deeds);
  };

  const removeDeed = (index: number) => {
    if (!activeEntry) return;
    handleChange("deeds", (activeEntry.deeds || []).filter((_: any, i: number) => i !== index));
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <div style={{ width: "320px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>The Book of Brothers</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>
        <input
          placeholder="Search by knight's name..."
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--text)", borderRadius: "6px", outline: "none", marginBottom: "15px", fontFamily: "inherit" }}
        />
        <ul className="custom-scroll" style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flex: 1, paddingRight: "5px" }}>
          {filteredEntries.map((entry: any) => {
            const isSelected = entry.id === selectedId;
            return (
              <li key={entry.id}>
                <button
                  onClick={() => setSelectedId(entry.id)}
                  style={{
                    width: "100%", padding: "10px 12px", textAlign: "left",
                    background: isSelected ? "#B22222" : "rgba(0, 0, 0, 0.2)",
                    color: isSelected ? "#fff" : "inherit", border: "1px solid",
                    borderColor: isSelected ? "#B22222" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px", cursor: "pointer",
                    fontWeight: isSelected ? "bold" : "normal", transition: "all 0.2s",
                    fontFamily: "inherit", display: "flex", flexDirection: "column", gap: "4px"
                  }}
                >
                  <span>{getDisplayName(entry)}</span>
                  {!entry.published && (
                    <span style={{ fontSize: "0.7rem", opacity: 0.7, fontStyle: "italic" }}>Unpublished</span>
                  )}
                </button>
              </li>
            );
          })}
          {filteredEntries.length === 0 && <div style={{ opacity: 0.5, textAlign: "center", padding: "20px" }}>No entries found.</div>}
        </ul>
      </div>

      <div className="custom-scroll" style={{ flex: 1, maxHeight: "90vh", overflowY: "auto", position: "relative" }}>
        {activeEntry ? (
          <>
            <div style={{ position: "sticky", top: 0, zIndex: 40, background: "var(--background)", padding: "0 15px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", marginBottom: "30px", borderBottom: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 15px -10px rgba(0,0,0,0.5)" }}>
              <Link
                href={`/book-of-brothers/${activeEntry.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View public profile"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <h1 style={{ margin: 0, fontSize: "1.8rem", color: "var(--gold)" }}>{getDisplayName(activeEntry)}</h1>
                <div style={{ opacity: 0.6, fontSize: "0.9rem", marginTop: "4px" }}>ID: {activeEntry.id}</div>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
              >
                Delete Entry
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", paddingRight: "15px" }}>

              {(!activeEntry.characterId || activeEntry.characterId === "-") && (
                <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Knight's Name (Manual)</span>
                  <input
                    value={activeEntry.manualName || ""}
                    onChange={(e) => handleChange("manualName", e.target.value)}
                    placeholder="e.g. Ser Duncan the Tall"
                    style={inputStyle}
                  />
                </label>
              )}

              <div style={{ display: "flex", gap: "20px" }}>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Appointed (Date)</span>
                  <input value={activeEntry.appointedDate || ""} onChange={(e) => handleChange("appointedDate", e.target.value)} placeholder="e.g. 97 AC" style={inputStyle} />
                </label>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={labelTextStyle}>Service Ended (optional)</span>
                  <input value={activeEntry.endDate || ""} onChange={(e) => handleChange("endDate", e.target.value)} placeholder="e.g. 111 AC — death" style={inputStyle} />
                </label>
              </div>

              <SearchableSelect
                label="Took the Place Of (optional)"
                value={activeEntry.precedingCharacterId || "-"}
                options={charOptions.filter((o) => o.id !== activeEntry.characterId)}
                onChange={(v: string) => handleChange("precedingCharacterId", v === "-" ? "" : v)}
              />

              <Checkbox
                checked={!!activeEntry.published}
                onChange={(checked) => handleChange("published", checked)}
                label="Published (visible on the public site)"
              />

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={labelTextStyle}>Oath (optional)</span>
                <textarea value={activeEntry.oath || ""} onChange={(e) => handleChange("oath", e.target.value)} className="custom-scroll" style={{ ...inputStyle, minHeight: "120px", resize: "vertical", lineHeight: "1.6" }} />
              </label>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "var(--gold)" }}>Deeds of Note</h3>
                  <button onClick={addDeed} style={{ background: "transparent", color: "var(--gold)", border: "1px solid var(--gold)", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontFamily: "inherit" }}>+ Add Deed</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {(activeEntry.deeds || []).map((deed: any, idx: number) => (
                    <div key={idx} style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "15px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                        <span style={{ opacity: 0.7, fontSize: "0.9rem" }}>Deed #{idx + 1}</span>
                        <button onClick={() => removeDeed(idx)} style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 5px" }}>Remove</button>
                      </div>
                      <input value={deed.date || ""} onChange={(e) => updateDeed(idx, "date", e.target.value)} placeholder="Date (e.g. 99 AC)" style={{ ...inputStyle, width: "100%", marginBottom: "10px" }} />
                      <textarea value={deed.description || ""} onChange={(e) => updateDeed(idx, "description", e.target.value)} className="custom-scroll" placeholder="What happened..." style={{ ...inputStyle, width: "100%", minHeight: "70px", resize: "vertical" }} />
                    </div>
                  ))}
                  {(activeEntry.deeds || []).length === 0 && <div style={{ opacity: 0.5, fontStyle: "italic" }}>No deeds recorded yet.</div>}
                </div>
              </div>

              <hr style={{ borderColor: "rgba(255,255,255,0.1)", margin: "10px 0" }} />

              <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={labelTextStyle}>Editor Notes <span style={{ opacity: 0.6, textTransform: "none" }}>(not shown publicly)</span></span>
                <textarea value={activeEntry.notes || ""} onChange={(e) => handleChange("notes", e.target.value)} className="custom-scroll" style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
              </label>

              <div style={{ height: "40px" }} />
            </div>
          </>
        ) : (
          <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "1.2rem", padding: "40px" }}>
            &larr; Select an entry from the list, or click &quot;+ Add New&quot; to create one.
          </div>
        )}
      </div>

      {showAddModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: "var(--surface, #1a1a1a)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", padding: "24px", width: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ margin: 0 }}>Add New Entry</h3>
            <SearchableSelect
              label="Character"
              placeholder="Choose a character..."
              value={pendingNewCharId || "-"}
              options={[{ id: "-", name: "Choose..." }, ...unassignedCharOptions]}
              onChange={(v: string) => setPendingNewCharId(v === "-" ? null : v)}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => { setShowAddModal(false); setPendingNewCharId(null); }} style={{ background: "transparent", color: "inherit", border: "1px solid rgba(255,255,255,0.2)", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddNewEntry} style={{ background: "var(--gold)", color: "#1a1a1a", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && activeEntry && (
        <ConfirmModal
          title="Delete Entry"
          message={`Are you sure you want to delete the entry for "${getDisplayName(activeEntry)}"?\n\nThis cannot be undone once you Publish.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteEntry}
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

// ─────────────────────────────────────────────────────────────────────────
// Page shell: tab switcher, matching AdminMapPage exactly
// ─────────────────────────────────────────────────────────────────────────

export default function AdminRecordsPage() {
  const [tab, setTab] = useState<"scrolls" | "book-of-brothers">("scrolls");

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
        <button
          onClick={() => setTab("scrolls")}
          style={{
            padding: "10px 18px", borderRadius: "6px", cursor: "pointer", border: "1px solid",
            background: tab === "scrolls" ? "var(--gold)" : "transparent",
            color: tab === "scrolls" ? "#000" : "var(--text)",
            borderColor: tab === "scrolls" ? "var(--gold)" : "rgba(255,255,255,0.2)",
            fontWeight: tab === "scrolls" ? "bold" : "normal",
          }}
        >
          Scrolls
        </button>
        <button
          onClick={() => setTab("book-of-brothers")}
          style={{
            padding: "10px 18px", borderRadius: "6px", cursor: "pointer", border: "1px solid",
            background: tab === "book-of-brothers" ? "var(--gold)" : "transparent",
            color: tab === "book-of-brothers" ? "#000" : "var(--text)",
            borderColor: tab === "book-of-brothers" ? "var(--gold)" : "rgba(255,255,255,0.2)",
            fontWeight: tab === "book-of-brothers" ? "bold" : "normal",
          }}
        >
          The Book of Brothers
        </button>
      </div>

      {tab === "scrolls" ? <ScrollsTab /> : <BookOfBrothersTab />}
    </div>
  );
}