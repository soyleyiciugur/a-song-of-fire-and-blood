import type { CSSProperties } from "react";

import { linkifyCharacterNames } from "@/lib/character-links";
import styles from "./linkedParagraph.module.css";

type Props = {
  text: string;
  style?: CSSProperties;
};

export default function LinkedParagraph({ text, style }: Props) {
  return (
    <p className={styles.paragraph} style={style}>
      {linkifyCharacterNames(text)}
    </p>
  );
}
