// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\houses\[id]\page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";

import { getHouse, houses } from "@/data/houses";
import { getCharacters } from "@/lib/characters";
import SigilImage from "@/components/SigilImage";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./house.module.css";

type Props = {
  params: Promise<{ id: string }>;
};

// Houses that also have a dedicated section on the family tree page
const FAMILY_TREE_HOUSES = ["targaryen", "hightower", "stark", "dayne"];

export async function generateStaticParams() {
  return houses.map((house) => ({ id: house.id }));
}

export default async function HousePage({ params }: Props) {
  const { id } = await params;
  const house = getHouse(id);

  if (!house) {
    notFound();
  }

  const members = getCharacters().filter((c) => c.house === house.name);

  return (
    <main className={styles.page}>
      <div
        className={styles.container}
        style={{ "--house-color": house.color } as React.CSSProperties}
      >
        <div className={styles.header}>
          <SigilImage
            src={house.sigilSrc}
            alt={house.name}
            size={120}
            fallbackText={house.name.replace("House ", "").slice(0, 2)}
          />

          <div>
            <h1 className={styles.houseName}>{house.name}</h1>
            <p className={styles.houseWords}>&ldquo;{house.words}&rdquo;</p>
            <p className={styles.seat}>Seat: {house.seat}</p>
          </div>
        </div>

        <p className={styles.description}>{house.description}</p>

        {FAMILY_TREE_HOUSES.includes(house.id) && (
          <Link
            href={`/family-tree#house-${house.id}`}
            className={styles.treeLink}
          >
            View full family tree →
          </Link>
        )}

        <h2 className={styles.membersHeading}>Members</h2>

        {members.length === 0 ? (
          <p className={styles.empty}>No known members recorded.</p>
        ) : (
          <div className={styles.membersGrid}>
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/characters/${member.id}`}
                className={styles.memberCard}
              >
                <MiniPortrait id={member.id} alt={member.name} />

                <span>
                  <span className={styles.memberName}>{member.name}</span>
                  <span className={styles.memberTitle}>
                    {member.title !== "-" ? member.title : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}