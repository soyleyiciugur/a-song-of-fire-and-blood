// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\dragons\page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import dragonsData from "../../../data/dragons.json";
import charactersData from "../../../data/characters/characters.json";
import { PromptModal, ConfirmModal } from "../_components/Modal";
import { SearchableSelect } from "../_components/SearchableSelect";

// Dosyanın üstüne, component'lerin yanına ekle

const DRAGON_IMAGE_PREFIX = "/images/dragons/";

function ImagePathInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const filename = value.startsWith(DRAGON_IMAGE_PREFIX)
    ? value.slice(DRAGON_IMAGE_PREFIX.length)
    : value.replace(/^\/images\/dragons\//, "");

  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px",
      background: "rgba(0,0,0,0.2)", overflow: "hidden",
    }}>
      <span style={{ padding: "0 0 0 12px", opacity: 0.6, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
        {DRAGON_IMAGE_PREFIX}
      </span>
      <input
        value={filename}
        onChange={(e) => onChange(`${DRAGON_IMAGE_PREFIX}${e.target.value}`)}
        placeholder="example.webp"
        style={{ padding: "12px", background: "transparent", border: "none", color: "inherit", outline: "none", flex: 1 }}
      />
    </div>
  );
}

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-");

const STATUS_OPTIONS = [
  { id: "Alive", name: "Alive" },
  { id: "Dead", name: "Dead" },
];

export default function AdminDragonsPage() {
  const [dragons, setDragons] = useState<any[]>(dragonsData as any[]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem("draft-dragons");
    if (draft) {
      try {
        setDragons(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-dragons", JSON.stringify(dragons));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [dragons]);

  const activeDragon = dragons[selectedIndex];

  const characterOptions = [
    { id: "-", name: "None" },
    ...(charactersData as any[]).map((c) => ({ id: c.id, name: c.name })),
  ];

  const handleChange = (field: string, value: any) => {
    const updated = [...dragons];
    updated[selectedIndex] = { ...activeDragon, [field]: value };
    setDragons(updated);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNewDragon = (name: string) => {
    if (!name || !name.trim()) {
      setShowAddModal(false);
      return;
    }
    const id = slugify(name);
    if (dragons.some((d) => d.id === id)) {
      showNotification("A dragon with this name/ID already exists.", "error");
      return;
    }
    const newDragon = {
      id,
      name: name.trim(),
      status: "Alive",
      riderId: "",
      previousRiderId: "",
      image: "",
      traits: [],
      description: "",
    };
    const updated = [...dragons, newDragon];
    setDragons(updated);
    setSelectedIndex(updated.length - 1);
    setShowAddModal(false);
  };

  const handleDeleteDragon = () => {
    if (dragons.length <= 1) {
      showNotification("You must have at least one dragon.", "error");
      return;
    }
    const updated = dragons.filter((_, i) => i !== selectedIndex);
    setDragons(updated);
    setSelectedIndex(0);
    setShowDeleteModal(false);
    showNotification("Dragon removed from draft.", "success");
  };

  const handleTraitsChange = (raw: string) => {
    const traits = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    handleChange("traits", traits);
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      {/* Left: Dragon List */}
      <div style={{ width: "300px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>Dragons</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {dragons.map((dragon, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li key={dragon.id}>
                <button
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    width: "100%",
                    padding: "12px 15px",
                    textAlign: "left",
                    background: isSelected ? "var(--gold)" : "rgba(0, 0, 0, 0.2)",
                    color: isSelected ? "#000" : "inherit",
                    border: "1px solid",
                    borderColor: isSelected ? "var(--gold)" : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: isSelected ? "bold" : "normal",
                    transition: "all 0.2s",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>{dragon.name}</span>
                  <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{dragon.status === "Dead" ? "†" : ""}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: Edit Form */}
      {activeDragon && (
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", marginBottom: "30px" }}>
            <Link
              href={`/dragons/${activeDragon.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View public profile"
              style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none", color: "inherit", cursor: "pointer" }}
            >
              {activeDragon.image && (
                <img src={activeDragon.image} alt={activeDragon.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />
              )}
              <h1 style={{ margin: 0 }}>{activeDragon.name}</h1>
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Delete Dragon
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>ID</span>
              <input value={activeDragon.id} readOnly style={{ padding: "12px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "4px" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Name</span>
              <input value={activeDragon.name} onChange={(e) => handleChange("name", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }} />
            </label>

            <div style={{ display: "flex", gap: "20px" }}>
              <SearchableSelect label="Status" searchable={false} value={activeDragon.status} options={STATUS_OPTIONS} onChange={(v: string) => handleChange("status", v)} />
              <SearchableSelect label="Rider" value={activeDragon.riderId || "-"} options={characterOptions} onChange={(v: string) => handleChange("riderId", v === "-" ? "" : v)} />
              <SearchableSelect label="Previous Rider" value={activeDragon.previousRiderId || "-"} options={characterOptions} onChange={(v: string) => handleChange("previousRiderId", v === "-" ? "" : v)} />
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Image Path</span>
              <ImagePathInput value={activeDragon.image} onChange={(v) => handleChange("image", v)} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Traits (comma-separated)</span>
              <input
                value={(activeDragon.traits || []).join(", ")}
                onChange={(e) => handleTraitsChange(e.target.value)}
                placeholder="Ancient, Battle-Scarred, Fiercely Loyal"
                style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Description</span>
              <textarea
                value={activeDragon.description}
                onChange={(e) => handleChange("description", e.target.value)}
                style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "150px", fontFamily: "inherit", resize: "vertical", lineHeight: "1.5", outline: "none" }}
              />
            </label>
          </div>
        </div>
      )}

      {showAddModal && (
        <PromptModal
          title="Add New Dragon"
          placeholder="Dragon name"
          onConfirm={handleAddNewDragon}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showDeleteModal && activeDragon && (
        <ConfirmModal
          title="Delete Dragon"
          message={`Are you sure you want to delete "${activeDragon.name}"?\n\nThis cannot be undone once you Publish.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteDragon}
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