// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\admin\page.tsx
import Link from "next/link";

const SECTIONS = [
  { href: "/admin/chapters", label: "Chapters", description: "Write and edit the chronicle, chapter by chapter." },
  { href: "/admin/characters", label: "Characters", description: "Profiles, relationships, quotes, and namedays." },
  { href: "/admin/houses", label: "Houses", description: "Sigils, words, seats, and colors." },
  { href: "/admin/dragons", label: "Dragons", description: "Riders, status, and traits." },
  { href: "/admin/family-tree", label: "Family Tree", description: "Bloodlines and unions across the realm." },
  { href: "/admin/map", label: "Map", description: "Locations and coordinates on the known world." },
  { href: "/admin/timeline", label: "Timeline", description: "Dated events across every chapter." },
  { href: "/admin/scrolls", label: "Scrolls", description: "The Citadel's archive of histories and studies." },
  { href: "/admin/book-of-brothers", label: "Book of Brothers", description: "Every knight who has worn the white cloak." },
  { href: "/admin/tools", label: "Tools", description: "Calendar, travel calculator, and name generator." },
];

const styles = `
  .admin-home-card:hover {
    transform: translateY(-2px);
    border-color: var(--gold) !important;
  }
`;

export default function AdminHomePage() {
  return (
    <div style={{ padding: "2rem 2rem", maxWidth: "1100px", margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <h1 style={{ color: "var(--gold)", marginBottom: "12px", fontSize: "2.2rem" }}>
          Welcome to the Admin Panel
        </h1>
        <p style={{ color: "var(--muted)" }}>Select a section to start editing.</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="admin-home-card"
            style={{
              display: "block",
              padding: "20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-card)",
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            }}
          >
            <div style={{ color: "var(--gold)", fontWeight: "bold", fontSize: "1.05rem", marginBottom: "8px" }}>
              {section.label}
            </div>
            <div style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5 }}>
              {section.description}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}