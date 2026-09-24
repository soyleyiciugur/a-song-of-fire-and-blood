// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\family-tree\page.tsx

import Link from "next/link";

import FamilyUnit from "@/components/familytree/FamilyUnit";
import Union from "@/components/familytree/Union";
import PersonNode from "@/components/familytree/PersonNode";

import styles from "./family-tree.module.css";
import FamilyTreeFocus from "./FamilyTreeFocus";

type Props = {
  searchParams: Promise<{ focus?: string }>;
};

export default async function FamilyTree({ searchParams }: Props) {
  const { focus } = await searchParams;
  return (
    <main className={styles.page}>
      <FamilyTreeFocus focusId={focus} />
      <div className={styles.container}>
        <div className="realm-section-header">
        <h1 className={`${styles.heading} realm-page-title`}>Family Tree</h1>

        <p className={styles.subheading}>
          The bloodlines behind the crown and the great houses of the realm.
        </p>
        </div>

        {/* HOUSE TARGARYEN */}
        <section id="house-targaryen" className={styles.house}>
          <h2 className={styles.houseTitle}>House Targaryen</h2>
          <p className={styles.houseNote}>
            The present royal branch. The complete dynasty is charted in House of the Dragon.
          </p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "aenys-targaryen-ii" }}
              parentB={{ id: "queen-vhaemys-targaryen" }}
              childrenLabel="Children"
            >
              <Union a={{ id: "malaenar-targaryen" }} b={{ id: "alysa-targaryen" }} />
              <Union
                a={{ id: "baelenys-targaryen" }}
                b={{ id: "jaery-targaryen" }}
              />
              <Union a={{ id: "vahaemon-targaryen" }} b={{ id: "naela-targaryen" }} />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>Baelenys&apos;s Children</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "baelenys-targaryen" }}
              parentB={{ id: "jaery-targaryen" }}
              childrenLabel="Children"
            >
              <Union a={{ id: "visenor-targaryen" }} b={{ id: "rhaella-targaryen" }} />
              <PersonNode id="saera-targaryen" />
              <Union a={{ id: "gaelor-targaryen" }} b={{ id: "naella-velaryon" }} />
              <PersonNode id="maela-targaryen" />
              <div className={styles.betrothedPair}>
                <PersonNode id="jacaelon-targaryen" />
                <span className={styles.betrothedConnector}>Betrothed</span>
                <PersonNode id="lorenah-dayne" />
              </div>
              <PersonNode id="vhaemys-targaryen" />
            </FamilyUnit>
          </div>

          <Link href="/houses/house-of-the-dragon" className={styles.dynastyLink}>
            Explore the complete Targaryen dynasty
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M4 9h9M10 5l4 4-4 4" /></svg>
          </Link>
        </section>

        {/* HOUSE VELARYON */}
        <section id="house-velaryon" className={styles.house}>
          <h2 className={styles.houseTitle}>House Velaryon</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "alyssa-velaryon" }}
              childrenLabel="Children"
            >
              <Union
                a={{ id: "naella-velaryon" }}
                b={{ id: "gaelor-targaryen" }}
              />
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE HIGHTOWER */}
        <section id="house-hightower" className={styles.house}>
          <h2 className={styles.houseTitle}>House Hightower</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "derrin-hightower" }}
              childrenLabel="Children"
            >
              <PersonNode id="alysanne-hightower" />
              <PersonNode id="timos-hightower" />
              <PersonNode id="melessa-hightower" />
            </FamilyUnit>

            <PersonNode id="clarisse-flowers" />
          </div>
        </section>

        {/* HOUSE TYRELL */}
        <section id="house-tyrell" className={styles.house}>
          <h2 className={styles.houseTitle}>House Tyrell</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "lorent-tyrell" }}
              childrenLabel="Children"
            >
              <Union
                a={{ id: "renrose-tyrell" }}
                b={{ id: "liana-tyrell" }}
              />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>Renrose&apos;s Children</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "renrose-tyrell" }}
              parentB={{ id: "liana-tyrell" }}
              childrenLabel="Children"
            >
              <PersonNode id="leo-tyrell" />
              <PersonNode id="renrose-tyrell-daughter" />
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE STARK */}
        <section id="house-stark" className={styles.house}>
          <h2 className={styles.houseTitle}>House Stark</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "brandon-stark" }}
              childrenLabel="Children"
            >
              <PersonNode id="rickard-stark" />
              <PersonNode id="benjen-stark" />
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE DAYNE */}
        <section id="house-dayne" className={styles.house}>
          <h2 className={styles.houseTitle}>House Dayne</h2>

          <p className={styles.generationLabel}>The Torrentine Branch</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "darren-dayne" }}
              childrenLabel="Children"
            >
              <PersonNode id="lorenah-dayne" />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>Maron&apos;s Branch</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "maron-dayne" }}
              parentB={{ id: "lyarra-karstark" }}
              childrenLabel="Children"
            >
              <PersonNode id="alester-dayne" />
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE KARSTARK */}
        <section id="house-karstark" className={styles.house}>
          <h2 className={styles.houseTitle}>House Karstark</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "lyarra-karstark" }}
              parentB={{ id: "maron-dayne" }}
              childrenLabel="Children"
            >
              <PersonNode id="alester-dayne" />
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE BARATHEON */}
        <section id="house-baratheon" className={styles.house}>
          <h2 className={styles.houseTitle}>House Baratheon</h2>

          <div className={styles.generationRow}>
            <PersonNode id="steffon-baratheon" />
          </div>
        </section>

        {/* HOUSE ARRYN */}
        <section id="house-arryn" className={styles.house}>
          <h2 className={styles.houseTitle}>House Arryn</h2>

          <div className={styles.generationRow}>
            <PersonNode id="ronnel-arryn" />
          </div>
        </section>

        {/* HOUSE LANNISTER */}
        <section id="house-lannister" className={styles.house}>
          <h2 className={styles.houseTitle}>House Lannister</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "tygett-lannister" }}
              parentB={{ id: "ella-lannister" }}
              childrenLabel="Children"
            >
              <Union
                a={{ id: "tion-lannister" }}
                b={{ id: "myrielle-marbrand" }}
              />
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE BLACKWOOD */}
        <section id="house-blackwood" className={styles.house}>
          <h2 className={styles.houseTitle}>House Blackwood</h2>

          <div className={styles.generationRow}>
            <PersonNode id="godfrey-blackwood" />
          </div>
        </section>

        {/* HOUSE BRACKEN */}
        <section id="house-bracken" className={styles.house}>
          <h2 className={styles.houseTitle}>House Bracken</h2>

          <div className={styles.generationRow}>
            <PersonNode id="perric-bracken" />

            <Union
              a={{ id: "bethany-bracken" }}
              b={{ id: "oscar-tully" }}
            />
          </div>
        </section>

        {/* HOUSE TULLY */}
        <section id="house-tully" className={styles.house}>
          <h2 className={styles.houseTitle}>House Tully</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "clover-tully" }}
              childrenLabel="Children"
            >
              <FamilyUnit
                parentA={{ id: "elwood-tully" }}
                childrenLabel="Children"
              >
                <Union
                  a={{ id: "oscar-tully" }}
                  b={{ id: "bethany-bracken" }}
                />
              </FamilyUnit>
            </FamilyUnit>
          </div>
        </section>

        {/* HOUSE STRONG */}
        <section id="house-strong" className={styles.house}>
          <h2 className={styles.houseTitle}>House Strong</h2>

          <div className={styles.generationRow}>
            <PersonNode id="baran-strong" />
          </div>
        </section>

        {/* HOUSE GREYJOY */}
        <section id="house-greyjoy" className={styles.house}>
          <h2 className={styles.houseTitle}>House Greyjoy</h2>

          <div className={styles.generationRow}>
            <PersonNode id="harrik-greyjoy" />
          </div>
        </section>

        {/* HOUSE WHENT */}
        <section id="house-whent" className={styles.house}>
          <h2 className={styles.houseTitle}>House Whent</h2>

          <div className={styles.generationRow}>
            <PersonNode id="curtass-whent" />
          </div>
        </section>

        {/* HOUSE VANCE */}
        <section id="house-vance" className={styles.house}>
          <h2 className={styles.houseTitle}>House Vance</h2>

          <div className={styles.generationRow}>
            <PersonNode id="brannyn-vance" />
          </div>
        </section>

        {/* HOUSE MORRIGEN */}
        <section id="house-morrigen" className={styles.house}>
          <h2 className={styles.houseTitle}>House Morrigen</h2>

          <p className={styles.generationLabel}>Known Siblings</p>

          <div className={styles.generationRow}>
            <PersonNode id="orwell-morrigen" />
            <PersonNode id="grance-morrigen" />
          </div>
        </section>

        {/* HOUSE MULLENDORE */}
        <section id="house-mullendore" className={styles.house}>
          <h2 className={styles.houseTitle}>House Mullendore</h2>

          <div className={styles.generationRow}>
            <PersonNode id="martyn-mullendore" />
          </div>
        </section>

        {/* HOUSE CASWELL */}
        <section id="house-caswell" className={styles.house}>
          <h2 className={styles.houseTitle}>House Caswell</h2>

          <div className={styles.generationRow}>
            <PersonNode id="berholt-caswell" />
          </div>
        </section>

        {/* HOUSE MARTELL */}
        <section id="house-martell" className={styles.house}>
          <h2 className={styles.houseTitle}>House Martell</h2>
          <p className={styles.generationLabel}>Known Siblings</p>

          <div className={styles.generationRow}>
            <PersonNode id="nymor-martell" />
            <PersonNode id="meria-martell" />
          </div>
        </section>

        {/* HOUSE CELTIGAR */}
        <section id="house-celtigar" className={styles.house}>
          <h2 className={styles.houseTitle}>House Celtigar</h2>

          <div className={styles.generationRow}>
            <PersonNode id="annara-celtigar" />
          </div>
        </section>

        {/* HOUSE MARBRAND */}
        <section id="house-marbrand" className={styles.house}>
          <h2 className={styles.houseTitle}>House Marbrand</h2>

          <div className={styles.generationRow}>
            <Union
              a={{ id: "myrielle-marbrand" }}
              b={{ id: "tion-lannister" }}
            />
          </div>
        </section>

        {/* HOUSE MOOTON */}
        <section id="house-mooton" className={styles.house}>
          <h2 className={styles.houseTitle}>House Mooton</h2>

          <div className={styles.generationRow}>
            <PersonNode id="myles-mooton" />
          </div>
        </section>

        {/* HOUSE HARLAW */}
        <section id="house-harlaw" className={styles.house}>
          <h2 className={styles.houseTitle}>House Harlaw</h2>

          <div className={styles.generationRow}>
            <PersonNode id="drack-harlaw" />
          </div>
        </section>
      </div>
    </main>
  );
}
