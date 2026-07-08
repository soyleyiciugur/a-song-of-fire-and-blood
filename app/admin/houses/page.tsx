"use client";

import { useState } from "react";
import housesData from "../../../data/houses.json";

export default function AdminHousesPage() {
  const [houses, setHouses] = useState(housesData);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const activeHouse = houses[selectedIndex];

  const handleChange = (field: string, value: string) => {
    const updatedHouses = [...houses];
    updatedHouses[selectedIndex] = { ...activeHouse, [field]: value };
    setHouses(updatedHouses);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(houses),
      });
      const data = await res.json();
      if (data.success) {
        showNotification("Houses saved successfully!", "success");
      } else {
        showNotification("Error: " + data.message, "error");
      }
    } catch (error) {
      showNotification("A system error occurred while saving.", "error");
    }
    setIsSaving(false);
  };

  // Arkaplan rengine göre yazının siyah mı beyaz mı olacağını hesaplayan zeka
  const getContrastText = (hex: string) => {
    if (!hex) return "#ffffff";
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      
      {/* Left Side: House List */}
      <div style={{ width: "300px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem" }}>
        <h2 style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "20px", marginTop: 0 }}>
          Houses
        </h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {houses.map((house, index) => {
            const isSelected = index === selectedIndex;
            return (
              <li key={house.id}>
                <button
                  onClick={() => setSelectedIndex(index)}
                  style={{
                    width: "100%", 
                    padding: "12px 15px", 
                    textAlign: "left",
                    background: isSelected ? house.color : "rgba(0, 0, 0, 0.2)",
                    color: isSelected ? getContrastText(house.color) : "inherit",
                    border: "1px solid",
                    borderColor: isSelected ? house.color : "rgba(255, 255, 255, 0.1)", 
                    borderRadius: "6px", 
                    cursor: "pointer", 
                    fontWeight: isSelected ? "bold" : "normal",
                    transition: "all 0.2s"
                  }}
                >
                  {house.name}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right Side: Edit Form */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px" }}>
          {activeHouse.sigilSrc && (
            <img src={activeHouse.sigilSrc} alt={activeHouse.name} style={{ width: "50px", height: "auto" }} />
          )}
          <h1 style={{ margin: 0 }}>Edit {activeHouse.name}</h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>ID (Not recommended to change)</span>
            <input value={activeHouse.id} readOnly style={{ padding: "12px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "4px" }} />
          </label>
          
          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>House Name</span>
            <input value={activeHouse.name} onChange={(e) => handleChange("name", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>House Words</span>
            <input value={activeHouse.words} onChange={(e) => handleChange("words", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }} />
          </label>

          <div style={{ display: "flex", gap: "20px" }}>
            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Seat</span>
              <input value={activeHouse.seat} onChange={(e) => handleChange("seat", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }} />
            </label>

            <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>House Color</span>
              <div style={{ display: "flex", gap: "10px", alignItems: "center", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "4px" }}>
                <input type="color" value={activeHouse.color} onChange={(e) => handleChange("color", e.target.value)} style={{ width: "30px", height: "30px", cursor: "pointer", border: "none", background: "transparent", padding: 0 }} />
                <span>{activeHouse.color}</span>
              </div>
            </label>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Sigil Image URL</span>
            <input value={activeHouse.sigilSrc} onChange={(e) => handleChange("sigilSrc", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }} />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Description</span>
            <textarea value={activeHouse.description} onChange={(e) => handleChange("description", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "150px", fontFamily: "inherit", resize: "vertical", lineHeight: "1.5", outline: "none" }} />
          </label>

          <button onClick={handleSave} disabled={isSaving} style={{ padding: "16px", background: "#B22222", color: "#fff", border: "none", borderRadius: "4px", cursor: isSaving ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "16px", marginTop: "10px", textTransform: "uppercase", letterSpacing: "2px", opacity: isSaving ? 0.7 : 1 }}>
            {isSaving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
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