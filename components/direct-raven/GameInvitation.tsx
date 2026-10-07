import Link from "next/link";
import styles from "./direct-raven.module.css";

export default function GameInvitation({ code }: { code: string }) {
  return <Link href={`/cards/play?join=${encodeURIComponent(code)}`} className={`${styles.sharedPageCard} ${styles.gameInvitation}`}>
    <span className={styles.sharedPageIcon} aria-hidden="true">⚔</span>
    <span className={styles.sharedReelCopy}><small>The Great Game · Private invitation</small><strong>A seat at The Cupbearer</strong><span>Mara: “Your rival has kept a seat for you.”</span><em>Choose your deck & join · {code}</em></span>
  </Link>;
}
