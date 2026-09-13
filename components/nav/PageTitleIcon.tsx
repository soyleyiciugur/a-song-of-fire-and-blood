import UtilityIcon, { type UtilityIconName } from "./UtilityIcon";
import styles from "./pageTitleIcon.module.css";

export default function PageTitleIcon({ name }: { name: UtilityIconName }) {
  return <span className={styles.icon} aria-hidden="true"><UtilityIcon name={name} /></span>;
}
