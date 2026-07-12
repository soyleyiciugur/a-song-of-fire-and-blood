// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="container">
        <div className="card card-padding" style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1 style={{ marginTop: 0, color: "var(--gold)" }}>Page not found</h1>
          <p style={{ marginTop: 5, color: "var(--muted)", lineHeight: 2 }}>
            The page you asked for does not exist in this chronicle.
          </p>
          <Link
            href="/"
            className="button"
            style={{ display: "inline-flex", marginTop: 5 }}
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
