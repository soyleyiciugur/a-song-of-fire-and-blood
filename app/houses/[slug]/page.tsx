import Link from "next/link";

import { getHouse, getHouses } from "@/lib/houses";
import { getTitleRank } from "@/constants/titles";
import MiniPortrait from "@/components/MiniPortrait";

import styles from "./house.module.css";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getHouses().map((house) => ({ slug: house.slug }));
}

export default async function HousePage({ params }: Props) {
  const { slug } = await params;

  const house = getHouse(slug);

  if (!house) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "var(--background)",
          color: "var(--text)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        House not found
      </main>
    );
  }

  const members = [...house.members].sort((a, b) => {
    const rankA = getTitleRank(a.title);
    const rankB = getTitleRank(b.title);

    if (rankA !== rankB) return rankA - rankB;

    return a.name.localeCompare(b.name);
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <p className={styles.breadcrumb}>
          <Link href="/houses" className={styles.breadcrumbLink}>
            Houses
          </Link>{" "}
          / {house.name}
        </p>

        <h1 className={styles.heading}>{house.name}</h1>

        <p className={styles.subheading}>
          {members.length} sworn {members.length === 1 ? "member" : "members"}
        </p>

        <section>
          <h2 className={styles.sectionTitle}>Members</h2>

          <ul className={styles.list}>
            {members.map((member) => (
              <li key={member.id} className={styles.listItem}>
                <Link
                  href={`/characters/${member.id}`}
                  className={styles.card}
                >
                  <MiniPortrait id={member.id} alt={member.name} />

                  <span className={styles.memberInfo}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberTitle}>
                      {member.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
