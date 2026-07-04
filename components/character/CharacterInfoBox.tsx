import Image from "next/image";
import { characters } from "@/data/characters";
import type { Character, CharacterStatus } from "@/types/character";

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

const statusMap: Record<
  CharacterStatus,
  { label: string; color: string; icon: string }
> = {
  Alive: {
    label: "Alive",
    color: "#39d353",
    icon: "●",
  },
  Dead: {
    label: "Dead",
    color: "#f85149",
    icon: "✕",
  },
  Missing: {
    label: "Missing",
    color: "#f59e0b",
    icon: "?",
  },
  Unknown: {
    label: "Unknown",
    color: "#8b949e",
    icon: "–",
  },
};

function StatusValue({ status }: { status: CharacterStatus }) {
  const item = statusMap[status];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        color: item.color,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
          width: 14,
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        {item.icon}
      </span>

      <span>{item.label}</span>
    </span>
  );
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
          priority
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

        <InfoRow label="House" value={character.house} />
        <InfoRow
          label="Status"
          value={<StatusValue status={character.status} />}
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