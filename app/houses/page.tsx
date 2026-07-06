import Link from "next/link";

import { getHouses } from "@/lib/houses";
import styles from "./houses.module.css";

export default function Houses() {
  const houses = getHouses();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Great Houses of the Realm</h1>

        <p className={styles.subheading}>
          The blood, banners, and rivalries that shape the Seven Kingdoms.
        </p>

        <ul className={styles.list}>
          {houses.map((house) => (
            <li key={house.slug} className={styles.listItem}>
              <Link
                href={`/houses/${house.slug}`}
                className={styles.card}
              >
                <h2 className={styles.title}>{house.name}</h2>

                <p className={styles.memberCount}>
                  {house.members.length}{" "}
                  {house.members.length === 1 ? "member" : "members"}
                </p>

                <p className={styles.memberPreview}>
                  {house.members
                    .slice(0, 4)
                    .map((member) => member.name.split(" ")[0])
                    .join(", ")}
                  {house.members.length > 4 && ", ..."}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
