import Image from "next/image";
import Link from "next/link";

import { isLuckAdmin } from "@/lib/adminAccess";
import { getHouseOfDragonTree } from "@/lib/houseOfDragonStore";

import HouseOfDragonTree from "./HouseOfDragonTree";
import styles from "./house-of-the-dragon.module.css";

export const dynamic = "force-dynamic";

export default async function HouseOfTheDragonPage() {
  const [canEdit, tree] = await Promise.all([isLuckAdmin(), getHouseOfDragonTree()]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className="realm-section-tabs" aria-label="House sections">
          <Link href="/houses">Houses</Link>
          <Link aria-current="page" href="/houses/house-of-the-dragon">House of the Dragon</Link>
          <Link href="/succession">Succession</Link>
        </nav>

        <header className={styles.hero}>
          <Image
            src="/images/houses/targaryen.webp"
            alt="House Targaryen"
            width={92}
            height={92}
            className={styles.heroSigil}
            priority
          />
          <div>
            <span className={styles.eyebrow}>Houses · House Targaryen</span>
            <h1 className={styles.title}>House of the Dragon</h1>
          </div>
          <p className={styles.subtitle}>
            The blood of the dragon from Aegon the Conqueror to the present royal court. The golden spine follows the kingship line to Baelenys; crowned cards mark those who have sat the Iron Throne.
          </p>
        </header>

        <HouseOfDragonTree initialTree={tree} canEdit={canEdit} />
      </div>
    </main>
  );
}
