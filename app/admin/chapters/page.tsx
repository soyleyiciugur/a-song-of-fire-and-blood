// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\chapters\page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import chaptersData from "../../../data/chapters.json";
import { PromptModal, ConfirmModal } from "../_components/Modal";

// Dosyanın üstüne, component'lerin yanına ekle

const CHAPTER_IMAGE_PREFIX = "/images/chapters/";

function ImagePathInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const filename = value.startsWith(CHAPTER_IMAGE_PREFIX)
    ? value.slice(CHAPTER_IMAGE_PREFIX.length)
    : value.replace(/^\/images\/chapters\//, "");

  return (
    <div style={{
      display: "flex", alignItems: "center",
      border: "1px solid rgba(255,255,255,0.2)", borderRadius: "4px",
      background: "rgba(0,0,0,0.2)", overflow: "hidden",
    }}>
      <span style={{ padding: "0 0 0 12px", opacity: 0.6, fontSize: "0.85rem", whiteSpace: "nowrap" }}>
        {CHAPTER_IMAGE_PREFIX}
      </span>
      <input
        value={filename}
        onChange={(e) => onChange(`${CHAPTER_IMAGE_PREFIX}${e.target.value}`)}
        placeholder="example.webp"
        style={{ padding: "12px", background: "transparent", border: "none", color: "inherit", outline: "none", flex: 1 }}
      />
    </div>
  );
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/^chapter\s+[ivxlcdm]+\s*:\s*/i, "") // strip a leading "Chapter I: " style prefix
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

type Chapter = {
  slug: string;
  title: string;
  synopsis: string;
  image: string;
  content: string[];
};

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>(chaptersData as Chapter[]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem("draft-chapters");
    if (draft) {
      try {
        setChapters(JSON.parse(draft));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("draft-chapters", JSON.stringify(chapters));
    window.dispatchEvent(new Event("admin:draft-updated"));
  }, [chapters]);

  const activeChapter = chapters[selectedIndex];

  const handleChange = (field: keyof Chapter, value: any) => {
    const updated = [...chapters];
    updated[selectedIndex] = { ...activeChapter, [field]: value };
    setChapters(updated);
  };

  const handleContentChange = (raw: string) => {
    // One paragraph per line in the textarea; blank lines are dropped.
    const paragraphs = raw.split("\n").map((p) => p.trim()).filter(Boolean);
    handleChange("content", paragraphs);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddNewChapter = (title: string) => {
    if (!title || !title.trim()) {
      setShowAddModal(false);
      return;
    }
    const slug = slugify(title);
    if (chapters.some((c) => c.slug === slug)) {
      showNotification("A chapter with this title/slug already exists.", "error");
      return;
    }
    const newChapter: Chapter = {
      slug,
      title: title.trim(),
      synopsis: "",
      image: "",
      content: [],
    };
    const updated = [...chapters, newChapter];
    setChapters(updated);
    setSelectedIndex(updated.length - 1);
    setShowAddModal(false);
  };

  const handleDeleteChapter = () => {
    if (chapters.length <= 1) {
      showNotification("You must have at least one chapter.", "error");
      return;
    }
    const updated = chapters.filter((_, i) => i !== selectedIndex);
    setChapters(updated);
    setSelectedIndex(0);
    setShowDeleteModal(false);
    showNotification("Chapter removed from draft.", "success");
  };

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "2rem", maxWidth: "1200px", margin: "0 auto", position: "relative" }}>
      {/* Left: Chapter List */}
      <div style={{ width: "300px", borderRight: "1px solid rgba(255, 255, 255, 0.1)", paddingRight: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", paddingBottom: "10px", marginBottom: "20px" }}>
          <h2 style={{ margin: 0 }}>Chapters</h2>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: "0.85rem", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", padding: "6px 10px", borderRadius: "4px", cursor: "pointer" }}
          >
            + Add New
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
          {chapters.map((chapter, index) => {
            const isSelected = index === selectedIndex;
            const isEmpty = !chapter.content || chapter.content.length === 0;
            return (
              <li key={chapter.slug}>
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
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{chapter.title}</span>
                  {isEmpty && <span style={{ fontSize: "0.7rem", opacity: 0.7 }} title="No content yet">✎</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Right: Edit Form */}
      {activeChapter && (
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "15px", marginBottom: "30px" }}>
            <Link
              href={`/chapters/${activeChapter.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View public chapter"
              style={{ display: "flex", alignItems: "center", gap: "15px", textDecoration: "none", color: "inherit", cursor: "pointer" }}
            >
              <h1 style={{ margin: 0 }}>{activeChapter.title}</h1>
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{ background: "transparent", color: "#ff4c4c", border: "1px solid #ff4c4c", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Delete Chapter
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "700px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Slug</span>
              <input value={activeChapter.slug} readOnly style={{ padding: "12px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", borderRadius: "4px" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Title</span>
              <input value={activeChapter.title} onChange={(e) => handleChange("title", e.target.value)} style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", outline: "none" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Synopsis</span>
              <textarea
                value={activeChapter.synopsis}
                onChange={(e) => handleChange("synopsis", e.target.value)}
                style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "80px", fontFamily: "inherit", resize: "vertical", lineHeight: "1.5", outline: "none" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>Image Path</span>
              <ImagePathInput value={activeChapter.image} onChange={(v) => handleChange("image", v)} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "0.9rem", opacity: 0.8, textTransform: "uppercase", letterSpacing: "1px" }}>
                Content ({activeChapter.content?.length || 0} paragraphs — one per line)
              </span>
              <textarea
                value={(activeChapter.content || []).join("\n")}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="One paragraph per line..."
                style={{ padding: "12px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.2)", color: "inherit", borderRadius: "4px", minHeight: "400px", fontFamily: "inherit", resize: "vertical", lineHeight: "1.6", outline: "none" }}
              />
            </label>
          </div>
        </div>
      )}

      {showAddModal && (
        <PromptModal
          title="Add New Chapter"
          placeholder="Chapter title (e.g. Chapter VIII: The Long Night)"
          onConfirm={handleAddNewChapter}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {showDeleteModal && activeChapter && (
        <ConfirmModal
          title="Delete Chapter"
          message={`Are you sure you want to delete "${activeChapter.title}"?\n\nThis cannot be undone once you Publish.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteChapter}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "12px", zIndex: 1000, fontSize: "1rem", fontWeight: "bold", backdropFilter: "blur(4px)" }}>
          <span style={{ fontSize: "1.2rem" }}>{notification.type === "success" ? "✓" : "⚠"}</span>
          {notification.message}
        </div>
      )}

      {/* Bottom spacer so the last card doesn't sit flush against the
          viewport edge when scrolled all the way down. */}
      <div style={{ height: "1100px" }} />
    </div>
  );
}