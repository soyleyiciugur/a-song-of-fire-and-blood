import Link from "next/link";
import worldDate from "@/data/worldDate.json";
import characters from "@/data/characters/characters.json";
import { getUpcomingEvents, type UpcomingEvent } from "@/lib/events";
import { formatDaysUntil, formatNameday } from "@/lib/age";
import styles from "./worldDateCard.module.css";

const TYPE_LABEL: Record<UpcomingEvent["type"], string> = {
  nameday: "Nameday", feast: "Feast", battle: "Battle", wedding: "Wedding", trial: "Trial", other: "Event",
};

const TYPE_CLASS: Record<UpcomingEvent["type"], string> = {
  nameday: styles.nameday, feast: styles.feast, battle: styles.battle,
  wedding: styles.wedding, trial: styles.trial, other: styles.other,
};

export default function WorldDateCard() {
  const upcoming = getUpcomingEvents(worldDate, 50)
    .filter((event: any) => {
      const charId = event.characterId || (event.href?.startsWith("/characters/") ? event.href.split("/characters/")[1] : null);
      const character: any = charId ? characters.find((item: any) => item.id === charId) : event.character;
      return !character?.hidden && character?.status !== "Dead";
    })
    .slice(0, 5);

  return (
    <aside className={styles.card}>
      <div className={styles.content}>
        <h2>The Realm Today</h2>
        <div className={styles.date}>{formatNameday(worldDate, worldDate.era)}</div>
        <div className={styles.sectionLabel}>Upcoming</div>
        {upcoming.length === 0 ? (
          <div className={styles.empty}>Nothing on the horizon.</div>
        ) : (
          <div className={styles.list}>
            {upcoming.map((event, index) => {
              const row = (
                <div className={`${styles.row} ${index === 0 ? styles.firstRow : ""}`}>
                  <div className={styles.eventText}>
                    <div className={styles.eventTitle}>{event.title}</div>
                    <div className={`${styles.type} ${TYPE_CLASS[event.type]}`}>{TYPE_LABEL[event.type]}</div>
                  </div>
                  <div className={styles.countdown}>{formatDaysUntil(event.daysUntil)}</div>
                </div>
              );
              return event.href ? <Link key={`${event.type}-${event.title}-${index}`} href={event.href} className={styles.eventLink}>{row}</Link> : <div key={`${event.type}-${event.title}-${index}`}>{row}</div>;
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
