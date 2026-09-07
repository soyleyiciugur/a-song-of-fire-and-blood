import Link from "next/link";
import worldDate from "../../data/worldDate.json";
import characters from "../../data/characters/characters.json";
import { getUpcomingEvents, type UpcomingEvent } from "../../lib/events";
import { formatDaysUntil, formatNameday } from "../../lib/age";

const TYPE_LABEL: Record<UpcomingEvent["type"], string> = {
  nameday: "Nameday",
  feast: "Feast",
  battle: "Battle",
  wedding: "Wedding",
  trial: "Trial",
  other: "Event",
};

const TYPE_COLOR: Record<UpcomingEvent["type"], string> = {
  nameday: "#c9a227",
  feast: "#c9a227",
  wedding: "#c9a227",
  battle: "#B22222",
  trial: "#8B6914",
  other: "#8a8a92",
};

export default function WorldDateCard() {
  // Fetch a larger pool of events, filter them, then take exactly the first 5.
  const upcoming = getUpcomingEvents(worldDate, 50)
    .filter((event: any) => {
      const charId =
        event.characterId ||
        (event.href?.startsWith("/characters/")
          ? event.href.split("/characters/")[1]
          : null);

      if (charId) {
        const character: any = characters.find((c: any) => c.id === charId);

        // Public-facing card: do not let a secret death leak through the
        // disappearance of an otherwise expected nameday.
        if (character?.status === "Dead") {
          return false;
        }
      }

      const char: any = event.character;
      if (char?.status === "Dead") {
        return false;
      }

      return true;
    })
    .slice(0, 5);

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
