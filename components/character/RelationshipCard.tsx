import Link from "next/link";

import { getCharacter } from "@/lib/characters";

type Props = {
  id: string;
  description: string;
};

export default function RelationshipCard({ id, description }: Props) {
  const related = getCharacter(id);

  return (
    <article
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
        {related ? (
          <Link href={`/characters/${related.id}`} style={{ color: "inherit", textDecoration: "none" }}>
            {related.name}
          </Link>
        ) : (
          id
        )}
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
    </article>
  );
}
