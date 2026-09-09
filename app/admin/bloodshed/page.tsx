"use client";

import { useEffect, useMemo, useState } from "react";
import bloodshedData from "@/data/bloodshed.json";
import chaptersData from "@/data/chapters.json";
import locationsData from "@/data/map/locations.json";
import { getDraft, setDraft } from "@/lib/adminDrafts";
import { ConfirmModal, PromptModal } from "../_components/Modal";
import styles from "./bloodshed.module.css";

type Entry = {
  id: string; title: string; kind: "battle" | "duel" | "tourney" | "massacre";
  day: number; moon: number; year: number; location: string; chapterSlug: string;
  participants: string[]; houses: string[]; summary: string; cause: string; consequence: string;
};

const kinds: Entry["kind"][] = ["battle", "duel", "tourney", "massacre"];
const toId = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function AdminBloodshedPage() {
  const [entries, setEntries] = useState<Entry[]>(bloodshedData as Entry[]);
  const [selectedId, setSelectedId] = useState((bloodshedData[0] as Entry)?.id ?? "");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const active = entries.find((entry) => entry.id === selectedId);
  const filtered = useMemo(() => entries.filter((entry) => `${entry.title} ${entry.location} ${entry.kind}`.toLowerCase().includes(search.toLowerCase())), [entries, search]);

  useEffect(() => { const draft = getDraft<Entry[]>("bloodshed"); if (draft?.length) { setEntries(draft); setSelectedId(draft[0].id); } }, []);
  useEffect(() => { setDraft("bloodshed", entries); }, [entries]);

  const update = <K extends keyof Entry>(field: K, value: Entry[K]) => {
    if (!active) return;
    setEntries((current) => current.map((entry) => entry.id === active.id ? { ...entry, [field]: value } : entry));
  };
  const add = (title: string) => {
    const clean = title.trim();
    if (!clean) return setShowAdd(false);
    const id = toId(clean);
    if (!id || entries.some((entry) => entry.id === id)) return setShowAdd(false);
    const next: Entry = { id, title: clean, kind: "battle", day: 1, moon: 1, year: 99, location: locationsData[0]?.name ?? "", chapterSlug: chaptersData.at(-1)?.slug ?? "", participants: [], houses: [], summary: "", cause: "", consequence: "" };
    setEntries((current) => [...current, next]); setSelectedId(id); setShowAdd(false);
  };
  const remove = () => {
    if (!active) return;
    const next = entries.filter((entry) => entry.id !== active.id);
    setEntries(next); setSelectedId(next[0]?.id ?? ""); setShowDelete(false);
  };
  const updateList = (field: "participants" | "houses", value: string) => update(field, value.split(",").map((item) => item.trim()).filter(Boolean));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>Chronicle data</p><h1>The Bloodshed</h1><p className={styles.lead}>Completed battles, duels, and tourneys. Future requests stay in the Annals until they happen.</p></div><button className={styles.primaryButton} onClick={() => setShowAdd(true)}>+ Add entry</button></div>
        <div className={styles.editor}>
          <aside className={styles.sidebar}><input className={styles.input} placeholder="Search the bloodshed..." value={search} onChange={(event) => setSearch(event.target.value)} /><div className={styles.entryList}>{filtered.map((entry) => <button className={`${styles.entryButton} ${entry.id === selectedId ? styles.entryButtonActive : ""}`} key={entry.id} onClick={() => setSelectedId(entry.id)}><strong>{entry.title}</strong><small>{entry.kind} · {entry.year} AC</small></button>)}</div></aside>
          {active && <section className={styles.form}><div className={styles.formTop}><span>ID: {active.id}</span><button className={styles.dangerButton} onClick={() => setShowDelete(true)}>Delete</button></div><label>Title<input className={styles.input} value={active.title} onChange={(event) => update("title", event.target.value)} /></label><div className={styles.fields3}><label>Kind<select className={styles.input} value={active.kind} onChange={(event) => update("kind", event.target.value as Entry["kind"])}>{kinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label><label>Location<select className={styles.input} value={active.location} onChange={(event) => update("location", event.target.value)}>{locationsData.map((location) => <option key={location.name} value={location.name}>{location.name}</option>)}</select></label><label>Chapter<select className={styles.input} value={active.chapterSlug} onChange={(event) => update("chapterSlug", event.target.value)}>{chaptersData.map((chapter) => <option key={chapter.slug} value={chapter.slug}>{chapter.title}</option>)}</select></label></div><div className={styles.fields3}><label>Day<input className={styles.input} type="number" min={1} max={30} value={active.day} onChange={(event) => update("day", Number(event.target.value))} /></label><label>Moon<input className={styles.input} type="number" min={1} max={12} value={active.moon} onChange={(event) => update("moon", Number(event.target.value))} /></label><label>Year<input className={styles.input} type="number" min={1} value={active.year} onChange={(event) => update("year", Number(event.target.value))} /></label></div><label>Summary<textarea className={styles.textarea} value={active.summary} onChange={(event) => update("summary", event.target.value)} /></label><div className={styles.fields2}><label>Cause<textarea className={styles.textarea} value={active.cause} onChange={(event) => update("cause", event.target.value)} /></label><label>Consequence<textarea className={styles.textarea} value={active.consequence} onChange={(event) => update("consequence", event.target.value)} /></label></div><label>Participant IDs, comma separated<input className={styles.input} value={active.participants.join(", ")} onChange={(event) => updateList("participants", event.target.value)} /></label><label>House IDs, comma separated<input className={styles.input} value={active.houses.join(", ")} onChange={(event) => updateList("houses", event.target.value)} /></label><p className={styles.note}>Changes are saved as a local draft and validated against the Bloodshed JSON schema when published.</p></section>}
        </div>
      </div>
      {showAdd && <PromptModal title="Add Bloodshed entry" placeholder="Entry title" onConfirm={add} onCancel={() => setShowAdd(false)} />}
      {showDelete && active && <ConfirmModal title="Delete entry" message={`Delete ${active.title}?`} confirmLabel="Delete" onConfirm={remove} onCancel={() => setShowDelete(false)} />}
    </main>
  );
}
