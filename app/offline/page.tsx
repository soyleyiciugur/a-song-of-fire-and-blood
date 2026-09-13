import Link from "next/link";

export default function OfflinePage() {
  return (
    <main style={{ minHeight: "70dvh", display: "grid", placeItems: "center", padding: "32px 20px", textAlign: "center" }}>
      <section style={{ maxWidth: 560 }}>
        <p style={{ color: "var(--gold)", fontFamily: "var(--font-hotd)", letterSpacing: ".08em", textTransform: "uppercase" }}>The ravens cannot fly</p>
        <h1 style={{ fontFamily: "var(--font-hotd)", fontSize: "clamp(2rem,8vw,4rem)", margin: "8px 0 16px" }}>You are offline</h1>
        <p style={{ opacity: .78, lineHeight: 1.7 }}>Reconnect to the realm to load live messages, community activity, and uncached pages.</p>
        <Link href="/" style={{ display: "inline-block", marginTop: 20 }}>Return to the Chronicle</Link>
      </section>
    </main>
  );
}
