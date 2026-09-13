// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\familytree\PersonNode.tsx

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

        <span className={styles.personName}>
          {character.name}
        </span>
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

      <span className={styles.personName}>
        {name ?? "Unknown"}
      </span>
    </span>
  );
}
