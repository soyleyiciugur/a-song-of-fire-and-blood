import Link from "next/link";

import { getCharacter } from "@/lib/characters";
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
    return (
      <Link
        href={`/characters/${character.id}`}
        className={`${styles.person} ${dimmed ? styles.dimmed : ""}`}
      >
        <MiniPortrait id={character.id} alt={character.name} />

        <span className={styles.personName}>
          {character.name}
        </span>
      </Link>
    );
  }

  return (
    <span className={`${styles.person} ${styles.unlinked}`}>
      <span className={styles.unlinkedAvatar}>?</span>

      <span className={styles.personName}>{name ?? "Unknown"}</span>
    </span>
  );
}
