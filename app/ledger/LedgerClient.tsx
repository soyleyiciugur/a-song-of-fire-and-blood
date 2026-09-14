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
type EntryPatch = Partial<Pick<PrivateLedgerEntry, "heading" | "matter" | "checklist" | "pinned" | "status" | "archived" | "character_ids" | "chapter_slug">>;

const characters = getCharacters().slice().sort((a,b) => a.name.localeCompare(b.name));
const chapters = getAllChapters().slice();

function age(value: string) {
  const delta = Math.max(0, Date.now() - Date.parse(value));
  const minute = 60_000, hour = 60 * minute, day = 24 * hour;
  if (delta < minute) return "just now";
  if (delta < hour) return `${Math.floor(delta / minute)}m ago`;
  if (delta < day) return `${Math.floor(delta / hour)}h ago`;
  if (delta < 7 * day) return `${Math.floor(delta / day)}d ago`;
  return new Intl.DateTimeFormat("en-GB", { day:"numeric", month:"short" }).format(new Date(value));
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
  const [characterChoice, setCharacterChoice] = useState<Record<string,string>>({});
  const saveTimers = useRef(new Map<string, number>());

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    const { data, error } = await supabase.from("private_ledger_entries").select("*").eq("user_id", userId).order("pinned", { ascending:false }).order("updated_at", { ascending:false });
    if (error) setMessage("The ledger could not be opened. Make certain the ledger migration has been applied.");
    else setEntries((data ?? []).map((row) => normalizeEntry(row)));
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => { void load(); return () => { for (const timer of saveTimers.current.values()) window.clearTimeout(timer); }; }, [load]);

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
    const draft = { user_id:userId, heading:"Untitled entry", matter:"", checklist:[], pinned:false, status:"open" as const, archived:false, character_ids:[], chapter_slug:null };
    const { data, error } = await supabase.from("private_ledger_entries").insert(draft).select("*").single();
    if (error || !data) setMessage("A new page could not be added to the ledger.");
    else { const entry = normalizeEntry(data); setEntries((current) => [entry, ...current]); setExpandedId(entry.id); setFilter("open"); setArchived(false); }
    setCreating(false);
  }

  function addMatter(entry: PrivateLedgerEntry) {
    localPatch(entry.id, { checklist:[...entry.checklist, { id:crypto.randomUUID(), text:"", done:false }] });
  }

  function patchMatter(entry: PrivateLedgerEntry, itemId: string, patch: Partial<LedgerChecklistItem>) {
    localPatch(entry.id, { checklist:entry.checklist.map((item) => item.id === itemId ? { ...item, ...patch } : item) });
  }

  function removeMatter(entry: PrivateLedgerEntry, itemId: string) {
    localPatch(entry.id, { checklist:entry.checklist.filter((item) => item.id !== itemId) });
  }

  function moveMatter(entry: PrivateLedgerEntry, from: number, to: number) {
    if (to < 0 || to >= entry.checklist.length || from === to) return;
    const next = entry.checklist.slice(); const [item] = next.splice(from,1); next.splice(to,0,item);
    localPatch(entry.id, { checklist:next });
  }

  function dropMatter(entry: PrivateLedgerEntry, fromId: string, toId: string) {
    const from = entry.checklist.findIndex((item) => item.id === fromId), to = entry.checklist.findIndex((item) => item.id === toId);
    moveMatter(entry, from, to);
  }

  async function burnEntry(entry: PrivateLedgerEntry) {
    if (!window.confirm(`Burn “${entry.heading || "this entry"}” from your private ledger? This cannot be undone.`)) return;
    const { error } = await supabase.from("private_ledger_entries").delete().eq("id", entry.id).eq("user_id", userId);
    if (error) setMessage("The page resisted the flame. Try again.");
    else { setEntries((current) => current.filter((item) => item.id !== entry.id)); if (expandedId === entry.id) setExpandedId(null); }
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
    }).sort((a,b) => Number(b.pinned)-Number(a.pinned) || Date.parse(b.updated_at)-Date.parse(a.updated_at));
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
      <label className={styles.search}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the ledger…" /></label>
      <button className={styles.newEntryDesktop} type="button" onClick={() => void newEntry()} disabled={creating}>＋ New Entry</button>
    </section>

    <div className={styles.filters}>
      <div className={styles.segmented} role="tablist" aria-label="Ledger status">
        {(["open","settled","all"] as Filter[]).map((value) => <button key={value} type="button" aria-selected={!archived && filter===value} onClick={() => { setArchived(false); setFilter(value); }}>{value === "open" ? "Open" : value === "settled" ? "Settled" : "All"}</button>)}
      </div>
      <button className={`${styles.archiveFilter} ${archived ? styles.archiveActive : ""}`} type="button" onClick={() => setArchived((value) => !value)}><span aria-hidden="true">⌑</span>{archived ? "Leave the Archive" : "The Archive"}</button>
    </div>

    {message && <p className={styles.message} role="status">{message}</p>}
    {loading && <div className={styles.empty}><span>✦</span><p>Opening the private ledger…</p></div>}
    {!loading && !visible.length && <div className={styles.empty}><span>✦</span><h2>{archived ? "The archive is quiet" : filter === "settled" ? "Nothing settled yet" : "No matters await you"}</h2><p>{query ? "No entry answers that search." : "Add an entry when the realm gives you something worth remembering."}</p></div>}

    <section className={styles.entryList} aria-label="Ledger entries">
      {visible.map((entry) => {
        const done = entry.checklist.filter((item) => item.done).length;
        const expanded = expandedId === entry.id;
        const linkedCharacters = entry.character_ids.map((id) => characters.find((char) => char.id === id)).filter(Boolean);
        const linkedChapter = chapters.find((chapter) => chapter.slug === entry.chapter_slug);
        return <article className={`${styles.entry} ${entry.pinned ? styles.pinned : ""} ${entry.status === "settled" ? styles.settled : ""}`} key={entry.id}>
          <button type="button" className={styles.entrySummary} onClick={() => setExpandedId(expanded ? null : entry.id)} aria-expanded={expanded}>
            <span className={styles.entryMain}><span className={styles.entryMeta}>{entry.pinned && <b>PINNED</b>}{entry.status === "settled" && <b>SETTLED</b>}{entry.archived && <b>ARCHIVED</b>}<small>Last amended {age(entry.updated_at)}</small></span><strong>{entry.heading || "Untitled entry"}</strong>{entry.matter && <span className={styles.matterPreview}>{entry.matter}</span>}<span className={styles.progress}>{entry.checklist.length ? `${done} of ${entry.checklist.length} settled` : "No listed matters"}</span></span>
            <span className={styles.summarySide}>{linkedCharacters.slice(0,4).map((char) => char && <MiniPortrait key={char.id} id={char.id} alt={char.name} size={30} />)}{linkedCharacters.length > 4 && <i>+{linkedCharacters.length-4}</i>}<svg viewBox="0 0 24 24" aria-hidden="true"><path d={expanded ? "m6 15 6-6 6 6" : "m6 9 6 6 6-6"}/></svg></span>
          </button>

          {expanded && <div className={styles.editor}>
            <div className={styles.fields}>
              <label><span>Heading</span><input value={entry.heading} onChange={(e) => localPatch(entry.id,{ heading:e.target.value })} maxLength={140} /></label>
              <label><span>Matter</span><textarea value={entry.matter} onChange={(e) => localPatch(entry.id,{ matter:e.target.value })} rows={4} maxLength={4000} placeholder="Set down what must not be forgotten…" /></label>
            </div>

            <section className={styles.matters}>
              <div className={styles.sectionTitle}><div><span>Matters</span><small>{entry.checklist.length ? `${done} settled · ${entry.checklist.length-done} remain` : "No matters listed"}</small></div><button type="button" onClick={() => addMatter(entry)}>＋ Add a matter</button></div>
              <ol>{entry.checklist.map((item,index) => <li key={item.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/ledger-matter",item.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const from=e.dataTransfer.getData("text/ledger-matter"); if(from) dropMatter(entry,from,item.id); }} className={item.done ? styles.matterDone : ""}>
                <button className={styles.check} type="button" aria-label={item.done ? "Reopen matter" : "Settle matter"} aria-pressed={item.done} onClick={() => patchMatter(entry,item.id,{done:!item.done})}>{item.done ? "✓" : ""}</button>
                <input value={item.text} onChange={(e) => patchMatter(entry,item.id,{text:e.target.value})} placeholder="A matter yet unresolved…" />
                <span className={styles.reorder}><button type="button" onClick={() => moveMatter(entry,index,index-1)} disabled={index===0} aria-label="Move matter up">↑</button><button type="button" onClick={() => moveMatter(entry,index,index+1)} disabled={index===entry.checklist.length-1} aria-label="Move matter down">↓</button></span>
                <button className={styles.removeMatter} type="button" onClick={() => removeMatter(entry,item.id)} aria-label="Remove matter">×</button>
              </li>)}</ol>
            </section>

            <section className={styles.linksPanel}>
              <div className={styles.linkColumn}><span className={styles.fieldLabel}>Names bound to this entry</span><div className={styles.characterPicker}><select value={characterChoice[entry.id] ?? ""} onChange={(e) => { const id=e.target.value; setCharacterChoice((old)=>({...old,[entry.id]:""})); if(id && !entry.character_ids.includes(id)) localPatch(entry.id,{character_ids:[...entry.character_ids,id]}); }}><option value="">Choose a character…</option>{characters.filter((char)=>!entry.character_ids.includes(char.id)).map((char)=><option key={char.id} value={char.id}>{char.name}</option>)}</select></div><div className={styles.characterChips}>{linkedCharacters.map((char)=>char && <button key={char.id} type="button" onClick={() => localPatch(entry.id,{character_ids:entry.character_ids.filter((id)=>id!==char.id)})} title={`Remove ${char.name}`}><MiniPortrait id={char.id} alt={char.name} size={30}/><span>{char.name}</span><i>×</i></button>)}</div></div>
              <label className={styles.chapterField}><span className={styles.fieldLabel}>Bound chapter</span><select value={entry.chapter_slug ?? ""} onChange={(e) => localPatch(entry.id,{chapter_slug:e.target.value || null})}><option value="">No chapter bound</option>{chapters.map((chapter)=><option key={chapter.slug} value={chapter.slug}>{chapter.title}</option>)}</select>{linkedChapter && <small>{linkedChapter.synopsis}</small>}</label>
            </section>

            <footer className={styles.entryActions}>
              <button type="button" className={entry.pinned ? styles.actionActive : ""} onClick={() => localPatch(entry.id,{pinned:!entry.pinned})}>{entry.pinned ? "Unpin" : "Pin"}</button>
              <button type="button" className={entry.status === "settled" ? styles.actionActive : ""} onClick={() => localPatch(entry.id,{status:entry.status === "settled" ? "open" : "settled"})}>{entry.status === "settled" ? "Reopen entry" : "Settle entry"}</button>
              <button type="button" onClick={() => localPatch(entry.id,{archived:!entry.archived})}>{entry.archived ? "Restore from archive" : "Archive"}</button>
              <button type="button" className={styles.burn} onClick={() => void burnEntry(entry)}>Burn entry</button>
            </footer>
          </div>}
        </article>;
      })}
    </section>

    <button className={styles.sealButton} type="button" onClick={() => void newEntry()} disabled={creating} aria-label="New Entry"><span>＋</span><small>New Entry</small></button>
  </main>;
}
