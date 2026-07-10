import Link from "next/link";

import { timeline } from "@/data/timeline";
import { getCharacter } from "@/lib/characters";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./timeline.module.css";

export default function Timeline() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Timeline</h1>

        <p className={styles.subheading}>
          The major turns of the realm, chapter by chapter.
        </p>

        <div className={styles.chapters}>
          {timeline.map((chapter) => (
            <section key={chapter.chapterSlug} className={styles.chapterBlock}>
              <Link href={`/chapters/${chapter.chapterSlug}`} className={styles.chapterTitle}>
                {chapter.chapterTitle}
              </Link>
              {chapter.date && (
                <p className={styles.chapterDate}>{chapter.date}</p>
              )}

              <ol className={styles.eventList}>
                {chapter.events.map((event) => (
                  <li key={event.title} className={styles.event}>
                    <div className={styles.eventMarker} />

                    <div className={styles.eventBody}>
                      <h3 className={styles.eventTitle}>{event.title}</h3>
                      {event.date && (
                        <p className={styles.eventDate}>{event.date}</p>
                      )}

                      <p className={styles.eventDescription}>
                        {event.description}
                      </p>

                      {event.characters && event.characters.length > 0 && (
                        <div className={styles.eventCharacters}>
                          {event.characters.map((id) => {
                            const character = getCharacter(id);
                            if (!character) return null;

                            return (
                              <Link
                                key={id}
                                href={`/characters/${id}`}
                                className={styles.characterChip}
                              >
                                <MiniPortrait
                                  id={id}
                                  alt={character.name}
                                />
                                <span>{character.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
