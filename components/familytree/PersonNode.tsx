import Link from "next/link";

import { getCharacter } from "@/lib/characters";
import { houses } from "@/data/houses";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./familytree.module.css";

type Props = {
  id?: string;
  name?: string;
  dimmed?: boolean;
};

const ROMAN_NUMERAL = /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)$/i;

function splitDisplayName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { primary: "Unknown", secondary: undefined as string | undefined };

  const parts = trimmed.split(/\s+/);
  if (parts.length <= 1) return { primary: trimmed, secondary: undefined as string | undefined };

  if (parts.length >= 3 && ROMAN_NUMERAL.test(parts[parts.length - 1])) {
    return {
      primary: parts.slice(0, -2).join(" "),
      secondary: parts.slice(-2).join(" "),
    };
  }

  return {
    primary: parts.slice(0, -1).join(" "),
    secondary: parts[parts.length - 1],
  };
}

function PersonName({ value }: { value: string }) {
  const { primary, secondary } = splitDisplayName(value);

  return (
    <span className={styles.personName}>
      <span className={styles.personNamePrimary}>{primary}</span>
      {secondary ? <span className={styles.personNameSecondary}>{secondary}</span> : null}
    </span>
  );
}

export default function PersonNode({ id, name, dimmed }: Props) {
  const character = id ? getCharacter(id) : undefined;

  if (character) {
    const house = houses.find((item) => item.name === character.house);
    return (
      <Link
        href={`/characters/${character.id}`}
        className={`${styles.person} ${dimmed ? styles.dimmed : ""}`}
      >
        <MiniPortrait
          id={character.id}
          alt={character.name}
          fallbackSrc={house ? `/images/houses/${house.id}.webp` : undefined}
          fallbackGlyph="✦"
        />

        <PersonName value={character.name} />
      </Link>
    );
  }

  return (
    <span
      className={`${styles.person} ${styles.unlinked} ${
        dimmed ? styles.dimmed : ""
      }`}
    >
      <span className={styles.unlinkedAvatar}>✦</span>

      <PersonName value={name ?? "Unknown"} />
    </span>
  );
}
