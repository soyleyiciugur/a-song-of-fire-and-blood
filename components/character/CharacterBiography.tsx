type Props = {
  summary: string;
};

export default function CharacterBiography({ summary }: Props) {
  return (
    <section style={{ marginBottom: 40 }}>
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
          margin: 0,
        }}
      >
        {summary}
      </p>
    </section>
  );
}
