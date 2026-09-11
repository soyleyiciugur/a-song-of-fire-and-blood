import Image from "next/image";
import Link from "next/link";
import { getRandomSeriousGalleryItem } from "@/lib/gallery";
import styles from "./ravenEyeCard.module.css";

export default function RavenEyeCard() {
  const item = getRandomSeriousGalleryItem();
  if (!item) return null;

  return (
    <Link href={`/ravens-eye?item=${item.id}&returnTo=${encodeURIComponent("/")}`} className={`${styles.card} card card-padding`}>
      <span className="home-quote-label">From the Raven&apos;s Eye</span>
      <div className={styles.imageWrap}>
        <Image src={item.src} alt={item.caption || "Raven's Eye"} fill className={styles.image} />
      </div>
      {item.caption && <p className={styles.caption}>{item.caption}</p>}
    </Link>
  );
}
