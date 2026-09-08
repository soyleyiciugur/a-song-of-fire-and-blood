import styles from "./characterContent.module.css";

type Props = {
  children: React.ReactNode;
};

export default function TraitBadge({ children }: Props) {
  return <span className={styles.traitBadge}>{children}</span>;
}
