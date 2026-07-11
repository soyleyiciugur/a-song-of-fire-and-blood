"use client";

import charactersData from "@/data/characters/characters.json";
import quotesData from "@/data/quotes.json";
import housesData from "@/data/houses.json";
import worldDateData from "@/data/worldDate.json";
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
  { label: "Characters", href: "/admin/characters" },
  { label: "Houses", href: "/admin/houses" },
  { label: "Tools", href: "/admin/tools" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showDraftTooltip, setShowDraftTooltip] = useState(false);
  const [status, setStatus] = useState({ characters: false, quotes: false, houses: false, worldDate: false });
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const refreshStatus = () => setStatus(getPendingDraftStatus());

  useEffect(() => {
    refreshStatus();
    // Aynı sekmede sayfalar draft yazınca bu event'i tetikliyor (bkz. lib/adminDrafts.ts)
    window.addEventListener("admin:draft-updated", refreshStatus);
    // Yedek: farklı sekmelerden gelen değişiklikler için
    window.addEventListener("storage", refreshStatus);
    return () => {
      window.removeEventListener("admin:draft-updated", refreshStatus);
      window.removeEventListener("storage", refreshStatus);
    };
  }, []);

  const hasAnyDraft = status.characters || status.quotes || status.houses || status.worldDate;

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
        // Tüm sayfaların local state'i temiz orijinal veriden başlasın diye reload
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

  type DraftStatus = { characters: boolean; quotes: boolean; houses: boolean; worldDate: boolean };

  function DraftTooltip({ currentStatus }: { currentStatus: DraftStatus }) {
    const sections = useMemo(() => {
      const pending = collectAllPendingDrafts();
      const result: { section: string; items: { name: string; fields: string[] }[] }[] = [];

      // Characters
      if (currentStatus.characters && Array.isArray(pending.characters)) {
        const original = charactersData as { id: string; name?: string; [k: string]: unknown }[];
        const draft = pending.characters as typeof original;
        const changed: { name: string; fields: string[] }[] = [];

        draft.forEach((dChar) => {
          const orig = original.find((o) => o.id === dChar.id);
          if (!orig) { changed.push({ name: dChar.name ?? dChar.id, fields: ["new"] }); return; }
          const diffFields = Object.keys(dChar).filter(
            (k) => JSON.stringify(dChar[k as keyof typeof dChar]) !== JSON.stringify(orig[k as keyof typeof orig])
          );
          if (diffFields.length > 0) changed.push({ name: dChar.name ?? dChar.id, fields: diffFields });
        });

        if (changed.length > 0) result.push({ section: "Characters", items: changed });
      }

      // Houses
      if (currentStatus.houses && Array.isArray(pending.houses)) {
        const original = housesData as { id: string; name?: string; [k: string]: unknown }[];
        const draft = pending.houses as typeof original;
        const changed: { name: string; fields: string[] }[] = [];

        draft.forEach((dHouse) => {
          const orig = original.find((o) => o.id === dHouse.id);
          if (!orig) { changed.push({ name: dHouse.name ?? dHouse.id, fields: ["new"] }); return; }
          const diffFields = Object.keys(dHouse).filter(
            (k) => JSON.stringify(dHouse[k as keyof typeof dHouse]) !== JSON.stringify(orig[k as keyof typeof orig])
          );
          if (diffFields.length > 0) changed.push({ name: dHouse.name ?? dHouse.id, fields: diffFields });
        });

        if (changed.length > 0) result.push({ section: "Houses", items: changed });
      }

      // Quotes
      if (currentStatus.quotes && Array.isArray(pending.quotes)) {
        // "as unknown" eklenerek tip çakışması hatası (2352) çözüldü.
        const original = quotesData as unknown as { id: string; text?: string; [k: string]: unknown }[];
        const draft = pending.quotes as unknown as typeof original;
        const changed: { name: string; fields: string[] }[] = [];

        draft.forEach((dQuote) => {
          const orig = original.find((o) => o.id === dQuote.id);
          const label = (dQuote.text as string | undefined)?.slice(0, 32) ?? dQuote.id;
          if (!orig) { changed.push({ name: `"${label}…"`, fields: ["new"] }); return; }
          const diffFields = Object.keys(dQuote).filter(
            (k) => JSON.stringify(dQuote[k as keyof typeof dQuote]) !== JSON.stringify(orig[k as keyof typeof orig])
          );
          if (diffFields.length > 0) changed.push({ name: `"${label}…"`, fields: diffFields });
        });

        if (changed.length > 0) result.push({ section: "Quotes", items: changed });
      }

      // World Date (Tools > Calendar)
      if (currentStatus.worldDate && pending.worldDate) {
        const original = worldDateData as Record<string, unknown>;
        const draft = pending.worldDate as Record<string, unknown>;
        const diffFields = Object.keys(draft).filter(
          (k) => JSON.stringify(draft[k]) !== JSON.stringify(original[k])
        );
        if (diffFields.length > 0) result.push({ section: "Calendar", items: [{ name: "Current Date", fields: diffFields }] });
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
            {/* Section header */}
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
        }}
      >
        <span style={{ fontWeight: "bold", color: "var(--gold)", marginRight: "24px", fontSize: "1.1rem", letterSpacing: "1px" }}>
          Admin Panel
        </span>

        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                textDecoration: "none",
                color: isActive ? "#fff" : "var(--text)",
                background: isActive ? "var(--gold)" : "transparent",
                fontWeight: isActive ? "bold" : "normal",
                transition: "all 0.2s",
              }}
            >
              {item.label}
            </Link>
          );
        })}

        {/* Global Publish Barı — her sayfada aynı, tüm draftları kapsar */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          {hasAnyDraft && (
            <>
              <span
              style={{ fontSize: "0.85rem", opacity: 0.85, position: "relative", cursor: "default" }}
              onMouseEnter={() => setShowDraftTooltip(true)}
              onMouseLeave={() => setShowDraftTooltip(false)}
            >
                ⚠ Unpublished:
                {status.houses && " Houses"}
                {status.characters && " Characters"}
                {status.quotes && " Quotes"}
                {status.worldDate && " Calendar"}
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
