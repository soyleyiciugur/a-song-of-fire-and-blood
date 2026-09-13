"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { CALENDAR_LABELS, calendarDateLabel, calendarHref, eventsInMoon, eventsOnDay, ordinal, type CalendarDate, type CalendarEvent } from "@/lib/calendar";
import styles from "./realmCalendar.module.css";

type Props = { today: CalendarDate; events: CalendarEvent[]; compact?: boolean; initialDate?: CalendarDate };

function Arrow({ right = false }: { right?: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d={right ? "m6 3 5 5-5 5" : "m10 3-5 5 5 5"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function RealmCalendar({ today, events, compact = false, initialDate }: Props) {
  const [selected, setSelected] = useState(initialDate ?? today);
  const gridRef = useRef<HTMLDivElement>(null);
  const monthEvents = useMemo(() => eventsInMoon(events, selected.year, selected.moon), [events, selected.year, selected.moon]);
  const dayEvents = eventsOnDay(monthEvents, selected.day);
  const approximate = monthEvents.filter(event => event.day === undefined);
  const moonOptions = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: `${ordinal(index + 1)} Moon` }));
  const latestYear = Math.max(today.year, selected.year);
  const yearOptions = Array.from({ length: latestYear + 1 }, (_, index) => ({ value: String(latestYear - index), label: `${latestYear - index} AC` }));
  const changeMoon = (step: number) => {
    const index = selected.year * 12 + selected.moon - 1 + step;
    if (index < 0) return;
    setSelected({ ...selected, year: Math.floor(index / 12), moon: index % 12 + 1 });
  };
  const eventCard = (event: CalendarEvent) => <article key={event.id} className={styles.event}>
    <div className={styles.eventMeta}><span className={styles.eventType} data-kind={event.type}>{CALENDAR_LABELS[event.type] ?? "Chronicle"}</span>{event.location && <span>{event.location}</span>}</div>
    <h4>{event.title}</h4>
    {event.dateLabel && <small>{event.dateLabel}</small>}
    <p>{event.description}</p>
    {event.href && <Link href={event.href}>{event.type === "nameday" ? "View character" : event.chapterTitle ?? "Read the chapter"} <span aria-hidden="true">→</span></Link>}
  </article>;

  return <section className={`${styles.calendar} ${compact ? styles.compact : ""}`} aria-label={compact ? "The Realm Today calendar" : "Calendar"}>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>{compact ? "The Realm Today" : "The Reckoning of the Realm"}</span><h2>{compact ? <Link href="/calendar">Calendar</Link> : "The Passing Moons"}</h2></div>
      <button type="button" className={styles.todayButton} onClick={() => setSelected(today)}>Today</button>
    </header>
    <p className={styles.presentDate}>{calendarDateLabel(today)}<span>After Aegon’s Conquest</span></p>
    <div className={styles.controls}>
      <div className={styles.moonControl}>
        <button type="button" aria-label="Previous moon" disabled={selected.year === 0 && selected.moon === 1} onClick={() => changeMoon(-1)}><Arrow /></button>
        <div className={styles.select}><SearchableSelect options={moonOptions} value={String(selected.moon)} onChange={moon => setSelected({ ...selected, moon: Number(moon) })} aria-label="Choose moon" searchPlaceholder="Find a moon…" /></div>
        <button type="button" aria-label="Next moon" onClick={() => changeMoon(1)}><Arrow right /></button>
      </div>
      <div className={styles.yearControl}>
        <button type="button" aria-label="Previous year" disabled={selected.year === 0} onClick={() => setSelected({ ...selected, year: selected.year - 1 })}><Arrow /></button>
        <div className={styles.select}><SearchableSelect options={yearOptions} value={String(selected.year)} onChange={year => setSelected({ ...selected, year: Number(year) })} aria-label="Choose year" searchPlaceholder="Find a year…" /></div>
        <button type="button" aria-label="Next year" onClick={() => setSelected({ ...selected, year: selected.year + 1 })}><Arrow right /></button>
      </div>
    </div>
    <div className={styles.moonHeading} aria-live="polite"><span>{ordinal(selected.moon)} Moon <span aria-hidden="true">·</span> {selected.year} AC</span>{!compact && <span>30 days</span>}</div>
    <div className={styles.grid} ref={gridRef} role="group" aria-label={`Days of the ${ordinal(selected.moon)} Moon, ${selected.year} AC`}>
      {Array.from({ length: 30 }, (_, index) => {
        const day = index + 1;
        const date = { ...selected, day };
        const entries = eventsOnDay(monthEvents, day);
        const isToday = today.day === day && today.moon === selected.moon && today.year === selected.year;
        const kinds = [...new Set(entries.map(event => event.type))];
        return <button type="button" key={day} className={styles.day} data-day={day} aria-current={isToday ? "date" : undefined} aria-pressed={selected.day === day}
          aria-label={`${calendarDateLabel(date)}${isToday ? ", today" : ""}${entries.length ? `, ${entries.length} ${entries.length === 1 ? "event" : "events"}` : ""}`}
          onClick={() => setSelected(date)} onKeyDown={event => {
            const step = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
            const target = event.key === "Home" ? 1 : event.key === "End" ? 30 : step ? Math.max(1, Math.min(30, day + step)) : null;
            if (target !== null) { event.preventDefault(); gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${target}"]`)?.focus(); }
          }}>
          <span className={styles.dayNumber}>{day}</span>
          <span className={styles.dots} aria-hidden="true">{kinds.slice(0, 3).map(kind => <i key={kind} data-kind={kind} />)}{kinds.length > 3 && <span>+</span>}</span>
          {!compact && entries.length > 0 && <span className={styles.dayCaption}>{entries[0].title}{entries.length > 1 && <small>+{entries.length - 1} more</small>}</span>}
        </button>;
      })}
      {Array.from({ length: 5 }, (_, index) => <span key={`blank-${index}`} className={styles.blankDay} aria-hidden="true" />)}
    </div>
    <div className={styles.legend}><span><i /> Event</span><span><i data-kind="nameday" /> Nameday</span><span><i data-kind="battle" /> Battle / Trial</span></div>
    <section className={styles.details} aria-live="polite" aria-label="Selected day events">
      <h3>{calendarDateLabel(selected)}</h3>
      {dayEvents.length ? dayEvents.map(eventCard) : <p className={styles.empty}>No events recorded for this day.</p>}
    </section>
    {approximate.length > 0 && <section className={styles.approximate} aria-label="Events without an exact day"><h3>Elsewhere this moon</h3><p className={styles.empty}>The chronicles place these events within this moon; their exact day is unrecorded.</p>{approximate.map(eventCard)}</section>}
    {compact && <Link className={styles.fullLink} href={calendarHref(selected)}>Open the full calendar <span aria-hidden="true">→</span></Link>}
  </section>;
}
