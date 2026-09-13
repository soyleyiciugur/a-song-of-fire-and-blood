import type { Metadata } from "next";
import Link from "next/link";
import worldDate from "@/data/worldDate.json";
import { getCalendarEvents } from "@/data/calendar";
import RealmCalendar from "@/components/calendar/RealmCalendar";
import { getUpcomingEvents } from "@/lib/events";
import { formatDaysUntil } from "@/lib/age";
import { CALENDAR_LABELS, calendarDateFromOrder, calendarDateLabel, calendarHref } from "@/lib/calendar";
import { timelineDateOrder } from "@/lib/timeline-date";
import chronicle from "@/app/chronicle/chronicle.module.css";
import styles from "./calendar.module.css";

export const metadata: Metadata = { title: "Calendar | A Song of Fire and Blood", description: "The moons of the realm: namedays, feasts and the events of the Chronicle." };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ year?: string; moon?: string; day?: string }> }) {
  const query = await searchParams;
  const numberInRange = (value: string | undefined, fallback: number, min: number, max: number) => {
    const parsed = value === undefined ? fallback : Number(value);
    return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
  };
  const date = { year: numberInRange(query.year, worldDate.year, 0, 9999), moon: numberInRange(query.moon, worldDate.moon, 1, 12), day: numberInRange(query.day, worldDate.day, 1, 30) };
  const upcoming = getUpcomingEvents(worldDate, 10);

  return <main className={chronicle.page}><div className={styles.container}>
    <p className={chronicle.eyebrow}>Twelve moons. Thirty days. The history of a realm.</p>
    <h1 className="realm-page-title">Calendar</h1>
    <p className={chronicle.lead}>Namedays, gatherings, and the days that shaped the Seven Kingdoms.</p>
    <nav className={`${chronicle.tabs} realm-section-tabs`} aria-label="Chronicle sections">
      <Link href="/timeline">Timeline</Link><Link href="/chronicle">Annals</Link><Link aria-current="page" className={chronicle.activeTab} href="/calendar">Calendar</Link><Link href="/wars">The Bloodshed</Link>
    </nav>
    <div className={styles.layout}>
      <RealmCalendar key={`${date.year}-${date.moon}-${date.day}`} today={worldDate} initialDate={date} events={getCalendarEvents()} />
      <aside className={styles.upcoming} aria-label="Upcoming namedays and events">
        <span className={styles.eyebrow}>On the horizon</span><h2>Upcoming</h2><p className={styles.intro}>From {calendarDateLabel(worldDate)}</p>
        {upcoming.length ? upcoming.map((event, index) => {
          const eventDate = calendarDateFromOrder(timelineDateOrder(worldDate) + event.daysUntil);
          return <Link href={calendarHref(eventDate)} className={styles.event} key={`${event.title}-${index}`}>
            <span className={styles.dateTile}><strong>{eventDate.day}</strong><small>{eventDate.moon} Moon</small></span>
            <span className={styles.eventBody}><small>{CALENDAR_LABELS[event.type]} <span>· {formatDaysUntil(event.daysUntil)}</span></small><strong>{event.title}</strong><span>{calendarDateLabel(eventDate)}</span></span>
          </Link>;
        }) : <p className={styles.intro}>Nothing on the horizon.</p>}
      </aside>
    </div>
  </div></main>;
}
