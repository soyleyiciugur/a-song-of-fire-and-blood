// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\character\CharacterHeader.tsx
import type { Character } from "@/types/character";

type Props = {
  character: Character;
};

export default function CharacterHeader({ character }: Props) {
  return (
    <header style={{ marginBottom: 40 }}>
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
          <q>{character.nickname}</q>
        </p>
      )}

      <p
        style={{
          color: "var(--muted)",
          fontSize: 18,
          marginBottom: 0,
        }}
      >
        {character.title}
      </p>
    </header>
  );
}
