"use client";

import { useMemo, useState } from "react";
import { getAllChapters } from "@/data/chapters";
import type { InnerCourtEntry, InnerCourtKind } from "@/data/character-inner-court";
import { useSpoilerBoundary } from "@/components/reading/ReadingProgressProvider";
import ContinueReadingLink from "@/components/reading/ContinueReadingLink";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/characters/[id]/thoughts/innerCourt.module.css";

const chapters = getAllChapters();
const kindLabels: Record<InnerCourtKind, string> = { thought: "Thought", suspicion: "Suspicion", preference: "Like or dislike", belief: "Belief", theory: "Theory", question: "Unresolved question" };
const statusLabels: Record<InnerCourtEntry["status"], string> = { active: "Active", changed: "Changed with the story", resolved: "Resolved" };
type SortMode = "manual" | "chapter-asc" | "chapter-desc" | "created-asc" | "created-desc";
type DropTarget = { id: string; edge: "before" | "after" } | null;
const sortLabels: Record<SortMode, string> = { manual: "Manual order", "chapter-asc": "Chapter · oldest", "chapter-desc": "Chapter · latest", "created-asc": "Added · oldest", "created-desc": "Added · latest" };
type Draft = Pick<InnerCourtEntry, "chapterSlug" | "kind" | "subject" | "body" | "status">;
const blankDraft = (): Draft => ({ chapterSlug: chapters[0]?.slug ?? "", kind: "thought", subject: "", body: "", status: "active" });

function CourtSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value)?.label ?? options[0]?.label;
  return <div className={styles.selectField}>
    <span>{label}</span>
    <div className={styles.courtSelect}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><span>{selected}</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg></button>
      {open && <div className={styles.selectMenu} role="listbox" aria-label={label}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? styles.selectedOption : undefined} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }}><span>{option.label}</span>{option.value === value && <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 10 3 3 7-7" /></svg>}</button>)}</div>}
    </div>
  </div>;
}

function EntryForm({ draft, busy, onChange, onCancel, onSave }: { draft: Draft; busy: boolean; onChange: (draft: Draft) => void; onCancel: () => void; onSave: () => void }) {
  return <div className={styles.editor}>
    <div className={styles.editorGrid}>
      <CourtSelect label="Chapter" value={draft.chapterSlug} options={chapters.map((chapter) => ({ value: chapter.slug, label: chapter.title }))} onChange={(value) => onChange({ ...draft, chapterSlug: value })} />
      <CourtSelect label="Kind" value={draft.kind} options={Object.entries(kindLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => onChange({ ...draft, kind: value as InnerCourtKind })} />
      <CourtSelect label="Status" value={draft.status} options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => onChange({ ...draft, status: value as Draft["status"] })} />
    </div>
    <label className={styles.field}><span>Character or subject</span><input maxLength={160} value={draft.subject ?? ""} onChange={(event) => onChange({ ...draft, subject: event.target.value })} placeholder="Who or what occupies this thought?" /></label>
    <label className={styles.field}><span>Canonical internal state</span><textarea maxLength={4000} required value={draft.body} onChange={(event) => onChange({ ...draft, body: event.target.value })} placeholder="Write what the character currently thinks, suspects, believes or questions." /></label>
    <div className={styles.editorFooter}><span>{draft.body.length}/4000</span><div><button type="button" onClick={onCancel}>Cancel</button><button type="button" className={styles.primaryButton} disabled={busy || !draft.body.trim() || !draft.chapterSlug} onClick={onSave}>{busy ? "Sealing…" : "Seal entry"}</button></div></div>
  </div>;
}

export default function InnerCourtContent({ characterId, initialEntries, canEdit, userId }: { characterId: string; initialEntries: InnerCourtEntry[]; canEdit: boolean; userId: string | null }) {
  const supabase = useMemo(() => createClient(), []);
  const { canReveal } = useSpoilerBoundary();
  const chapterTitles = useMemo(() => new Map(chapters.map((chapter) => [chapter.slug, chapter.title])), []);
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [settling, setSettling] = useState(false);
  const chapterOrder = useMemo(() => new Map(chapters.map((chapter, index) => [chapter.slug, index])), []);
  const visible = entries.filter((entry) => canReveal(entry.chapterSlug));
  const visibleSorted = [...visible].sort((a, b) => {
    if (sortMode === "chapter-asc" || sortMode === "chapter-desc") {
      const difference = (chapterOrder.get(a.chapterSlug) ?? Number.MAX_SAFE_INTEGER) - (chapterOrder.get(b.chapterSlug) ?? Number.MAX_SAFE_INTEGER);
      return sortMode === "chapter-asc" ? difference : -difference;
    }
    if (sortMode === "created-asc" || sortMode === "created-desc") {
      const difference = Date.parse(a.createdAt ?? "1970-01-01") - Date.parse(b.createdAt ?? "1970-01-01");
      return sortMode === "created-asc" ? difference : -difference;
    }
    return (a.sortOrder ?? entries.indexOf(a)) - (b.sortOrder ?? entries.indexOf(b));
  });
  const locked = visible.length < entries.length;

  function edit(entry: InnerCourtEntry) {
    setEditingId(entry.id); setDeleteId(null); setMessage("");
    setDraft({ chapterSlug: entry.chapterSlug, kind: entry.kind, subject: entry.subject ?? "", body: entry.body, status: entry.status });
  }

  async function save() {
    if (!canEdit || !userId || !draft.body.trim()) return;
    setBusy(true); setMessage("");
    const payload = { chapter_slug: draft.chapterSlug, kind: draft.kind, subject: draft.subject?.trim() || null, body: draft.body.trim(), status: draft.status, updated_at: new Date().toISOString() };
    if (editingId === "new") {
      const { data, error } = await supabase.from("character_inner_court").insert({ ...payload, character_id: characterId, created_by: userId }).select("*").single();
      if (error || !data) setMessage("The new thought could not be sealed.");
      else {
        setEntries((current) => [...current, { id: data.id, chapterSlug: data.chapter_slug, kind: data.kind, subject: data.subject ?? undefined, body: data.body, status: data.status, supersedes: data.supersedes ?? undefined, createdAt: data.created_at, updatedAt: data.updated_at, sortOrder: data.sort_order }]);
        setEditingId(null); setDraft(blankDraft()); setMessage("Entry sealed.");
      }
    } else if (editingId) {
      const { data, error } = await supabase.from("character_inner_court").update(payload).eq("id", editingId).eq("character_id", characterId).select("*").single();
      if (error || !data) setMessage("The change could not be sealed.");
      else {
        setEntries((current) => current.map((entry) => entry.id === editingId ? { ...entry, chapterSlug: data.chapter_slug, kind: data.kind, subject: data.subject ?? undefined, body: data.body, status: data.status, updatedAt: data.updated_at } : entry));
        setEditingId(null); setMessage("Changes sealed.");
      }
    }
    setBusy(false);
  }

  async function remove(id: string) {
    setBusy(true); setMessage("");
    const { error } = await supabase.from("character_inner_court").delete().eq("id", id).eq("character_id", characterId);
    if (error) setMessage("The entry could not be removed.");
    else { setEntries((current) => current.filter((entry) => entry.id !== id)); setDeleteId(null); setMessage("Entry removed."); }
    setBusy(false);
  }

  async function moveEntry(targetId: string, edge: "before" | "after") {
    if (!canEdit || sortMode !== "manual" || !draggedId || draggedId === targetId) { setDropTarget(null); return; }
    const ordered = [...entries].sort((a, b) => (a.sortOrder ?? entries.indexOf(a)) - (b.sortOrder ?? entries.indexOf(b)));
    const from = ordered.findIndex((entry) => entry.id === draggedId);
    if (from < 0) { setDropTarget(null); return; }
    const [moved] = ordered.splice(from, 1);
    const target = ordered.findIndex((entry) => entry.id === targetId);
    if (target < 0) { setDropTarget(null); return; }
    ordered.splice(edge === "after" ? target + 1 : target, 0, moved);
    const reordered = ordered.map((entry, index) => ({ ...entry, sortOrder: index }));
    setEntries(reordered); setDraggedId(null); setDropTarget(null); setSettling(true); setMessage("Saving order…");
    window.setTimeout(() => setSettling(false), 320);
    const results = await Promise.all(reordered.map((entry) => supabase.from("character_inner_court").update({ sort_order: entry.sortOrder }).eq("id", entry.id).eq("character_id", characterId)));
    setMessage(results.some((result) => result.error) ? "The new order could not be sealed." : "Order sealed.");
  }

  return <div className={styles.entries}>
    <div className={styles.editBar}><div><strong>{canEdit ? "Your character's Inner Court" : "Inner Court records"}</strong><span>{canEdit ? "Only you can alter this canonical record." : "Arrange the record by chapter or the date it was added."}</span></div><div className={styles.barActions}><CourtSelect label="Sort" value={sortMode} options={Object.entries(sortLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => setSortMode(value as SortMode)} />{canEdit && <button type="button" disabled={editingId !== null} onClick={() => { setEditingId("new"); setDraft(blankDraft()); setMessage(""); }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>New entry</button>}</div></div>
    {message && <p className={styles.saveMessage} role="status">{message}</p>}
    {editingId === "new" && <EntryForm draft={draft} busy={busy} onChange={setDraft} onCancel={() => setEditingId(null)} onSave={() => void save()} />}
    {visibleSorted.map((entry) => editingId === entry.id ? <EntryForm key={entry.id} draft={draft} busy={busy} onChange={setDraft} onCancel={() => setEditingId(null)} onSave={() => void save()} /> : <article className={`${styles.entry} ${draggedId === entry.id ? styles.dragging : ""} ${dropTarget?.id === entry.id ? (dropTarget.edge === "before" ? styles.dropBefore : styles.dropAfter) : ""} ${settling ? styles.settling : ""}`} key={entry.id} onDragOver={(event) => { if (!canEdit || sortMode !== "manual" || draggedId === entry.id) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; const rect = event.currentTarget.getBoundingClientRect(); const edge = event.clientY < rect.top + rect.height / 2 ? "before" : "after"; if (dropTarget?.id !== entry.id || dropTarget.edge !== edge) setDropTarget({ id: entry.id, edge }); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget((current) => current?.id === entry.id ? null : current); }} onDrop={(event) => { event.preventDefault(); void moveEntry(entry.id, dropTarget?.id === entry.id ? dropTarget.edge : "before"); }}>
      {canEdit && <button className={styles.dragHandle} type="button" draggable={sortMode === "manual"} disabled={sortMode !== "manual"} aria-label="Drag to reorder entry" title={sortMode === "manual" ? "Drag to reorder" : "Choose Manual order to rearrange"} onDragStart={(event) => { setDraggedId(entry.id); setDropTarget(null); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", entry.id); }} onDragEnd={() => { setDraggedId(null); setDropTarget(null); }}><svg viewBox="0 0 20 24" aria-hidden="true"><circle cx="7" cy="7" r="1"/><circle cx="13" cy="7" r="1"/><circle cx="7" cy="12" r="1"/><circle cx="13" cy="12" r="1"/><circle cx="7" cy="17" r="1"/><circle cx="13" cy="17" r="1"/></svg></button>}
      <div className={styles.entryMeta}><span>{kindLabels[entry.kind]}</span><span>{chapterTitles.get(entry.chapterSlug)}</span></div>
      {entry.subject && <h2>{entry.subject}</h2>}<p>{entry.body}</p>
      <div className={styles.entryBottom}>{entry.status !== "active" ? <small>{statusLabels[entry.status]}</small> : <span />}{canEdit && <div className={styles.entryActions}><button type="button" onClick={() => edit(entry)}>Edit</button><button type="button" onClick={() => setDeleteId(entry.id)}>Remove</button></div>}</div>
      {deleteId === entry.id && <div className={styles.deleteConfirm}><span>Remove this entry permanently?</span><div><button type="button" onClick={() => setDeleteId(null)}>Keep</button><button type="button" disabled={busy} onClick={() => void remove(entry.id)}>Remove</button></div></div>}
    </article>)}
    {locked && <div className={styles.locked}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10M6 10h12v10H6z" /></svg><div><strong>Later thoughts remain sealed</strong><span>Your reading boundary protects every detail of what changes next.</span><ContinueReadingLink /></div></div>}
  </div>;
}
