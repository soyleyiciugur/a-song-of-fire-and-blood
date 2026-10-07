"use client";

import Image from "next/image";
import Link from "next/link";
import HubNav from "@/components/the-great-game/HubNav";
import { useHubData } from "@/components/the-great-game/useHubData";
import styles from "./store.module.css";

export default function StorePage() {
  const { data, guest } = useHubData();
  return <main className={styles.page}>
    <div className={styles.backdrop} aria-hidden="true" />
    <HubNav active={null} data={data} guest={guest} className={styles.hubNav} />
    <section className={styles.card}>
      <Image className={styles.sign} src="/images/cards/hub/cupbearer-sign.png" alt="The Cupbearer" width={700} height={300} unoptimized priority />
      <span className={styles.eyebrow}>The Cupbearer · Store</span>
      <h1>Store coming soon.</h1>
      <p>“Not yet, my liege. The shelves are being counted and the good stock is still on the road. I&apos;ll open the doors when there&apos;s something worth putting your coin down for.”</p>
      <small>— Aldren</small>
      <Link href="/cards/play">Back to the tables</Link>
    </section>
  </main>;
}
