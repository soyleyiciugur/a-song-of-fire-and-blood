// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\home\WorldDateCard.tsx
import Link from "next/link";
import worldDate from "../../data/worldDate.json";
import characters from "../../data/characters/characters.json";
import { getUpcomingEvents, type UpcomingEvent } from "../../lib/events";
import { formatNameday } from "../../lib/age";

const TYPE_LABEL: Record<UpcomingEvent["type"], string> = {
  nameday: "Nameday",
  feast: "Feast",
  battle: "Battle",
  other: "Event",
  wedding: "Wedding",
};

const TYPE_COLOR: Record<UpcomingEvent["type"], string> = {
  nameday: "#c9a227",
  feast: "#c9a227",
  wedding: "#c9a227",
  battle: "#B22222",
  other: "#8a8a92",
};

function formatDaysUntil(daysUntil: number) {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
}

export default function WorldDateCard() {
  // Fetch a larger pool of events, filter them, then take exactly the first 5
  const upcoming = getUpcomingEvents(worldDate, 50)
    .filter((event: any) => {
      const charId =
        event.characterId ||
        (event.href?.startsWith("/characters/")
          ? event.href.split("/characters/")[1]
          : null);

      if (charId) {
        // Explicitly type as any to prevent TS union type errors
        const character: any = characters.find((c: any) => c.id === charId);

        // Check for nested secret.status
        if (
          character &&
          (character.status === "Dead" || character.secret?.status === "Dead")
        ) {
          return false;
        }
      }

      const char: any = event.character;
      if (char && (char.status === "Dead" || char.secret?.status === "Dead")) {
        return false;
      }

      return true;
    })
    .slice(0, 5); // Ensure we only display 5 events after filtering

  return (
    <aside
      style={{
        width: "100%",
        maxWidth: 1000,
        background: "#141418",
        border: "1px solid #2b2b31",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: 20 }}>
        <h2
          style={{
            color: "#c9a227",
            marginTop: 0,
            marginBottom: 4,
            fontSize: 24,
            textAlign: "center",
          }}
        >
          The Realm Today
        </h2>
        <div
          style={{
            textAlign: "center",
            color: "#ececec",
            fontSize: 16,
            marginBottom: 20,
          }}
        >
          {formatNameday(worldDate, worldDate.era)}
        </div>

        <div
          style={{
            color: "#888",
            fontSize: 13,
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: 1,
            borderTop: "1px solid #26262c",
            paddingTop: 16,
          }}
        >
          Upcoming
        </div>

        {upcoming.length === 0 ? (
          <div style={{ color: "#888", fontSize: 14, fontStyle: "italic" }}>
            Nothing on the horizon.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {upcoming.map((event, i) => {
              const row = (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid #26262c",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "#ececec",
                        fontSize: 15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.title}
                    </div>
                    <div
                      style={{
                        color: TYPE_COLOR[event.type],
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginTop: 2,
                        textAlign: "left",
                      }}
                    >
                      {TYPE_LABEL[event.type]}
                    </div>
                  </div>
                  <div
                    style={{
                      color: "#888",
                      fontSize: 13,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    {formatDaysUntil(event.daysUntil)}
                  </div>
                </div>
              );

              return event.href ? (
                <Link
                  key={`${event.type}-${event.title}-${i}`}
                  href={event.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {row}
                </Link>
              ) : (
                <div key={`${event.type}-${event.title}-${i}`}>{row}</div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}