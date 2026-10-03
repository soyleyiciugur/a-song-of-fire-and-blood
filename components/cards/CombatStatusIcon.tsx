// Shared by Chronicle and combat previews.
export default function CombatStatusIcon({ kind }: { kind: "death" | "grounded" }) {
  const grounded = kind === "grounded";
  return <svg viewBox={`0 0 ${grounded ? 32 : 24} 24`} width={grounded ? "1.3em" : "1em"} height="1em"
    fill="currentColor" aria-hidden="true" focusable="false" data-combat-status={kind} style={{ verticalAlign: "-.12em", overflow: "visible" }}>
    {grounded ? <text x="16" y="12" textAnchor="middle" dominantBaseline="central" fontSize="22" fontFamily="inherit">☾ᶻ</text>
      : <path fillRule="evenodd" d="M12 2a9 9 0 0 0-9 9c0 3.3 1.8 5.4 5 6v4h3v-3h2v3h3v-4c3.2-.6 5-2.7 5-6a9 9 0 0 0-9-9ZM6 10a2.4 2.4 0 1 0 4.8 0A2.4 2.4 0 0 0 6 10Zm7.2 0a2.4 2.4 0 1 0 4.8 0 2.4 2.4 0 0 0-4.8 0ZM12 12.8 10.5 16h3Z" />}
  </svg>;
}
