"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  collectAllPendingDrafts,
  clearAllDrafts,
  getPendingDraftStatus,
} from "@/lib/adminDrafts";

const ADMIN_NAV_ITEMS = [
  { label: "Characters", href: "/admin/characters" },
  { label: "Houses", href: "/admin/houses" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [status, setStatus] = useState({ characters: false, quotes: false, houses: false });
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

  const hasAnyDraft = status.characters || status.quotes || status.houses;

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

  const handleDiscardAll = () => {
    if (!confirm("Discard ALL unpublished changes across every admin page and reset to the live version?")) return;
    clearAllDrafts();
    showNotification("All drafts discarded.", "success");
    setTimeout(() => window.location.reload(), 500);
  };

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
              <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                ⚠ Unpublished:
                {status.houses && " Houses"}
                {status.characters && " Characters"}
                {status.quotes && " Quotes"}
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
    </div>
  );
}