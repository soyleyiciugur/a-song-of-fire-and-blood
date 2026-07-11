import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <h1 style={{ color: "var(--gold)", marginBottom: "16px" }}>Welcome to the Admin Panel</h1>
      <p style={{ opacity: 0.7, marginBottom: "32px" }}>
        Select a section to start editing.
      </p>
      <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
        <Link
          href="/admin/characters"
          style={{
            padding: "12px 24px",
            background: "var(--gold)",
            color: "#000000",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Characters
        </Link>
        <Link
          href="/admin/houses"
          style={{
            padding: "12px 24px",
            background: "var(--gold)",
            color: "var(--background)",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Houses
        </Link>
        <Link
          href="/admin/tools"
          style={{
            padding: "12px 24px",
            background: "var(--gold)",
            color: "var(--background)",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Tools
        </Link>
      </div>
    </div>
  );
}