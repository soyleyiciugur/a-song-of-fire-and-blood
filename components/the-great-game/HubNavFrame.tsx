"use client";

import Image from "next/image";
import HubNav, { type HubSection } from "./HubNav";
import type { HubData } from "@/lib/the-great-game/hub";
import styles from "./play-hub.module.css";

export default function HubNavFrame({
  active,
  data,
  guest,
  showSign = false,
  className,
}: {
  active: HubSection;
  data: HubData | null;
  guest: boolean;
  showSign?: boolean;
  className?: string;
}) {
  return (
    <div className={`${styles.navGroup} ${className ?? ""}`}>
      <HubNav active={active} data={data} guest={guest} />
      {showSign && (
        <div className={styles.innSign}>
          <Image
            src="/images/cards/hub/cupbearer-sign.png"
            alt="The Cupbearer — a hand offering a golden cup"
            width={700}
            height={300}
            unoptimized
            priority
          />
        </div>
      )}
    </div>
  );
}
