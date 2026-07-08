import RelationshipCard from "./RelationshipCard";

type Props = {
  relationships?: Record<string, string> | null;
};

export default function CharacterRelationships({ relationships }: Props) {
  const entries = Object.entries(relationships ?? {});

  if (entries.length === 0) return null;

  return (
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
        {entries.map(([id, description]) => (
          <RelationshipCard key={id} id={id} description={description} />
        ))}
      </div>
    </section>
  );
}
