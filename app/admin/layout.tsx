"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Yeni bir admin sayfası eklemek istediğinde SADECE bu listeye
// bir satır eklemen yeterli — menüde otomatik görünür.
const ADMIN_NAV_ITEMS = [
  { label: "Characters", href: "/admin/characters" },
  { label: "Houses", href: "/admin/houses" },
  // { label: "Quotes", href: "/admin/quotes" },      // örnek: ileride eklenirse
  // { label: "Locations", href: "/admin/locations" }, // örnek: ileride eklenirse
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", color: "var(--text)" }}>
      {/* Üst Navigasyon */}
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
        <span
          style={{
            fontWeight: "bold",
            color: "var(--gold)",
            marginRight: "24px",
            fontSize: "1.1rem",
            letterSpacing: "1px",
          }}
        >
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
      </nav>

      {/* Aktif Admin Sayfası Burada Render Olur */}
      {children}
    </div>
  );
}