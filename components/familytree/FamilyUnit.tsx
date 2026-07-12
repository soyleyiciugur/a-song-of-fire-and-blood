// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\components\familytree\FamilyUnit.tsx
import type { ReactNode } from "react";

import Union from "./Union";
import styles from "./familytree.module.css";

type Person = {
  id?: string;
  name?: string;
};

type Props = {
  parentA: Person;
  parentB?: Person;
  childrenLabel?: string;
  children?: ReactNode;
};

export default function FamilyUnit({
  parentA,
  parentB,
  childrenLabel = "Children",
  children,
}: Props) {
  return (
    <div className={styles.familyUnit}>
      <Union a={parentA} b={parentB} />

      {children && (
        <>
          <div className={styles.dropline} />
          <p className={styles.childrenLabel}>{childrenLabel}</p>
          <div className={styles.childrenRow}>{children}</div>
        </>
      )}
    </div>
  );
}
