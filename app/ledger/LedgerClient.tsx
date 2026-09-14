"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MiniPortrait from "@/components/MiniPortrait";
import { getCharacters } from "@/lib/characters";
import { getAllChapters } from "@/data/chapters";
import { createClient } from "@/lib/supabase/client";
import type { LedgerChecklistItem, PrivateLedgerEntry } from "@/lib/supabase/database.types";
import styles from "./ledger.module.css";

type Filter = "open" | "settled" | "all";
type SaveState = "idle" | "saving" | "saved" | "error";
type PickerKind = "character" | "chapter";
type PickerState = { entryId: string; kind: PickerKind } | null;
type EntryPatch = Partial<Pick<PrivateLedgerEntry, "heading" | "matter" | "checklist" | "pinned" | "status" | "archived" | "character_ids" | "chapter_slug">>;

const characters = getCharacters().slice().sort((a, b) => a.name.localeCompare(b.name));
const chapters = getAllChapters().slice();

function Icon({ name, className }: { name: "search" | "plus" | "archive" | "star" | "chevron" | "check" | "close" | "up" | "down" | "pin" | "flame" | "book"; className?: string }) {
  const common = { className, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  if (name === "search") return <svg {...common}><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "archive") return <svg {...common}><path d="M4 7.5h16M6 7.5V20h12V7.5M8 4h8l2 3.5H6L8 4Z"/><path d="M9.5 12h5"/></svg>;
  if (name === "star") return <svg {...common}><path d="M12 3.5c.7 4.8 3.7 7.8 8.5 8.5-4.8.7-7.8 3.7-8.5 8.5-.7-4.8-3.7-7.8-8.5-8.5 4.8-.7 7.8-3.7 8.5-8.5Z"/></svg>;
  if (name === "chevron") return <svg {...common}><path d="m8 10 4 4 4-4"/></svg>;
  if (name === "check") return <svg {...common}><path d="m6.5 12.5 3.2 3.2 7.8-8"/></svg>;
  if (name === "close") return <svg {...common}><path d="m7 7 10 10M17 7 7 17"/></svg>;
  if (name === "up") return <svg {...common}><path d="m7 14 5-5 5 5"/></svg>;
  if (name === "down") return <svg {...common}><path d="m7 10 5 5 5-5"/></svg>;
  if (name === "pin") return <svg {...common}><path d="M8 4h8l-1.4 5 2.4 2.4v1.1H7v-1.1L9.4 9 8 4Z"/><path d="M12 12.5V21"/></svg>;
  if (name === "flame") return <svg {...common}><path d="M13.5 3.5c.6 3-1.8 4.3-1 6.6.5 1.4 1.8 1.9 2.7 1.1.6-.6.7-1.5.4-2.5 2.5 1.8 3.8 4 3.2 6.6-.7 3.1-3.3 5.2-6.7 5.2-3.8 0-6.8-2.4-6.8-6 0-2.7 1.5-5 4.3-7.2-.2 2 .4 3 1.5 3.2 1.3.2 2.5-1 2.1-2.8-.3-1.5-.6-2.6.3-4.2Z"/></svg>;
  return <svg {...common}><path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v11.5H8.5A3.5 3.5 0 0 0 5 23V4.5Z"/><path d="M8.5 7.5H16M8.5 11H16M8.5 14.5H13.5"/></svg>;
}

function age(value: string) {
  const delta = Math.max(0, Date.now() - Date.parse(value));
  const minute = 60_000, hour = 60 * minute, day = 24 * hour;
  if (delta < minute) return "just now";
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value));
}

function normalizeChecklist(value: unknown): LedgerChecklistItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.text !== "string") return [];
    return [{ id: row.id, text: row.text, done: Boolean(row.done) }];
  });
}

function normalizeEntry(row: PrivateLedgerEntry): PrivateLedgerEntry {
  return { ...row, checklist: normalizeChecklist(row.checklist), character_ids: Array.isArray(row.character_ids) ? row.character_ids.filter((id): id is string => typeof id === "string") : [] };
}

export default function LedgerClient({ userId, username }: { userId: string; username: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [entries, setEntries] = useState<PrivateLedgerEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("open");
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<PickerState>(null);
  const [deleteTarget, setDeleteTarget] = useState<PrivateLedgerEntry | null>(null);
  const saveTimers = useRef(new Map<string, number>());

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    const { data, error } = await supabase.from("private_ledger_entries").select("*").eq("user_id", userId).order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (error) setMessage("The ledger could not be opened. Make certain the ledger migration has been applied.");
    else setEntries((data ?? []).map((row) => normalizeEntry(row)));
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => { void load(); return () => { for (const timer of saveTimers.current.values()) window.clearTimeout(timer); }; }, [load]);
  useEffect(() => {
    if (!picker && !deleteTarget) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setPicker(null); setDeleteTarget(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picker, deleteTarget]);

  function localPatch(id: string, patch: EntryPatch) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch, updated_at: new Date().toISOString() } : entry));
    scheduleSave(id, patch);
  }

  function scheduleSave(id: string, patch: EntryPatch) {
    const previous = saveTimers.current.get(id); if (previous) window.clearTimeout(previous);
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      saveTimers.current.delete(id);
      const { error } = await supabase.from("private_ledger_entries").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId);
      if (error) { setSaveState("error"); setMessage("A change could not be sealed. Your words remain on this screen; try again before leaving."); }
      else { setSaveState("saved"); window.setTimeout(() => setSaveState("idle"), 1500); }
    }, 650);
    saveTimers.current.set(id, timer);
  }

  async function newEntry() {
    if (creating) return;
    setCreating(true); setMessage("");
    const draft = { user_id: userId, heading: "Untitled entry", matter: "", checklist: [], pinned: false, status: "open" as const, archived: false, character_ids: [], chapter_slug: null };
    const { data, error } = await supabase.from("private_ledger_entries").insert(draft).select("*").single();
    if (error || !data) setMessage("A new page could not be added to the ledger.");
    else { const entry = normalizeEntry(data); setEntries((current) => [entry, ...current]); setExpandedId(entry.id); setFilter("open"); setArchived(false); }
    setCreating(false);
  }

  function addMatter(entry: PrivateLedgerEntry) { localPatch(entry.id, { checklist: [...entry.checklist, { id: crypto.randomUUID(), text: "", done: false }] }); }
  function patchMatter(entry: PrivateLedgerEntry, itemId: string, patch: Partial<LedgerChecklistItem>) { localPatch(entry.id, { checklist: entry.checklist.map((item) => item.id === itemId ? { ...item, ...patch } : item) }); }
  function removeMatter(entry: PrivateLedgerEntry, itemId: string) { localPatch(entry.id, { checklist: entry.checklist.filter((item) => item.id !== itemId) }); }
  function moveMatter(entry: PrivateLedgerEntry, from: number, to: number) {
    if (to < 0 || to >= entry.checklist.length || from === to) return;
    const next = entry.checklist.slice(); const [item] = next.splice(from, 1); next.splice(to, 0, item); localPatch(entry.id, { checklist: next });
  }
  function dropMatter(entry: PrivateLedgerEntry, fromId: string, toId: string) {
    const from = entry.checklist.findIndex((item) => item.id === fromId), to = entry.checklist.findIndex((item) => item.id === toId); moveMatter(entry, from, to);
  }

  async function burnEntry(entry: PrivateLedgerEntry) {
    const { error } = await supabase.from("private_ledger_entries").delete().eq("id", entry.id).eq("user_id", userId);
    if (error) setMessage("The page resisted the flame. Try again.");
    else { setEntries((current) => current.filter((item) => item.id !== entry.id)); if (expandedId === entry.id) setExpandedId(null); }
    setDeleteTarget(null);
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      if (entry.archived !== archived) return false;
      if (!archived && filter !== "all" && entry.status !== filter) return false;
      if (!needle) return true;
      const charNames = entry.character_ids.map((id) => characters.find((char) => char.id === id)?.name ?? id).join(" ");
      const chapter = chapters.find((item) => item.slug === entry.chapter_slug)?.title ?? "";
      return [entry.heading, entry.matter, ...entry.checklist.map((item) => item.text), charNames, chapter].join(" ").toLocaleLowerCase().includes(needle);
    }).sort((a, b) => Number(b.pinned) - Number(a.pinned) || Date.parse(b.updated_at) - Date.parse(a.updated_at));
  }, [entries, filter, archived, query]);

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div>
        <span className={styles.eyebrow}>For your eyes alone</span>
        <h1>My Ledger</h1>
        <p>A private record of loose ends, settled matters, and plans best kept from the realm.</p>
      </div>
      <div className={styles.headerActions}><span className={`${styles.saveState} ${saveState === "error" ? styles.saveError : ""}`}>{saveState === "saving" ? "Sealing changes…" : saveState === "saved" ? "Changes sealed" : saveState === "error" ? "Seal failed" : "Private to your account"}</span><Link href={`/users/${username}`}>Your profile</Link></div>
    </header>

    <section className={styles.toolbar} aria-label="Ledger tools">
      <label className={styles.search}><Icon name="search"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the ledger…" /></label>
      <button className={styles.newEntryDesktop} type="button" onClick={() => void newEntry()} disabled={creating}><Icon name="plus"/>New Entry</button>
    </section>

    <div className={styles.filters}>
      <div className={styles.segmented} role="tablist" aria-label="Ledger status">
        {(["open", "settled", "all"] as Filter[]).map((value) => <button key={value} type="button" aria-selected={!archived && filter === value} onClick={() => { setArchived(false); setFilter(value); }}>{value === "open" ? "Open" : value === "settled" ? "Settled" : "All"}</button>)}
      </div>
      <button className={`${styles.archiveFilter} ${archived ? styles.archiveActive : ""}`} type="button" onClick={() => setArchived((value) => !value)}><Icon name="archive"/>{archived ? "Leave the Archive" : "The Archive"}</button>
    </div>

    {message && <p className={styles.message} role="status">{message}</p>}
    {loading && <div className={styles.empty}><Icon name="star"/><p>Opening the private ledger…</p></div>}
    {!loading && !visible.length && <div className={styles.empty}><Icon name="star"/><h2>{archived ? "The archive is quiet" : filter === "settled" ? "Nothing settled yet" : "No matters await you"}</h2><p>{query ? "No entry answers that search." : "Add an entry when the realm gives you something worth remembering."}</p></div>}

    <section className={styles.entryList} aria-label="Ledger entries">
      {visible.map((entry) => {
        const done = entry.checklist.filter((item) => item.done).length;
        const expanded = expandedId === entry.id;
        const linkedCharacters = entry.character_ids.map((id) => characters.find((char) => char.id === id)).filter(Boolean);
        const linkedChapter = chapters.find((chapter) => chapter.slug === entry.chapter_slug);
        const characterPickerOpen = picker?.entryId === entry.id && picker.kind === "character";
        const chapterPickerOpen = picker?.entryId === entry.id && picker.kind === "chapter";
        return <article className={`${styles.entry} ${entry.pinned ? styles.pinned : ""} ${entry.status === "settled" ? styles.settled : ""}`} key={entry.id}>
          <button type="button" className={styles.entrySummary} onClick={() => { setExpandedId(expanded ? null : entry.id); setPicker(null); }} aria-expanded={expanded}>
            <span className={styles.entryMain}><span className={styles.entryMeta}>{entry.pinned && <b>Pinned</b>}{entry.status === "settled" && <b>Settled</b>}{entry.archived && <b>Archived</b>}<small>Last amended {age(entry.updated_at)}</small></span><strong>{entry.heading || "Untitled entry"}</strong>{entry.matter && <span className={styles.matterPreview}>{entry.matter}</span>}<span className={styles.progress}>{entry.checklist.length ? `${done} of ${entry.checklist.length} settled` : "No listed matters"}</span></span>
            <span className={styles.summarySide}>{linkedCharacters.slice(0, 4).map((char) => char && <MiniPortrait key={char.id} id={char.id} alt={char.name} size={30} />)}{linkedCharacters.length > 4 && <i>+{linkedCharacters.length - 4}</i>}<span className={`${styles.summaryChevron} ${expanded ? styles.summaryChevronOpen : ""}`}><Icon name="chevron"/></span></span>
          </button>

          {expanded && <div className={styles.editor}>
            <div className={styles.fields}>
              <label><span>Heading</span><input value={entry.heading} onChange={(e) => localPatch(entry.id, { heading: e.target.value })} maxLength={140}/></label>
              <label><span>Matter</span><textarea value={entry.matter} onChange={(e) => localPatch(entry.id, { matter: e.target.value })} rows={4} maxLength={4000} placeholder="Set down what must not be forgotten…"/></label>
            </div>

            <section className={styles.matters}>
              <div className={styles.sectionTitle}><div><span>Matters</span><small>{entry.checklist.length ? `${done} settled · ${entry.checklist.length - done} remain` : "No matters listed"}</small></div><button type="button" onClick={() => addMatter(entry)}><Icon name="plus"/>Add a matter</button></div>
              <ol>{entry.checklist.map((item, index) => <li key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/ledger-matter", item.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const from = e.dataTransfer.getData("text/ledger-matter"); if (from) dropMatter(entry, from, item.id); }} className={item.done ? styles.matterDone : ""}>
                <button className={styles.check} type="button" aria-label={item.done ? "Reopen matter" : "Settle matter"} aria-pressed={item.done} onClick={() => patchMatter(entry, item.id, { done: !item.done })}>{item.done && <Icon name="check"/>}</button>
                <input value={item.text} onChange={(e) => patchMatter(entry, item.id, { text: e.target.value })} placeholder="A matter yet unresolved…"/>
                <span className={styles.reorder}><button type="button" onClick={() => moveMatter(entry, index, index - 1)} disabled={index === 0} aria-label="Move matter up"><Icon name="up"/></button><button type="button" onClick={() => moveMatter(entry, index, index + 1)} disabled={index === entry.checklist.length - 1} aria-label="Move matter down"><Icon name="down"/></button></span>
                <button className={styles.removeMatter} type="button" onClick={() => removeMatter(entry, item.id)} aria-label="Remove matter"><Icon name="close"/></button>
              </li>)}</ol>
            </section>

            <section className={styles.linksPanel}>
              <div className={styles.linkColumn}>
                <span className={styles.fieldLabel}>Names bound to this entry</span>
                <div className={styles.customSelect} data-open={characterPickerOpen || undefined}>
                  <button type="button" className={styles.selectButton} onClick={() => setPicker(characterPickerOpen ? null : { entryId: entry.id, kind: "character" })} aria-expanded={characterPickerOpen}><span>Choose a character…</span><Icon name="chevron"/></button>
                  {characterPickerOpen && <div className={styles.selectMenu} role="listbox">{characters.filter((char) => !entry.character_ids.includes(char.id)).map((char) => <button type="button" role="option" aria-selected="false" key={char.id} onClick={() => { localPatch(entry.id, { character_ids: [...entry.character_ids, char.id] }); setPicker(null); }}><MiniPortrait id={char.id} alt={char.name} size={26}/><span>{char.name}</span></button>)}</div>}
                </div>
                <div className={styles.characterChips}>{linkedCharacters.map((char) => char && <button key={char.id} type="button" onClick={() => localPatch(entry.id, { character_ids: entry.character_ids.filter((id) => id !== char.id) })} title={`Remove ${char.name}`}><MiniPortrait id={char.id} alt={char.name} size={30}/><span>{char.name}</span><Icon name="close"/></button>)}</div>
              </div>

              <div className={styles.chapterField}>
                <span className={styles.fieldLabel}>Bound chapter</span>
                <div className={styles.customSelect} data-open={chapterPickerOpen || undefined}>
                  <button type="button" className={styles.selectButton} onClick={() => setPicker(chapterPickerOpen ? null : { entryId: entry.id, kind: "chapter" })} aria-expanded={chapterPickerOpen}><span>{linkedChapter?.title ?? "No chapter bound"}</span><Icon name="chevron"/></button>
                  {chapterPickerOpen && <div className={styles.selectMenu} role="listbox"><button type="button" role="option" aria-selected={!entry.chapter_slug} onClick={() => { localPatch(entry.id, { chapter_slug: null }); setPicker(null); }}><Icon name="book"/><span>No chapter bound</span></button>{chapters.map((chapter) => <button type="button" role="option" aria-selected={chapter.slug === entry.chapter_slug} key={chapter.slug} onClick={() => { localPatch(entry.id, { chapter_slug: chapter.slug }); setPicker(null); }}><Icon name="book"/><span>{chapter.title}</span></button>)}</div>}
                </div>
                {linkedChapter && <small>{linkedChapter.synopsis}</small>}
              </div>
            </section>

            <footer className={styles.entryActions}>
              <button type="button" className={entry.pinned ? styles.actionActive : ""} onClick={() => localPatch(entry.id, { pinned: !entry.pinned })}><Icon name="pin"/>{entry.pinned ? "Unpin" : "Pin"}</button>
              <button type="button" className={entry.status === "settled" ? styles.actionActive : ""} onClick={() => localPatch(entry.id, { status: entry.status === "settled" ? "open" : "settled" })}><Icon name="check"/>{entry.status === "settled" ? "Reopen entry" : "Settle entry"}</button>
              <button type="button" onClick={() => localPatch(entry.id, { archived: !entry.archived })}><Icon name="archive"/>{entry.archived ? "Restore" : "Archive"}</button>
              <button type="button" className={styles.burn} onClick={() => setDeleteTarget(entry)}><Icon name="flame"/>Burn entry</button>
            </footer>
          </div>}
        </article>;
      })}
    </section>

    <button className={styles.sealButton} type="button" onClick={() => void newEntry()} disabled={creating} aria-label="New Entry"><Icon name="plus"/><small>New Entry</small></button>

    {deleteTarget && <div className={styles.modalBackdrop} role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="burn-entry-title"><div className={styles.modalIcon}><Icon name="flame"/></div><span className={styles.modalEyebrow}>A final measure</span><h2 id="burn-entry-title">Burn this entry?</h2><p>“{deleteTarget.heading || "Untitled entry"}” will be removed from your private ledger for good.</p><div className={styles.modalActions}><button type="button" onClick={() => setDeleteTarget(null)}>Keep the page</button><button type="button" className={styles.modalDanger} onClick={() => void burnEntry(deleteTarget)}><Icon name="flame"/>Burn it</button></div></section></div>}
  </main>;
}
