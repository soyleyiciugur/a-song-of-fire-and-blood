import { StatIcon } from "@/components/cards/GameCardPrimitives";
import CombatStatusIcon from "@/components/cards/CombatStatusIcon";
import type { ChronicleIconKind } from "@/lib/the-great-game/chronicle";

// Same four-point rune as CommandSigil and the navbar's Great Game card backs.
const rune = "M22 10.5 26.2 18 33.5 22l-7.3 4L22 33.5 17.8 26 10.5 22l7.3-4Z";
const sword = "M12 2 14 5v9h3v2h-4v3h1v3h-4v-3h1v-3H7v-2h3V5Z";

export default function ChronicleIcon({ kind }: { kind: ChronicleIconKind }) {
  if (kind === "death" || kind === "grounded") return <CombatStatusIcon kind={kind} />;
  if (kind === "military") return <StatIcon kind="military" />;
  if (kind === "political" || kind === "heal") return <StatIcon kind={kind === "heal" ? "health" : "political"} />;
  return <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor" aria-hidden="true" focusable="false" data-chronicle-icon={kind}>
    {kind === "played" && <path d={rune} transform="translate(12 12) scale(.82) translate(-22 -22)" />}
    {kind === "draw" && <><rect x="5.5" y="3.5" width="13" height="17" rx="1.8" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d={rune} transform="translate(12 12) scale(.4) translate(-22 -22)" /></>}
    {kind === "artifact" && <path d={sword} />}
    {kind === "buff" && <path d="M10.5 4h3v6.5H20v3h-6.5V20h-3v-6.5H4v-3h6.5Z" />}
    {kind === "debuff" && <path d="M4 10.5h16v3H4Z" />}
    {kind === "command" && <><path d="M8 2h8l6 6v8l-6 6H8l-6-6V8Z" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d={rune} transform="translate(12 12) scale(.5) translate(-22 -22)" /></>}
    {kind === "location" && <><path d="m3 12 5-2 8 2 5-2v10l-5 2-8-2-5 2Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M12 1a5 5 0 0 0-5 5c0 3.3 5 8 5 8s5-4.7 5-8a5 5 0 0 0-5-5Zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" fillRule="evenodd" /></>}
    {kind === "burned" && <path fillRule="evenodd" d="M13 1c1 5-5 5.8-3 10-2-.8-3-2.5-2.6-4.4C3 10.5 2 14 4 18c3 6 13 5.8 16-.5 2.5-5.5-1.5-8.7-3-11.5.2 3-1.2 4.5-2.3 5C17 5.5 14.5 2.6 13 1Zm-1 11c.7 3-3.2 3.5-2.4 6 .7 2.5 4.8 2.5 5.5 0 .5-2-1-3.5-3.1-6Z" />}
    {kind === "system" && <path d="m12 7 5 5-5 5-5-5Z" />}
  </svg>;
}
