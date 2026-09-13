import Image from "next/image";
import NotificationSourceIcon from "./NotificationSourceIcon";
import { MASCOT_META, type NotificationMascot, type NotificationSource } from "@/lib/notifications/types";
import styles from "./notificationPortrait.module.css";

export default function NotificationPortrait({ mascot, source, size = 48, className = "" }: { mascot: NotificationMascot; source: NotificationSource; size?: number; className?: string }) {
  const meta = MASCOT_META[mascot];
  return <span className={`${styles.portrait} ${className}`.trim()} style={{ "--notification-portrait-size": `${size}px` } as React.CSSProperties}>
    <Image src={meta.portrait} alt="" width={size} height={size} />
    <span className={styles.badge} aria-hidden="true"><NotificationSourceIcon source={source} size={Math.max(12, Math.round(size * .34))} /></span>
  </span>;
}
