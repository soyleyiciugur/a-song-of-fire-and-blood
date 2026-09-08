"use client";

import { useEffect, useMemo, useState } from "react";
import eventsData from "@/data/events.json";
import chaptersData from "@/data/chapters.json";
import locationsData from "@/data/map/locations.json";
import { getDraft, setDraft } from "@/lib/adminDrafts";
import { ConfirmModal, PromptModal } from "../_components/Modal";

type EventEntry = {
  id: string;
  title: string;
  type: "battle" | "feast" | "tournament" | "wedding" | "trial";
  location: string;
  chapterSlug: string;
  day: number;
  moon: number;
  year?: number;
  description: string;
};

const types: EventEntry["type"][] = ["battle", "feast", "tournament", "wedding", "trial"];
const inputStyle = { width: "100%", padding: "11px 12px", color: "var(--text)", background: "rgba(0,0,0,.2)", border: "1px solid var(--border)", borderRadius: "5px", font: "inherit" };

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventEntry[]>(eventsData as EventEntry[]);
  const [selectedId, setSelectedId] = useState<string>((eventsData[0] as EventEntry)?.id ?? "");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const active = events.find((event) => event.id === selectedId);
  const filtered = useMemo(() => events.filter((event) => `${event.title} ${event.location}`.toLowerCase().includes(search.toLowerCase())), [events, search]);

  useEffect(() => { const draft = getDraft<EventEntry[]>("events"); if (draft?.length) { setEvents(draft); setSelectedId(draft[0].id); } }, []);
  useEffect(() => { setDraft("events", events); }, [events]);

  const update = (field: keyof EventEntry, value: string | number | undefined) => { if (!active) return; setEvents((current) => current.map((event) => event.id === active.id ? { ...event, [field]: value } : event)); };
  const add = (title: string) => { const clean = title.trim(); if (!clean) return setShowAdd(false); const id = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); if (events.some((event) => event.id === id)) return; const next: EventEntry = { id, title: clean, type: "battle", location: locationsData[0]?.name ?? "", chapterSlug: chaptersData.at(-1)?.slug ?? "", day: 1, moon: 1, year: 99, description: "" }; setEvents((current) => [...current, next]); setSelectedId(id); setShowAdd(false); };
  const remove = () => { if (!active) return; setEvents((current) => current.filter((event) => event.id !== active.id)); setSelectedId(events.find((event) => event.id !== active.id)?.id ?? ""); setShowDelete(false); };

  return <main style={{ minHeight: "100vh", padding: "32px 24px 80px" }}><div style={{ maxWidth: 1200, margin: "auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 24, gap: 16 }}><div><p style={{ color: "var(--muted)", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Map + Chronicle data</p><h1 style={{ margin: 0, color: "var(--gold)" }}>Events</h1></div><button onClick={() => setShowAdd(true)} style={{ padding: "10px 14px", color: "var(--gold)", background: "transparent", border: "1px solid var(--gold)", borderRadius: 5, cursor: "pointer" }}>+ Add event</button></div><div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 24 }}><aside><input placeholder="Search events…" value={search} onChange={(event) => setSearch(event.target.value)} style={{ ...inputStyle, marginBottom: 12 }} /><div style={{ display: "grid", gap: 6, maxHeight: "70vh", overflow: "auto" }}>{filtered.map((event) => <button key={event.id} onClick={() => setSelectedId(event.id)} style={{ padding: "12px", textAlign: "left", color: selectedId === event.id ? "#000" : "var(--text)", background: selectedId === event.id ? "var(--gold)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer" }}><strong>{event.title}</strong><small style={{ display: "block", marginTop: 4, opacity: .7 }}>{event.type} · {event.year ?? "Undated"} AC</small></button>)}</div></aside>{active && <section style={{ maxWidth: 760, display: "grid", gap: 17 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>ID: {active.id}</p><button onClick={() => setShowDelete(true)} style={{ color: "#ff8080", background: "transparent", border: "1px solid #ff8080", borderRadius: 5, padding: "7px 10px", cursor: "pointer" }}>Delete</button></div><label>Title<input value={active.title} onChange={(e) => update("title", e.target.value)} style={inputStyle} /></label><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}><label>Type<select value={active.type} onChange={(e) => update("type", e.target.value)} style={inputStyle}>{types.map((type) => <option key={type}>{type}</option>)}</select></label><label>Location<select value={active.location} onChange={(e) => update("location", e.target.value)} style={inputStyle}>{locationsData.map((location) => <option key={location.name}>{location.name}</option>)}</select></label><label>Chapter<select value={active.chapterSlug} onChange={(e) => update("chapterSlug", e.target.value)} style={inputStyle}>{chaptersData.map((chapter) => <option key={chapter.slug} value={chapter.slug}>{chapter.title}</option>)}</select></label></div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}><label>Day<input type="number" min={1} max={30} value={active.day} onChange={(e) => update("day", Number(e.target.value))} style={inputStyle} /></label><label>Moon<input type="number" min={1} max={12} value={active.moon} onChange={(e) => update("moon", Number(e.target.value))} style={inputStyle} /></label><label>Year<input type="number" min={1} value={active.year ?? ""} onChange={(e) => update("year", e.target.value ? Number(e.target.value) : undefined)} style={inputStyle} /></label></div><label>Description<textarea value={active.description} onChange={(e) => update("description", e.target.value)} style={{ ...inputStyle, minHeight: 180, resize: "vertical" }} /></label><p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>Changes are saved as a local draft. Use the admin publish bar to write the validated record to <code>data/events.json</code>.</p></section>}</div></div>{showAdd && <PromptModal title="Add event" placeholder="Event title" onConfirm={add} onCancel={() => setShowAdd(false)} />}{showDelete && active && <ConfirmModal title="Delete event" message={`Delete ${active.title}?`} confirmLabel="Delete" onConfirm={remove} onCancel={() => setShowDelete(false)} />}</main>;
}
