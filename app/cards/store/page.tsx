"use client";

import Image from "next/image";
import HubNavFrame from "@/components/the-great-game/HubNavFrame";
import { useHubData } from "@/components/the-great-game/useHubData";
import styles from "./store.module.css";

export default function StorePage() {
  const { data, guest } = useHubData();

  return <main className={styles.page}>
    <div className={styles.backdrop} aria-hidden="true" />
    <HubNavFrame active="store" data={data} guest={guest} />
    <div className={styles.storeSign} aria-hidden="true">
      <Image
        src="/images/cards/hub/cupbearer-sign-chainless.webp"
        alt=""
        width={1902}
        height={827}
        unoptimized
        priority
      />
    </div>
    <section className={styles.card}>
      <span className={styles.eyebrow}>The Cupbearer · Store</span>
      <h1>Store coming soon.</h1>
      <p>“Not yet, my liege. The shelves are being counted and the good stock is still on the road. I&apos;ll open the doors when there&apos;s something worth putting your coin down for.”</p>
      <small>— Aldren</small>
    </section>
  </main>;
}
