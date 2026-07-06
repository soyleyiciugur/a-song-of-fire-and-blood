import PersonNode from "./PersonNode";
import styles from "./familytree.module.css";

type Person = {
  id?: string;
  name?: string;
};

type Props = {
  a: Person;
  b?: Person;
};

export default function Union({ a, b }: Props) {
  return (
    <div className={styles.unionRow}>
      <PersonNode id={a.id} name={a.name} />

      {b && (
        <>
          <span className={styles.unionConnector}>⚭</span>
          <PersonNode id={b.id} name={b.name} />
        </>
      )}
    </div>
  );
}
