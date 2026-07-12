// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\layout.tsx
"use client";

import charactersData from "@/data/characters/characters.json";
import quotesData from "@/data/quotes.json";
import housesData from "@/data/houses.json";
import worldDateData from "@/data/worldDate.json";
import scrollsData from "@/data/scrolls.json";
import bookOfBrothersData from "@/data/bookOfBrothers.json";
import dragonsData from "@/data/dragons.json";
import timelineData from "@/data/timeline.json";
import mapLocationsData from "@/data/map/locations.json";
import characterPositionsData from "@/data/map/character-positions.json";
import galleryData from "@/data/gallery.json";
import { ConfirmModal } from "./_components/Modal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  collectAllPendingDrafts,
  clearAllDrafts,
  getPendingDraftStatus,
} from "@/lib/adminDrafts";

const ADMIN_NAV_ITEMS = [
  { label: "Chapters", href: "/admin/chapters" },
  { label: "Characters", href: "/admin/characters" },
  { label: "Dragons", href: "/admin/dragons" },
  { label: "Family Tree", href: "/admin/family-tree" },
  { label: "Houses", href: "/admin/houses" },
  { label: "Map", href: "/admin/map" },
  { label: "Raven's Eye", href: "/admin/ravens-eye" },
  { label: "Timeline", href: "/admin/timeline" },
  { label: "Scrolls", href: "/admin/scrolls" },
  { label: "Book of Brothers", href: "/admin/book-of-brothers" },
  { label: "Tools", href: "/admin/tools" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDraftTooltip, setShowDraftTooltip] = useState(false);

  const [status, setStatus] = useState({
    characters: false,
    quotes: false,
    houses: false,
    worldDate: false,
    scrolls: false,
    bookOfBrothers: false,
    dragons: false,
    timeline: false,
    mapLocations: false,
    characterPositions: false,
    chapters: false,
    gallery: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const refreshStatus = () => setStatus(getPendingDraftStatus());

  useEffect(() => {
    refreshStatus();
    window.addEventListener("admin:draft-updated", refreshStatus);
    window.addEventListener("storage", refreshStatus);
    return () => {
      window.removeEventListener("admin:draft-updated", refreshStatus);
      window.removeEventListener("storage", refreshStatus);
    };
  }, []);

  const hasAnyDraft = Object.values(status).some(Boolean);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePublishAll = async () => {
    setIsSaving(true);
    try {
      const pending = collectAllPendingDrafts();
      const res = await fetch("/api/admin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pending),
      });
      const data = await res.json();
      if (data.success) {
        clearAllDrafts();
        showNotification("Published! Site will update in ~1 minute.", "success");
        setTimeout(() => window.location.reload(), 800);
      } else {
        showNotification("Error: " + (data.message || "unknown"), "error");
      }
    } catch {
      showNotification("A system error occurred while publishing.", "error");
    }
    setIsSaving(false);
  };

  const handleDiscardAll = () => setShowDiscardConfirm(true);

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    clearAllDrafts();
    showNotification("All drafts discarded.", "success");
    setTimeout(() => window.location.reload(), 500);
  };

  type DraftStatus = {
    characters: boolean; quotes: boolean; houses: boolean; worldDate: boolean;
    scrolls: boolean; bookOfBrothers: boolean; dragons: boolean;
    timeline: boolean; mapLocations: boolean; characterPositions: boolean;
    chapters: boolean; gallery: boolean;
  };

  function DraftTooltip({ currentStatus }: { currentStatus: DraftStatus }) {
    const sections = useMemo(() => {
      const pending = collectAllPendingDrafts();
      const result: { section: string; items: { name: string; fields: string[] }[] }[] = [];

      const diffById = (
        original: { id: string; [k: string]: unknown }[],
        draft: { id: string; [k: string]: unknown }[],
        labelOf: (item: any) => string
      ) => {
        const changed: { name: string; fields: string[] }[] = [];
        draft.forEach((dItem) => {
          const orig = original.find((o) => o.id === dItem.id);
          if (!orig) { changed.push({ name: labelOf(dItem), fields: ["new"] }); return; }
          const diffFields = Object.keys(dItem).filter(
            (k) => JSON.stringify(dItem[k]) !== JSON.stringify(orig[k])
          );
          if (diffFields.length > 0) changed.push({ name: labelOf(dItem), fields: diffFields });
        });
        return changed;
      };

      if (currentStatus.characters && Array.isArray(pending.characters)) {
        const changed = diffById(charactersData as any[], pending.characters as any[], (c) => c.name ?? c.id);
        if (changed.length > 0) result.push({ section: "Characters", items: changed });
      }

      if (currentStatus.houses && Array.isArray(pending.houses)) {
        const changed = diffById(housesData as any[], pending.houses as any[], (h) => h.name ?? h.id);
        if (changed.length > 0) result.push({ section: "Houses", items: changed });
      }

      if (currentStatus.quotes && Array.isArray(pending.quotes)) {
        const changed = diffById(quotesData as any[], pending.quotes as any[], (q) => `"${(q.text ?? "").slice(0, 32)}…"`);
        if (changed.length > 0) result.push({ section: "Quotes", items: changed });
      }

      if (currentStatus.scrolls && Array.isArray(pending.scrolls)) {
        const changed = diffById(scrollsData as any[], pending.scrolls as any[], (s) => s.title || s.id);
        if (changed.length > 0) result.push({ section: "Scrolls", items: changed });
      }

      if (currentStatus.bookOfBrothers && Array.isArray(pending.bookOfBrothers)) {
        const changed = diffById(bookOfBrothersData as any[], pending.bookOfBrothers as any[], (e) => e.manualName || e.characterId || e.id);
        if (changed.length > 0) result.push({ section: "Book of Brothers", items: changed });
      }

      if (currentStatus.dragons && Array.isArray(pending.dragons)) {
        const changed = diffById(dragonsData as any[], pending.dragons as any[], (d) => d.name || d.id);
        if (changed.length > 0) result.push({ section: "Dragons", items: changed });
      }

      if (currentStatus.timeline && Array.isArray(pending.timeline)) {
        const original = timelineData as { chapterSlug: string; chapterTitle?: string; [k: string]: unknown }[];
        const draft = pending.timeline as typeof original;
        const changed: { name: string; fields: string[] }[] = [];
        draft.forEach((dChapter) => {
          const orig = original.find((o) => o.chapterSlug === dChapter.chapterSlug);
          const label = dChapter.chapterTitle || dChapter.chapterSlug;
          if (!orig) { changed.push({ name: label, fields: ["new"] }); return; }
          const diffFields = Object.keys(dChapter).filter(
            (k) => JSON.stringify(dChapter[k as keyof typeof dChapter]) !== JSON.stringify(orig[k as keyof typeof orig])
          );
          if (diffFields.length > 0) changed.push({ name: label, fields: diffFields });
        });
        if (changed.length > 0) result.push({ section: "Timeline", items: changed });
      }

      if (currentStatus.mapLocations && Array.isArray(pending.mapLocations)) {
        const original = mapLocationsData as { name: string; [k: string]: unknown }[];
        const draft = pending.mapLocations as typeof original;
        const changed: { name: string; fields: string[] }[] = [];
        draft.forEach((dLoc) => {
          const orig = original.find((o) => o.name === dLoc.name);
          if (!orig) { changed.push({ name: dLoc.name, fields: ["new"] }); return; }
          const diffFields = Object.keys(dLoc).filter(
            (k) => JSON.stringify(dLoc[k as keyof typeof dLoc]) !== JSON.stringify(orig[k as keyof typeof orig])
          );
          if (diffFields.length > 0) changed.push({ name: dLoc.name, fields: diffFields });
        });
        if (changed.length > 0) result.push({ section: "Map", items: changed });
      }

      if (currentStatus.characterPositions && pending.characterPositions) {
        const original = characterPositionsData as Record<string, Record<string, unknown>>;
        const draft = pending.characterPositions as Record<string, Record<string, unknown>>;
        const changed: { name: string; fields: string[] }[] = [];
        Object.keys(draft).forEach((chapterSlug) => {
          const origChapter = original[chapterSlug] || {};
          const draftChapter = draft[chapterSlug] || {};
          const diffChars = Object.keys(draftChapter).filter(
            (charId) => JSON.stringify(draftChapter[charId]) !== JSON.stringify(origChapter[charId])
          );
          if (diffChars.length > 0) changed.push({ name: chapterSlug, fields: diffChars });
        });
        if (changed.length > 0) result.push({ section: "Character Positions", items: changed });
      }

      if (currentStatus.worldDate && pending.worldDate) {
        const original = worldDateData as Record<string, unknown>;
        const draft = pending.worldDate as Record<string, unknown>;
        const diffFields = Object.keys(draft).filter(
          (k) => JSON.stringify(draft[k]) !== JSON.stringify(original[k])
        );
        if (diffFields.length > 0) result.push({ section: "Calendar", items: [{ name: "Current Date", fields: diffFields }] });
      }

      if (currentStatus.gallery && Array.isArray(pending.gallery)) {
        const changed = diffById(galleryData as any[], pending.gallery as any[], (e) =>
          e.caption ? `"${(e.caption as string).slice(0, 32)}…"` : e.id
        );
        if (changed.length > 0) result.push({ section: "Raven's Eye", items: changed });
      }

      return result;
    }, [currentStatus]);

    if (sections.length === 0) return null;

    return (
      <div
        className="custom-scroll dropdown-enter"
        style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(12, 10, 6, 0.97)",
          border: "1px solid rgba(194, 162, 39, 0.25)",
          borderRadius: "8px",
          padding: "14px 16px",
          minWidth: "280px",
          maxWidth: "360px",
          maxHeight: "400px",
          overflowY: "auto",
          boxShadow: "0 12px 32px rgba(0,0,0,0.75)",
          zIndex: 500,
          pointerEvents: "none",
        }}
      >
        {sections.map(({ section, items }: { section: string; items: { name: string; fields: string[] }[] }, sIdx: number) => (
          <div key={section} style={{ marginBottom: sIdx < sections.length - 1 ? "14px" : 0 }}>
            <div style={{
              fontSize: "0.68rem",
              color: "var(--gold)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginBottom: "8px",
              opacity: 0.85,
            }}>
              {section}
            </div>
            {items.map((item: { name: string; fields: string[] }) => (
              <div key={item.name} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: "10px",
                padding: "4px 0",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ color: "#e8e0d0", fontSize: "0.82rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "160px" }}>
                  {item.name}
                </span>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", textAlign: "right", flexShrink: 0 }}>
                  {item.fields.join(", ")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--text)" }}>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "16px 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          background: "var(--background)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          position: "sticky",
          top: 0,
          zIndex: 200,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/admin"
          style={{
            fontWeight: "bold",
            color: "var(--gold)",
            marginRight: "24px",
            fontSize: "1.1rem",
            letterSpacing: "1px",
            textDecoration: "none",
          }}
        >
          Admin Panel
        </Link>

        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                color: isActive ? "#fff" : "var(--text)",
                background: isActive ? "var(--gold)" : "transparent",
                fontWeight: isActive ? "bold" : "normal",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          );
        })}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          {hasAnyDraft && (
            <>
              <span
                style={{ fontSize: "0.85rem", opacity: 0.85, position: "relative", cursor: "default" }}
                onMouseEnter={() => setShowDraftTooltip(true)}
                onMouseLeave={() => setShowDraftTooltip(false)}
              >
                ⚠ Unpublished: {
                  [
                    status.chapters && "Chapters",
                    status.houses && "Houses",
                    status.characters && "Characters",
                    status.quotes && "Quotes",
                    status.worldDate && "Calendar",
                    status.scrolls && "Scrolls",
                    status.bookOfBrothers && "Book of Brothers",
                    status.dragons && "Dragons",
                    status.timeline && "Timeline",
                    status.mapLocations && "Map",
                    status.characterPositions && "Character Positions",
                    status.gallery && "Raven's Eye",
                  ]
                    .filter(Boolean)
                    .join(", ")
                }
                {showDraftTooltip && <DraftTooltip currentStatus={status} />}
              </span>
              <button
                onClick={handleDiscardAll}
                style={{ background: "transparent", color: "#ff4c4c", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: "0.85rem" }}
              >
                Discard all
              </button>
            </>
          )}
          <button
            onClick={handlePublishAll}
            disabled={isSaving || !hasAnyDraft}
            style={{
              padding: "10px 20px",
              background: hasAnyDraft ? "#B22222" : "rgba(255,255,255,0.1)",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: isSaving || !hasAnyDraft ? "not-allowed" : "pointer",
              fontWeight: "bold",
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "1px",
              opacity: isSaving ? 0.7 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {isSaving ? "Publishing..." : "Publish All Changes"}
          </button>
        </div>
      </nav>

      {children}

      {notification && (
        <div style={{ position: "fixed", bottom: "30px", right: "30px", background: notification.type === "success" ? "rgba(30, 80, 40, 0.95)" : "rgba(139, 0, 0, 0.95)", color: "#fff", padding: "16px 24px", borderRadius: "6px", border: `1px solid ${notification.type === "success" ? "#2e8b57" : "#ff4c4c"}`, boxShadow: "0 8px 24px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", gap: "12px", zIndex: 1000, fontSize: "1rem", fontWeight: "bold", backdropFilter: "blur(4px)" }}>
          <span style={{ fontSize: "1.2rem" }}>{notification.type === "success" ? "✓" : "⚠"}</span>
          {notification.message}
        </div>
      )}
      {showDiscardConfirm && (
        <ConfirmModal
          title="Discard All Changes?"
          message="Are you sure you want to discard all unpublished changes across every admin page and reset to the live version?"
          confirmLabel="Discard All"
          danger
          onConfirm={confirmDiscard}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
    </div>
  );
}
