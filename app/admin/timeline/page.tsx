// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\timeline\page.tsx
"use client";

import { useState, useEffect } from "react";
import timelineData from "../../../data/timeline.json";
import charactersData from "../../../data/characters/characters.json";
import { getAllChapters } from "@/data/chapters";
import { PromptModal, ConfirmModal } from "../_components/Modal";
import { SearchableSelect } from "../_components/SearchableSelect";

export default function AdminTimelinePage() {
  const [timeline, setTimeline] = useState<any[]>(timelineData as any[]);
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showDeleteEventModal, setShowDeleteEventModal] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem("draft-timeline");
    if (draft) {
      try {
        setTimeline(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-timeline", JSON.stringify(timeline));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [timeline]);

  const activeChapter = timeline[selectedChapterIdx];

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleChapterDateChange = (value: string) => {
    const updated = [...timeline];
    updated[selectedChapterIdx] = { ...activeChapter, date: value };
    setTimeline(updated);
  };

  const handleEventChange = (eventIdx: number, field: string, value: any) => {
    const updated = [...timeline];
    const events = [...updated[selectedChapterIdx].events];
    events[eventIdx] = { ...events[eventIdx], [field]: value };
    updated[selectedChapterIdx] = { ...updated[selectedChapterIdx], events };
    setTimeline(updated);
  };

  const handleAddEvent = (title: string) => {
    if (!title || !title.trim()) {
      setShowAddEventModal(false);
      return;
    }
    const updated = [...timeline];
    const events = [...updated[selectedChapterIdx].events, { title: title.trim(), date: "", description: "", characters: [] }];
    updated[selectedChapterIdx] = { ...updated[selectedChapterIdx], events };
    setTimeline(updated);
    setShowAddEventModal(false);
    showNotification("Event added.", "success");
  };

  const handleDeleteEvent = (eventIdx: number) => {
    const updated = [...timeline];
    const events = updated[selectedChapterIdx].events.filter((_: any, i: number) => i !== eventIdx);
    updated[selectedChapterIdx] = { ...updated[selectedChapterIdx], events };
    setTimeline(updated);
    setShowDeleteEventModal(null);
    showNotification("Event removed from draft.", "success");
  };

  const characterOptions = (charactersData as any[]).map((c) => ({ id: c.id, name: c.name }));

  const addCharacterToEvent = (eventIdx: number, charId: string) => {
    const current: string[] = activeChapter.events[eventIdx].characters || [];
    if (current.includes(charId)) return;
    handleEventChange(eventIdx, "characters", [...current, charId]);
  };

  const removeCharacterFromEvent = (eventIdx: number, charId: string) => {
    const current: string[] = activeChapter.events[eventIdx].characters || [];
    handleEventChange(eventIdx, "characters", current.filter((c) => c !== charId));
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      {/* Left: Chapter List */}
      <div style={{ width: "300px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem" }}>
        <h2 style={{ margin: "0 0 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px" }}>Timeline</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {timeline.map((chapter, index) => {
            const isSelected = index === selectedChapterIdx;
            return (
              <li key={chapter.chapterSlug}>
                <button
                  onClick={() => setSelectedChapterIdx(index)}
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
                    fontSize: "0.9rem",
                    transition: "all 0.2s",
                  }}
                >
                  {chapter.chapterTitle}
                  <div style={{ fontSize: "0.75rem", opacity: 0.7, marginTop: "4px" }}>{chapter.events.length} events</div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: Chapter Events Editor */}
      {activeChapter && (
        <div style={{ flex: 1, maxWidth: "750px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", marginBottom: "20px" }}>
            <h1 style={{ margin: 0 }}>{activeChapter.chapterTitle}</h1>
            <button
              onClick={() => setShowAddEventModal(true)}
              style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "8px 14px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              + Add Event
            </button>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Chapter Date Range</span>
            <input
              value={activeChapter.date || ""}
              onChange={(e) => handleChapterDateChange(e.target.value)}
              placeholder="e.g. Mid 2nd Moon, 99 AC"
              style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }}
            />
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {activeChapter.events.map((event: any, eventIdx: number) => (
              <div key={eventIdx} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
                  <input
                    value={event.title}
                    onChange={(e) => handleEventChange(eventIdx, "title", e.target.value)}
                    style={{ flex: 1, padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "var(--gold)", fontWeight: "bold", borderRadius: "4px", outline: "none" }}
                  />
                  <button
                    onClick={() => setShowDeleteEventModal(eventIdx)}
                    style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", fontSize: "0.9rem", padding: "0 5px", whiteSpace: "nowrap" }}
                  >
                    Remove
                  </button>
                </div>

                <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Date</span>
                  <input
                    value={event.date || ""}
                    onChange={(e) => handleEventChange(eventIdx, "date", e.target.value)}
                    placeholder="e.g. 16th of the 2nd Moon"
                    style={{ padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Description</span>
                  <textarea
                    value={event.description}
                    onChange={(e) => handleEventChange(eventIdx, "description", e.target.value)}
                    style={{ padding: "10px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "80px", fontFamily: "inherit", resize: "vertical", lineHeight: "1.5", outline: "none" }}
                  />
                </label>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Characters</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {(event.characters || []).map((charId: string) => {
                      const char = (charactersData as any[]).find((c) => c.id === charId);
                      return (
                        <span
                          key={charId}
                          style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(201,162,39,0.12)", border: "1px solid rgba(201,162,39,0.3)", borderRadius: "999px", padding: "4px 10px", fontSize: "0.8rem" }}
                        >
                          {char?.name || charId}
                          <button
                            onClick={() => removeCharacterFromEvent(eventIdx, charId)}
                            style={{ background: "transparent", border: "none", color: "#ff4c4c", cursor: "pointer", padding: 0, fontSize: "0.9rem", lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                  <div style={{ maxWidth: "260px" }}>
                    <SearchableSelect
                      placeholder="+ Add character..."
                      options={characterOptions.filter((o) => !(event.characters || []).includes(o.id))}
                      onChange={(v: string) => addCharacterToEvent(eventIdx, v)}
                    />
                  </div>
                </div>
              </div>
            ))}
            {activeChapter.events.length === 0 && (
              <div style={{ opacity: 0.5, fontStyle: "italic", textAlign: "center", padding: "20px" }}>No events for this chapter yet.</div>
            )}
          </div>
        </div>
      )}

      {showAddEventModal && (
        <PromptModal
          title="Add New Event"
          placeholder="Event title"
          onConfirm={handleAddEvent}
          onCancel={() => setShowAddEventModal(false)}
        />
      )}

      {showDeleteEventModal !== null && (
        <ConfirmModal
          title="Delete Event"
          message="Are you sure you want to delete this event?\n\nThis cannot be undone once you Publish."
          confirmLabel="Delete"
          onConfirm={() => handleDeleteEvent(showDeleteEventModal)}
          onCancel={() => setShowDeleteEventModal(null)}
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