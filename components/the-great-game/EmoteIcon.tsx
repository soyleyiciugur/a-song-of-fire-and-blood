import type { GreatGameEmoteId } from "@/lib/the-great-game/emotes";

/** Vector counterparts of the motifs painted on the wooden emote staves. */
export default function EmoteIcon({ id }: { id: GreatGameEmoteId }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {id === "thanks" && <path fill="currentColor" stroke="none" d="M16 28 4 16C-4 6 9-1 16 8 23-1 36 6 28 16Z" />}
      {id === "wow" && <path fill="currentColor" d="m16 2 3 9 7-5-5 8 9 2-9 3 5 7-8-5-2 9-3-9-7 5 5-8-9-2 9-3-5-7 8 5Z" />}
      {id === "greetings" && <path d="M9 17V8a2 2 0 0 1 4 0v7-10a2 2 0 0 1 4 0v10-9a2 2 0 0 1 4 0v10-6a2 2 0 0 1 4 0v11c0 6-3 9-8 9-4 0-6-2-8-5l-5-7c-2-3 1-5 3-3l5 5" />}
      {id === "well-played" && <><path d="m15 27-7-7-4-9c-1-3 2-4 3-1l3 5-1-10c0-3 3-3 4 0l2 8 1-10c0-2 3-2 3 1v9l3-7c1-2 4-1 3 2l-3 10 3-3c2-2 4 0 2 2l-7 11Z" /><path d="m4 24 4 5M2 20l2 2M25 2l1 3M29 6l-2 2" /></>}
      {(id === "oops" || id === "threaten") && <><circle cx="16" cy="16" r="13" /><circle cx="11" cy="13" r="1.5" fill="currentColor" /><circle cx="21" cy="13" r="1.5" fill="currentColor" /><path d="M10 23q6-9 12 0" />{id === "threaten" && <path strokeWidth="2.5" d="m7 8 7 3m11-3-7 3" />}</>}
      {id === "salt" && <g transform="rotate(25 16 16)"><path d="M10 10h12l2 17q-8 5-16 0Zm0 0V6q6-6 12 0v4M13 14l-1 10m5-10v11m3-11 1 10" /><path d="M13 6h.1M17 5h.1M20 7h.1" strokeWidth="2.5" /></g>}
    </svg>
  );
}
