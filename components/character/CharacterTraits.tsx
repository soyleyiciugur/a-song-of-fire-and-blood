import TraitBadge from "./TraitBadge";

type Props = {
  traits: string[];
};

export default function CharacterTraits({ traits }: Props) {
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
        Traits
      </h2>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {traits.map((trait) => (
          <TraitBadge key={trait}>{trait}</TraitBadge>
        ))}
      </div>
    </section>
  );
}
