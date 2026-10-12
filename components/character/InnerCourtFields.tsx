"use client";

import { useState } from "react";
import { getCharacters } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";
import styles from "@/app/characters/[id]/thoughts/innerCourt.module.css";

const characters = getCharacters().slice().sort((a, b) => a.name.localeCompare(b.name));
export function CourtCheck({ checked, onChange, children, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode; disabled?: boolean }) {
  return <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} className={styles.check} onClick={() => onChange(!checked)}><span aria-hidden="true" className={styles.checkMark}>{checked ? "✓" : ""}</span><span>{children}</span></button>;
}
export function PrivacyFields({ isPrivate, hideFromGm, onChange, gm = false, disabled = false }: { isPrivate: boolean; hideFromGm: boolean; onChange: (privateValue: boolean, hidden: boolean) => void; gm?: boolean; disabled?: boolean }) {
  return <div className={styles.privacyFields}><CourtCheck checked={isPrivate} disabled={gm || disabled} onChange={(v) => onChange(v, v && hideFromGm)}>This is a private thought</CourtCheck>{isPrivate && !gm && <CourtCheck checked={hideFromGm} disabled={disabled} onChange={(v) => onChange(true, v)}>Hide from GM as well</CourtCheck>}<small>{gm ? "Your GM working record is private." : !isPrivate ? "Visible to readers within their chapter boundary." : hideFromGm ? "Only you can read this thought." : "Only you and GM HRRM can read this thought."}</small></div>;
}
export function CharacterPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const matches = characters.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  return <div className={styles.characterPicker} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}><span>Related characters</span><button type="button" className={styles.pickerTrigger} aria-expanded={open} onClick={() => setOpen(!open)}>Choose characters <span aria-hidden="true">⌄</span></button>{open && <div className={styles.pickerPanel}><input autoFocus type="search" aria-label="Search all characters" placeholder="Search all characters…" value={query} onChange={(e) => setQuery(e.target.value)} /><div className={styles.pickerOptions}>{matches.map((c) => <button type="button" aria-pressed={selected.includes(c.id)} key={c.id} onClick={() => onChange(selected.includes(c.id) ? selected.filter((id) => id !== c.id) : [...selected, c.id])}><MiniPortrait id={c.id} alt="" size={26}/><span>{c.name}<small className={styles.pickerIdentity}>{c.title}</small></span><span aria-hidden="true">{selected.includes(c.id) ? "✓" : "+"}</span></button>)}{!matches.length && <p>No matching characters.</p>}</div></div>}<div className={styles.characterChips}>{selected.map((id) => <button key={id} type="button" onClick={() => onChange(selected.filter((v) => v !== id))} aria-label={`Remove ${characters.find((c) => c.id === id)?.name ?? id}`}>{characters.find((c) => c.id === id)?.name ?? id}<span aria-hidden="true"> ×</span></button>)}</div></div>;
}
