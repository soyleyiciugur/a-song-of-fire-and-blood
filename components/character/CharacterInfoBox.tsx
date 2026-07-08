import Image from "next/image";
import Link from "next/link";
import { characters } from "@/data/characters";
import type { Character } from "@/types/character";
import { slugifyHouse } from "@/lib/houses";
import StatusReveal from "./StatusReveal";

type Props = {
  character: Character;
};

const DEFAULT_PORTRAIT = "/images/default.webp";

function isValidValue(value?: string | null) {
  return value && value !== "-" ? value : null;
}

function getCharacterName(id?: string | null) {
  if (!isValidValue(id)) return "-";

  const character = characters[id as keyof typeof characters];

  return character?.name ?? id;
}

export default function CharacterInfoBox({ character }: Props) {
  const portraitSrc = character.portrait ?? DEFAULT_PORTRAIT;

  return (
    <aside
      style={{
        width: "100%",
        maxWidth: 340,
        background: "#141418",
        border: "1px solid #2b2b31",
        borderRadius: 12,
        overflow: "hidden",
        position: "sticky",
        top: 30,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          background: "#0f0f12",
        }}
      >
        <Image
          src={portraitSrc}
          alt={character.name}
          fill
          preload
          sizes="340px"
          style={{ objectFit: "cover" }}
        />
      </div>

      <div style={{ padding: 20 }}>
        <h2
          style={{
            color: "#c9a227",
            marginTop: 0,
            marginBottom: 20,
            fontSize: 24,
            textAlign: "center",
          }}
        >
          Information
        </h2>

        <InfoRow
          label="House"
          value={
            isValidValue(character.house) ? (
              <Link
                href={`/houses/${slugifyHouse(character.house)}`}
                style={{ color: "#c9a227", textDecoration: "none" }}
              >
                {character.house}
              </Link>
            ) : (
              character.house
            )
          }
        />
        <InfoRow
          label="Status"
          value={
            <StatusReveal
              status={character.status}
              secret={character.secret}
            />
          }
        />
        <InfoRow label="Title" value={character.title} />
        <InfoRow label="Age" value={String(character.age)} />
        <InfoRow label="Height" value={character.height ?? "-"} />
        <InfoRow label="Dragon" value={character.dragon ?? "-"} />

        <InfoRow label="Father" value={getCharacterName(character.father)} />
        <InfoRow label="Mother" value={getCharacterName(character.mother)} />
        <InfoRow label="Spouse" value={getCharacterName(character.spouse)} />
        <InfoRow label="Mentor" value={getCharacterName(character.mentor)} />
      </div>
    </aside>
  );
}

type RowProps = {
  label: string;
  value: React.ReactNode;
};

function InfoRow({ label, value }: RowProps) {
  return (
    <div
      style={{
        borderTop: "1px solid #26262c",
        padding: "12px 0",
      }}
    >
      <div
        style={{
          color: "#888",
          fontSize: 13,
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>

      <div
        style={{
          color: "#ececec",
          fontSize: 16,
          lineHeight: 1.4,
        }}
      >
        {value ?? "-"}
      </div>
    </div>
  );
}
