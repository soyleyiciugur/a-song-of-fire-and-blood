import { getCharacter } from "@/lib/characters";
import CharacterInfoBox from "@/components/character/CharacterInfoBox";
import CharacterQuote from "@/components/character/CharacterQuote";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CharacterPage({ params }: Props) {
  const { id } = await params;

  const character = getCharacter(id);

  if (!character) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--text)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Character not found
      </main>
    );
  }

  return (
    <main
      style={{
        background: "var(--background)",
        color: "var(--text)",
        minHeight: "100vh",
        padding: "60px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "var(--container-width)",
          margin: "0 auto",
        }}
      >
        {/* Header */}

        <h1
          style={{
            fontSize: 48,
            color: "var(--gold)",
            marginTop: 0,
            marginBottom: 8,
            lineHeight: 1.15,
          }}
        >
          {character.name}
        </h1>

        {character.nickname !== "-" && (
          <p
            style={{
              color: "var(--muted)",
              fontStyle: "italic",
              fontSize: 22,
              marginTop: 0,
              marginBottom: 10,
            }}
          >
            "{character.nickname}"
          </p>
        )}

        <p
          style={{
            color: "var(--muted)",
            fontSize: 18,
            marginBottom: 40,
          }}
        >
          {character.title}
        </p>

        {/* Main Layout */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* LEFT */}

          <div>
            {/* Biography */}

            <section
              style={{
                marginBottom: 40,
              }}
            >
              <h2
                style={{
                  color: "var(--gold)",
                  marginBottom: 18,
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 10,
                }}
              >
                Biography
              </h2>

              <p
                style={{
                  lineHeight: 1.9,
                  color: "var(--text)",
                  fontSize: 17,
                }}
              >
                {character.summary}
              </p>
            </section>

            {/* Traits */}

            <section
              style={{
                marginBottom: 40,
              }}
            >
              <h2
                style={{
                  color: "var(--gold)",
                  marginBottom: 20,
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 10,
                }}
              >
                Traits
              </h2>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                {character.traits.map((trait) => (
                  <span
                    key={trait}
                    style={{
                      padding: "8px 14px",
                      background: "var(--surface-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 999,
                      color: "var(--text)",
                      fontSize: 15,
                    }}
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </section>

            {/* Relationships */}

            <section style={{ marginBottom: 40 }}>
              <h2
                style={{
                  color: "var(--gold)",
                  marginBottom: 20,
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: 10,
                }}
              >
                Relationships
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {Object.entries(character.relationships ?? {}).map(
                  ([key, description]) => {
                    const related = getCharacter(key);

                    return (
                      <div
                        key={key}
                        style={{
                          background: "var(--surface)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: 18,
                        }}
                      >
                        <h3
                          style={{
                            marginTop: 0,
                            marginBottom: 8,
                            color: "var(--text)",
                          }}
                        >
                          {related ? related.name : key}
                        </h3>

                        <p
                          style={{
                            margin: 0,
                            color: "var(--muted)",
                            lineHeight: 1.7,
                          }}
                        >
                          {description}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            {(character.quote || character.quotes?.length) && (
              <section>
                <h2
                  style={{
                    color: "var(--gold)",
                    marginBottom: 18,
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: 10,
                  }}
                >
                  Notable Quotes
                </h2>
                <CharacterQuote quote={character.quotes?.length ? character.quotes : character.quote} />
              </section>
            )}
          </div>

          {/* RIGHT */}

          <CharacterInfoBox character={character} />
        </div>
      </div>
    </main>
  );
}