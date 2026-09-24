"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import MiniPortrait from "@/components/MiniPortrait";
import { getCharacters } from "@/lib/characters";
import { getAllChapters } from "@/data/chapters";
import { createClient } from "@/lib/supabase/client";
import type { LedgerChecklistItem, PrivateLedgerEntry } from "@/lib/supabase/database.types";
import { LEDGER_IMPORT_MAX_BYTES, parseLedgerImport, type LedgerImportDraft } from "@/lib/ledger-import";
import styles from "./ledger.module.css";

type Filter = "open" | "settled" | "all";
type SortMode = "entry-latest" | "entry-oldest" | "chapter-latest" | "chapter-oldest";
type SaveState = "idle" | "saving" | "saved" | "error";
type PickerKind = "character" | "chapter";
type PickerState = { entryId: string; kind: PickerKind } | null;
type EntryPatch = Partial<Pick<PrivateLedgerEntry, "heading" | "matter" | "checklist" | "pinned" | "status" | "archived" | "character_ids" | "chapter_slug">>;
type ImportPreview = { fileName: string; entries: LedgerImportDraft[]; warnings: string[] };

const characters = getCharacters().slice().sort((a, b) => a.name.localeCompare(b.name));
const chapters = getAllChapters().slice();
const chapterOrder = new Map(chapters.map((chapter, index) => [chapter.slug, index]));

function Icon({ name, className }: { name: "search" | "plus" | "archive" | "star" | "chevron" | "check" | "close" | "up" | "down" | "pin" | "flame" | "book" | "upload"; className?: string }) {
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
  if (name === "upload") return <svg {...common}><path d="M12 16V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 14v5h14v-5"/></svg>;
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
  const [filter, setFilter] = useState<Filter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("entry-latest");
  const [archived, setArchived] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [picker, setPicker] = useState<PickerState>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerActiveIndex, setPickerActiveIndex] = useState(-1);
  const [deleteTarget, setDeleteTarget] = useState<PrivateLedgerEntry | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimers = useRef(new Map<string, number>());
  const pendingPatches = useRef(new Map<string, EntryPatch>());
  const saveChains = useRef(new Map<string, Promise<void>>());

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    const { data, error } = await supabase.from("private_ledger_entries").select("*").eq("user_id", userId).order("pinned", { ascending: false }).order("updated_at", { ascending: false });
    if (error) setMessage("The ledger could not be opened. Make certain the ledger migration has been applied.");
    else setEntries((data ?? []).map((row) => normalizeEntry(row)));
    setLoading(false);
  }, [supabase, userId]);

  const flushSave = useCallback((id: string) => {
    const timer = saveTimers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      saveTimers.current.delete(id);
    }

    const previous = saveChains.current.get(id) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(async () => {
      while (pendingPatches.current.has(id)) {
        const patch = pendingPatches.current.get(id);
        if (!patch) break;
        pendingPatches.current.delete(id);
        setSaveState("saving");

        const { error } = await supabase
          .from("private_ledger_entries")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", userId);

        if (error) {
          pendingPatches.current.set(id, { ...patch, ...(pendingPatches.current.get(id) ?? {}) });
          setSaveState("error");
          setMessage("A change could not be sealed. Your words remain on this screen; try again before leaving.");
          break;
        }

        setSaveState("saved");
      }

      if (!pendingPatches.current.size) {
        window.setTimeout(() => setSaveState((current) => current === "saved" ? "idle" : current), 1500);
      }
    }).finally(() => {
      if (saveChains.current.get(id) === next) saveChains.current.delete(id);
    });

    saveChains.current.set(id, next);
    return next;
  }, [supabase, userId]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  useEffect(() => {
    const timers = saveTimers.current;
    const flushAll = () => {
      for (const id of pendingPatches.current.keys()) void flushSave(id);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushAll);
      document.removeEventListener("visibilitychange", onVisibility);
      flushAll();
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
    };
  }, [flushSave]);
  useEffect(() => {
    if (!picker && !deleteTarget && !importPreview) return;
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape" && !importing) { setPicker(null); setPickerQuery(""); setPickerActiveIndex(-1); setDeleteTarget(null); setImportPreview(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picker, deleteTarget, importPreview, importing]);
  useEffect(() => {
    if (!picker) return;
    const selector = `[data-ledger-picker="${picker.entryId}-${picker.kind}"]`;
    const onPointerDown = (event: PointerEvent) => {
      const root = document.querySelector(selector);
      if (root && event.target instanceof Node && root.contains(event.target)) return;
      setPicker(null);
      setPickerQuery("");
      setPickerActiveIndex(-1);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [picker]);

  function closePicker() {
    setPicker(null);
    setPickerQuery("");
    setPickerActiveIndex(-1);
  }

  function togglePicker(entryId: string, kind: PickerKind, open: boolean) {
    if (open) {
      closePicker();
      return;
    }
    setPicker({ entryId, kind });
    setPickerQuery("");
    setPickerActiveIndex(-1);
  }

  function pickerKeyDown(event: ReactKeyboardEvent<HTMLInputElement>, count: number, selectAt: (index: number) => void) {
    if (!count) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPickerActiveIndex((current) => current < 0 ? 0 : Math.min(current + 1, count - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setPickerActiveIndex((current) => current < 0 ? count - 1 : Math.max(current - 1, 0));
    } else if (event.key === "Enter" && pickerActiveIndex >= 0 && pickerActiveIndex < count) {
      event.preventDefault();
      selectAt(pickerActiveIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
    }
  }

  function localPatch(id: string, patch: EntryPatch) {
    setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, ...patch, updated_at: new Date().toISOString() } : entry));
    scheduleSave(id, patch);
  }

  function scheduleSave(id: string, patch: EntryPatch) {
    pendingPatches.current.set(id, { ...(pendingPatches.current.get(id) ?? {}), ...patch });
    const previous = saveTimers.current.get(id);
    if (previous) window.clearTimeout(previous);
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      saveTimers.current.delete(id);
      void flushSave(id);
    }, 650);
    saveTimers.current.set(id, timer);
  }


  async function newEntry() {
    if (creating) return;
    setCreating(true); setMessage("");
    const draft = { user_id: userId, heading: "Untitled entry", matter: "", checklist: [], pinned: false, status: "open" as const, archived: false, character_ids: [], chapter_slug: null };
    const { data, error } = await supabase.from("private_ledger_entries").insert(draft).select("*").single();
    if (error || !data) setMessage("A new page could not be added to the ledger.");
    else { const entry = normalizeEntry(data); setEntries((current) => [entry, ...current]); setExpandedId(entry.id); setFilter("all"); setArchived(false); }
    setCreating(false);
  }

  async function readImportFile(file: File) {
    setMessage("");
    if (!file.name.toLocaleLowerCase().endsWith(".json")) {
      setMessage("Choose a JSON ledger file.");
      return;
    }
    if (file.size > LEDGER_IMPORT_MAX_BYTES) {
      setMessage("The ledger file is larger than 2 MB.");
      return;
    }
    try {
      const result = parseLedgerImport(
        await file.text(),
        new Set(characters.map((character) => character.id)),
        new Set(chapters.map((chapter) => chapter.slug)),
      );
      setImportPreview({ fileName: file.name, ...result });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The ledger file could not be read.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function importEntries() {
    if (!importPreview || importing) return;
    setImporting(true);
    setMessage("");
    const payload = importPreview.entries.map((entry) => ({ ...entry, user_id: userId }));
    const { data, error } = await supabase.from("private_ledger_entries").insert(payload).select("*");
    if (error || !data) {
      setMessage("The imported pages could not be sealed. No entries were added.");
    } else {
      const imported = data.map((entry) => normalizeEntry(entry));
      setEntries((current) => [...imported, ...current]);
      setArchived(false);
      setFilter("all");
      setQuery("");
      setImportPreview(null);
      setMessage(`${imported.length} ${imported.length === 1 ? "entry was" : "entries were"} imported into your private ledger.`);
    }
    setImporting(false);
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
    }).sort((a, b) => {
      if (filter === "all" && a.status !== b.status) return a.status === "open" ? -1 : 1;
      const pinnedOrder = Number(b.pinned) - Number(a.pinned);
      if (pinnedOrder) return pinnedOrder;
      if (sortMode === "entry-latest" || sortMode === "entry-oldest") {
        const dateOrder = Date.parse(a.created_at) - Date.parse(b.created_at);
        return sortMode === "entry-latest" ? -dateOrder : dateOrder;
      }
      const aChapter = a.chapter_slug ? chapterOrder.get(a.chapter_slug) : undefined;
      const bChapter = b.chapter_slug ? chapterOrder.get(b.chapter_slug) : undefined;
      if (aChapter === undefined && bChapter !== undefined) return 1;
      if (aChapter !== undefined && bChapter === undefined) return -1;
      if (aChapter !== undefined && bChapter !== undefined && aChapter !== bChapter) {
        return sortMode === "chapter-latest" ? bChapter - aChapter : aChapter - bChapter;
      }
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
  }, [entries, filter, archived, query, sortMode]);

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
      <input ref={fileInputRef} className={styles.fileInput} type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void readImportFile(file); }} />
      <button className={styles.importButton} type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}><Icon name="upload"/>Import</button>
      <button className={styles.newEntryDesktop} type="button" onClick={() => void newEntry()} disabled={creating}><Icon name="plus"/>New Entry</button>
    </section>

    <div className={styles.filters}>
      <div className={styles.segmented} role="tablist" aria-label="Ledger status">
        {(["all", "open", "settled"] as Filter[]).map((value) => <button key={value} type="button" role="tab" data-status={value} aria-selected={!archived && filter === value} onClick={() => { setArchived(false); setFilter(value); }}><span aria-hidden="true" />{value === "open" ? "Open" : value === "settled" ? "Settled" : "All"}</button>)}
      </div>
      <button className={`${styles.archiveFilter} ${archived ? styles.archiveActive : ""}`} type="button" onClick={() => setArchived((value) => !value)}><Icon name="archive"/>{archived ? "Leave the Archive" : "The Archive"}</button>
    </div>

    <div className={styles.sortBar}>
      <label htmlFor="ledger-sort">Sort matters</label>
      <span className={styles.sortSelect}>
        <select id="ledger-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
          <option value="entry-latest">Entry date · Latest first</option>
          <option value="entry-oldest">Entry date · Oldest first</option>
          <option value="chapter-latest">Relevant chapter · Latest first</option>
          <option value="chapter-oldest">Relevant chapter · Oldest first</option>
        </select>
        <Icon name="chevron"/>
      </span>
    </div>

    {message && <p className={styles.message} role="status">{message}</p>}
    {loading && <div className={styles.empty}><Icon name="star"/><p>Opening the private ledger…</p></div>}
    {!loading && !visible.length && <div className={styles.empty}><Icon name="star"/><h2>{archived ? "The archive is quiet" : filter === "settled" ? "Nothing settled yet" : "No matters await you"}</h2><p>{query ? "No entry answers that search." : "Add an entry when the realm gives you something worth remembering."}</p></div>}

    <section className={styles.entryList} aria-label="Ledger entries">
      {visible.map((entry, index) => {
        const done = entry.checklist.filter((item) => item.done).length;
        const expanded = expandedId === entry.id;
        const linkedCharacters = entry.character_ids.map((id) => characters.find((char) => char.id === id)).filter(Boolean);
        const linkedChapter = chapters.find((chapter) => chapter.slug === entry.chapter_slug);
        const characterPickerOpen = picker?.entryId === entry.id && picker.kind === "character";
        const chapterPickerOpen = picker?.entryId === entry.id && picker.kind === "chapter";
        const pickerNeedle = pickerQuery.trim().toLocaleLowerCase();
        const availableCharacters = characters.filter((char) => {
          if (entry.character_ids.includes(char.id)) return false;
          if (!pickerNeedle) return true;
          return [char.name, char.nickname ?? "", ...char.aliases, char.house]
            .join(" ")
            .toLocaleLowerCase()
            .includes(pickerNeedle);
        });
        const availableChapters = chapters.filter((chapter) => !pickerNeedle || [chapter.title, chapter.slug, chapter.synopsis ?? ""].join(" ").toLocaleLowerCase().includes(pickerNeedle));
        const unboundTerms = ["none", "unbound", "no chapter", "no chapter bound"];
        const showUnbound = !pickerNeedle || unboundTerms.some((term) => term.startsWith(pickerNeedle) || pickerNeedle.startsWith(term));
        const chapterOptions = [
          ...(showUnbound ? [{ slug: null as string | null, title: "No chapter bound" }] : []),
          ...availableChapters.map((chapter) => ({ slug: chapter.slug as string | null, title: chapter.title })),
        ];
        const startsStatusGroup = filter === "all" && (index === 0 || visible[index - 1]?.status !== entry.status);
        const statusCount = startsStatusGroup ? visible.filter((item) => item.status === entry.status).length : 0;
        return <div className={styles.entryRow} key={entry.id}>
          {startsStatusGroup && <div className={`${styles.groupHeading} ${entry.status === "open" ? styles.groupOpen : styles.groupSettled}`}><span>{entry.status === "open" ? "Open matters" : "Settled matters"}</span><small>{statusCount} {statusCount === 1 ? "entry" : "entries"}</small></div>}
          <article className={`${styles.entry} ${entry.pinned ? styles.pinned : ""} ${entry.status === "settled" ? styles.settled : ""}`}>
          <button type="button" className={styles.entrySummary} onClick={() => { setExpandedId(expanded ? null : entry.id); closePicker(); }} aria-expanded={expanded}>
            <span className={styles.entryMain}><span className={styles.entryMeta}>{entry.pinned && <b>Pinned</b>}<b className={entry.status === "open" ? styles.statusOpen : styles.statusSettled}>{entry.status === "open" ? "Open" : "Settled"}</b>{entry.archived && <b>Archived</b>}<small>Last amended {age(entry.updated_at)}</small></span><strong>{entry.heading || "Untitled entry"}</strong>{entry.matter && <span className={styles.matterPreview}>{entry.matter}</span>}<span className={styles.progress}>{entry.checklist.length ? `${done} of ${entry.checklist.length} settled` : "No listed matters"}</span></span>
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
                <div className={styles.customSelect} data-open={characterPickerOpen || undefined} data-ledger-picker={`${entry.id}-character`}>
                  <button type="button" className={styles.selectButton} onClick={() => togglePicker(entry.id, "character", characterPickerOpen)} aria-expanded={characterPickerOpen}><span>Choose a character…</span><Icon name="chevron"/></button>
                  {characterPickerOpen && <div className={styles.selectMenu} role="listbox" aria-label="Choose a character">
                    <div className={styles.selectSearchWrap}>
                      <Icon name="search" className={styles.selectSearchIcon}/>
                      <input type="text" role="searchbox" className={styles.selectSearch} value={pickerQuery} onChange={(event) => { setPickerQuery(event.target.value); setPickerActiveIndex(-1); }} onKeyDown={(event) => pickerKeyDown(event, availableCharacters.length, (index) => { const char = availableCharacters[index]; if (!char) return; localPatch(entry.id, { character_ids: [...entry.character_ids, char.id] }); closePicker(); })} placeholder="Search characters…" inputMode="search" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Search characters"/>
                      {pickerQuery && <button type="button" className={styles.selectSearchClear} aria-label="Clear character search" onPointerDown={(event) => event.preventDefault()} onClick={() => { setPickerQuery(""); setPickerActiveIndex(-1); }}><Icon name="close"/></button>}
                    </div>
                    <div className={styles.selectOptions}>{availableCharacters.length ? availableCharacters.map((char, index) => <button type="button" role="option" aria-selected="false" data-active={pickerActiveIndex === index || undefined} key={char.id} onPointerEnter={() => setPickerActiveIndex(index)} onClick={() => { localPatch(entry.id, { character_ids: [...entry.character_ids, char.id] }); closePicker(); }}><MiniPortrait id={char.id} alt={char.name} size={26}/><span>{char.name}</span></button>) : <p className={styles.selectEmpty}>No names answer that search.</p>}</div>
                  </div>}
                </div>
                <div className={styles.characterChips}>{linkedCharacters.map((char) => char && <button key={char.id} type="button" onClick={() => localPatch(entry.id, { character_ids: entry.character_ids.filter((id) => id !== char.id) })} title={`Remove ${char.name}`}><MiniPortrait id={char.id} alt={char.name} size={30}/><span>{char.name}</span><Icon name="close"/></button>)}</div>
              </div>

              <div className={styles.chapterField}>
                <span className={styles.fieldLabel}>Bound chapter</span>
                <div className={styles.customSelect} data-open={chapterPickerOpen || undefined} data-ledger-picker={`${entry.id}-chapter`}>
                  <button type="button" className={styles.selectButton} onClick={() => togglePicker(entry.id, "chapter", chapterPickerOpen)} aria-expanded={chapterPickerOpen}><span>{linkedChapter?.title ?? "No chapter bound"}</span><Icon name="chevron"/></button>
                  {chapterPickerOpen && <div className={styles.selectMenu} role="listbox" aria-label="Choose a chapter">
                    <div className={styles.selectSearchWrap}>
                      <Icon name="search" className={styles.selectSearchIcon}/>
                      <input type="text" role="searchbox" className={styles.selectSearch} value={pickerQuery} onChange={(event) => { setPickerQuery(event.target.value); setPickerActiveIndex(-1); }} onKeyDown={(event) => pickerKeyDown(event, chapterOptions.length, (index) => { const option = chapterOptions[index]; if (!option) return; localPatch(entry.id, { chapter_slug: option.slug }); closePicker(); })} placeholder="Search chapters…" inputMode="search" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Search chapters"/>
                      {pickerQuery && <button type="button" className={styles.selectSearchClear} aria-label="Clear chapter search" onPointerDown={(event) => event.preventDefault()} onClick={() => { setPickerQuery(""); setPickerActiveIndex(-1); }}><Icon name="close"/></button>}
                    </div>
                    <div className={styles.selectOptions}>{chapterOptions.length ? chapterOptions.map((option, index) => <button type="button" role="option" aria-selected={option.slug === (entry.chapter_slug ?? null)} data-active={pickerActiveIndex === index || undefined} key={option.slug ?? "none"} onPointerEnter={() => setPickerActiveIndex(index)} onClick={() => { localPatch(entry.id, { chapter_slug: option.slug }); closePicker(); }}><Icon name="book"/><span>{option.title}</span></button>) : <p className={styles.selectEmpty}>No chapter answers that search.</p>}</div>
                  </div>}
                </div>
                {linkedChapter && <div className={styles.chapterDetails}><p>{linkedChapter.synopsis}</p><Link className={styles.chapterLink} href={`/chapters/${linkedChapter.slug}`}><Icon name="book"/><span>Open chapter</span></Link></div>}
              </div>
            </section>

            <footer className={styles.entryActions}>
              <button type="button" className={entry.pinned ? styles.actionActive : ""} onClick={() => localPatch(entry.id, { pinned: !entry.pinned })}><Icon name="pin"/>{entry.pinned ? "Unpin" : "Pin"}</button>
              <button type="button" className={entry.status === "settled" ? styles.actionActive : ""} onClick={() => localPatch(entry.id, { status: entry.status === "settled" ? "open" : "settled" })}><Icon name="check"/>{entry.status === "settled" ? "Reopen entry" : "Settle entry"}</button>
              <button type="button" onClick={() => localPatch(entry.id, { archived: !entry.archived })}><Icon name="archive"/>{entry.archived ? "Restore" : "Archive"}</button>
              <button type="button" className={styles.burn} onClick={() => setDeleteTarget(entry)}><Icon name="flame"/>Burn entry</button>
            </footer>
          </div>}
          </article>
        </div>;
      })}
    </section>

    <button className={styles.sealButton} type="button" onClick={() => void newEntry()} disabled={creating} aria-label="New Entry"><Icon name="plus"/><small>New Entry</small></button>

    {deleteTarget && <div className={styles.modalBackdrop} role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="burn-entry-title"><div className={styles.modalIcon}><Icon name="flame"/></div><span className={styles.modalEyebrow}>A final measure</span><h2 id="burn-entry-title">Burn this entry?</h2><p>“{deleteTarget.heading || "Untitled entry"}” will be removed from your private ledger for good.</p><div className={styles.modalActions}><button type="button" onClick={() => setDeleteTarget(null)}>Keep the page</button><button type="button" className={styles.modalDanger} onClick={() => void burnEntry(deleteTarget)}><Icon name="flame"/>Burn it</button></div></section></div>}
    {importPreview && <div className={styles.modalBackdrop} role="presentation" onPointerDown={(event) => { if (!importing && event.target === event.currentTarget) setImportPreview(null); }}><section className={styles.importModal} role="dialog" aria-modal="true" aria-labelledby="import-ledger-title"><div className={styles.importModalHeader}><div className={styles.importModalIcon}><Icon name="upload"/></div><div><span className={styles.modalEyebrow}>Private ledger import</span><h2 id="import-ledger-title">Seal these pages?</h2><p>{importPreview.fileName} contains {importPreview.entries.length} {importPreview.entries.length === 1 ? "entry" : "entries"}. Imported pages will belong only to your signed-in account.</p></div></div><div className={styles.importPreviewList}>{importPreview.entries.slice(0, 5).map((entry, index) => <div key={`${entry.heading}-${index}`}><strong>{entry.heading}</strong><span>{entry.checklist.length} {entry.checklist.length === 1 ? "matter" : "matters"}{entry.chapter_slug ? ` · ${entry.chapter_slug}` : ""}</span></div>)}{importPreview.entries.length > 5 && <p>And {importPreview.entries.length - 5} more…</p>}</div>{importPreview.warnings.length > 0 && <details className={styles.importWarnings}><summary>{importPreview.warnings.length} import {importPreview.warnings.length === 1 ? "notice" : "notices"}</summary><ul>{importPreview.warnings.slice(0, 20).map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul>{importPreview.warnings.length > 20 && <p>{importPreview.warnings.length - 20} more notices are not shown.</p>}</details>}<div className={styles.modalActions}><button type="button" onClick={() => setImportPreview(null)} disabled={importing}>Cancel</button><button type="button" className={styles.importConfirm} onClick={() => void importEntries()} disabled={importing}><Icon name="upload"/>{importing ? "Sealing pages…" : `Import ${importPreview.entries.length}`}</button></div></section></div>}
  </main>;
}
