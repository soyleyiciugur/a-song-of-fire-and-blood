// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\map\page.tsx
"use client";

import { useState, useEffect } from "react";
import locationsData from "../../../data/map/locations.json";
import positionsData from "../../../data/map/character-positions.json";
import charactersData from "../../../data/characters/characters.json";
import { getAllChapters } from "@/data/chapters";
import { PromptModal, ConfirmModal } from "../_components/Modal";
import { SearchableSelect } from "../_components/SearchableSelect";


const locationValueToText = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v.join(", ") : v || "";

const textToLocationValue = (text: string): string | string[] => {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return "";
  return parts.length === 1 ? parts[0] : parts;
};

function LocationsTab() {
  const [locations, setLocations] = useState<any[]>(locationsData as any[]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [listSearch, setListSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem("draft-mapLocations");
    if (draft) {
      try {
        setLocations(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-mapLocations", JSON.stringify(locations));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [locations]);

  const filtered = locations
    .map((loc, originalIndex) => ({ ...loc, originalIndex }))
    .filter((loc) => loc.name.toLowerCase().includes(listSearch.toLowerCase()));

  const activeLocation = locations[selectedIndex];

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChange = (field: string, value: any) => {
    const updated = [...locations];
    updated[selectedIndex] = { ...activeLocation, [field]: value };
    setLocations(updated);
  };

  const handleAddNewLocation = (name: string) => {
    if (!name || !name.trim()) {
      setShowAddModal(false);
      return;
    }
    if (locations.some((l) => l.name.toLowerCase() === name.trim().toLowerCase())) {
      showNotification("A location with this name already exists.", "error");
      return;
    }
    const newLocation = { name: name.trim(), xPct: 50, yPct: 50 };
    const updated = [...locations, newLocation];
    setLocations(updated);
    setSelectedIndex(updated.length - 1);
    setShowAddModal(false);
  };

  const handleDeleteLocation = () => {
    if (locations.length <= 1) {
      showNotification("You must have at least one location.", "error");
      return;
    }
    const updated = locations.filter((_, i) => i !== selectedIndex);
    setLocations(updated);
    setSelectedIndex(0);
    setShowDeleteModal(false);
    showNotification("Location removed from draft.", "success");
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <div style={{ width: "300px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "15px" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Locations</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>
        <input
          placeholder="Search locations..."
          value={listSearch}
          onChange={(e) => setListSearch(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
        />
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px", maxHeight: "65vh", overflowY: "auto" }}>
          {filtered.map((loc) => {
            const isSelected = loc.originalIndex === selectedIndex;
            return (
              <li key={loc.name}>
                <button
                  onClick={() => setSelectedIndex(loc.originalIndex)}
                  style={{
                    width: "100%", padding: "10px 14px", textAlign: "left",
                    background: isSelected ? "var(--gold)" : "rgba(0, 0, 0, 0.2)",
                    color: isSelected ? "#000" : "inherit", border: "1px solid",
                    borderColor: isSelected ? "var(--gold)" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px", cursor: "pointer",
                    fontWeight: isSelected ? "bold" : "normal", fontSize: "0.9rem", transition: "all 0.2s",
                  }}
                >
                  {loc.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {activeLocation && (
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", marginBottom: "24px" }}>
            <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{activeLocation.name}</h1>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Delete Location
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "500px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Name</span>
              <input value={activeLocation.name} onChange={(e) => handleChange("name", e.target.value)} style={{ padding: "12px" }} />
            </label>

            <div style={{ display: "flex", gap: "20px" }}>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>X % (left–right)</span>
                <input type="number" step="0.01" value={activeLocation.xPct} onChange={(e) => handleChange("xPct", parseFloat(e.target.value) || 0)} style={{ padding: "12px" }} />
              </label>
              <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Y % (top–bottom)</span>
                <input type="number" step="0.01" value={activeLocation.yPct} onChange={(e) => handleChange("yPct", parseFloat(e.target.value) || 0)} style={{ padding: "12px" }} />
              </label>
            </div>

            <p style={{ fontSize: "0.85rem", opacity: 0.6, lineHeight: 1.5 }}>
              Coordinates are percentages of the natural width/height of <code>/public/images/map/known-world.webp</code>.
            </p>
          </div>
        </div>
      )}

      {showAddModal && (
        <PromptModal title="Add New Location" placeholder="Location name" onConfirm={handleAddNewLocation} onCancel={() => setShowAddModal(false)} />
      )}
      {showDeleteModal && activeLocation && (
        <ConfirmModal
          title="Delete Location"
          message={`Are you sure you want to delete "${activeLocation.name}"?\n\nThis cannot be undone once you Publish.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteLocation}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 1000, fontWeight: "bold" }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

function PositionsTab() {
  const chapters = getAllChapters();
  const [positions, setPositions] = useState<Record<string, Record<string, string | string[]>>>(positionsData as any);
  const [selectedSlug, setSelectedSlug] = useState(chapters[0]?.slug ?? "");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem("draft-characterPositions");
    if (draft) {
      try {
        setPositions(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-characterPositions", JSON.stringify(positions));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [positions]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const chapterPositions = positions[selectedSlug] || {};
  const characterOptions = (charactersData as any[]).map((c) => ({ id: c.id, name: c.name }));
  const usedCharIds = Object.keys(chapterPositions);
  const availableOptions = characterOptions.filter((o) => !usedCharIds.includes(o.id));

  const setCharPosition = (charId: string, value: string | string[]) => {
    setPositions((prev) => ({
      ...prev,
      [selectedSlug]: { ...(prev[selectedSlug] || {}), [charId]: value },
    }));
  };

  const removeCharFromChapter = (charId: string) => {
    setPositions((prev) => {
      const chapterEntry = { ...(prev[selectedSlug] || {}) };
      delete chapterEntry[charId];
      return { ...prev, [selectedSlug]: chapterEntry };
    });
    showNotification("Character removed from this chapter's positions.", "success");
  };

  const addCharToChapter = (charId: string) => {
    setCharPosition(charId, "King's Landing");
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <div style={{ width: "280px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem" }}>
        <h2 style={{ margin: "0 0 15px", fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Chapters</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
          {chapters.map((chapter) => {
            const isSelected = chapter.slug === selectedSlug;
            const count = Object.keys(positions[chapter.slug] || {}).length;
            return (
              <li key={chapter.slug}>
                <button
                  onClick={() => setSelectedSlug(chapter.slug)}
                  style={{
                    width: "100%", padding: "10px 14px", textAlign: "left",
                    background: isSelected ? "var(--gold)" : "rgba(0, 0, 0, 0.2)",
                    color: isSelected ? "#000" : "inherit", border: "1px solid",
                    borderColor: isSelected ? "var(--gold)" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px", cursor: "pointer",
                    fontWeight: isSelected ? "bold" : "normal", fontSize: "0.85rem", transition: "all 0.2s",
                  }}
                >
                  {chapter.title}
                  <div style={{ fontSize: "0.7rem", opacity: 0.7, marginTop: "4px" }}>{count} characters placed</div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "15px" }}>
          <h1 style={{ margin: 0, fontSize: "1.3rem" }}>{chapters.find((c) => c.slug === selectedSlug)?.title}</h1>
          <div style={{ width: "260px" }}>
            <SearchableSelect placeholder="+ Add character..." options={availableOptions} onChange={addCharToChapter} />
          </div>
        </div>

        <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "20px", lineHeight: 1.5 }}>
          Enter one location, or multiple comma-separated locations if the character travels during this chapter
          (e.g. <code>Sunspear, Starfall, King's Landing</code>).
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {usedCharIds.map((charId) => {
            const char = (charactersData as any[]).find((c) => c.id === charId);
            return (
              <div key={charId} style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", padding: "10px 14px" }}>
                <div style={{ width: "160px", fontWeight: "bold", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {char?.name || charId}
                </div>
                <input
                  value={locationValueToText(chapterPositions[charId])}
                  onChange={(e) => setCharPosition(charId, textToLocationValue(e.target.value))}
                  placeholder="Location(s)"
                  style={{ flex: 1, padding: "8px 10px" }}
                />
                <button
                  onClick={() => removeCharFromChapter(charId)}
                  style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem", flexShrink: 0 }}
                >
                  Remove
                </button>
              </div>
            );
          })}
          {usedCharIds.length === 0 && (
            <div style={{ opacity: 0.5, fontStyle: "italic", textAlign: "center", padding: "20px" }}>
              No characters placed for this chapter yet.
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", zIndex: 1000, fontWeight: "bold" }}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default function AdminMapPage() {
  const [tab, setTab] = useState<"locations" | "positions">("locations");

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
        <button
          onClick={() => setTab("locations")}
          style={{
            padding: "10px 18px", borderRadius: "6px", cursor: "pointer", border: "1px solid",
            background: tab === "locations" ? "var(--gold)" : "transparent",
            color: tab === "locations" ? "#000" : "var(--text)",
            borderColor: tab === "locations" ? "var(--gold)" : "rgba(255,255,255,0.2)",
            fontWeight: tab === "locations" ? "bold" : "normal",
          }}
        >
          Locations
        </button>
        <button
          onClick={() => setTab("positions")}
          style={{
            padding: "10px 18px", borderRadius: "6px", cursor: "pointer", border: "1px solid",
            background: tab === "positions" ? "var(--gold)" : "transparent",
            color: tab === "positions" ? "#000" : "var(--text)",
            borderColor: tab === "positions" ? "var(--gold)" : "rgba(255,255,255,0.2)",
            fontWeight: tab === "positions" ? "bold" : "normal",
          }}
        >
          Character Positions
        </button>
      </div>

      {tab === "locations" ? <LocationsTab /> : <PositionsTab />}
    </div>
  );
}