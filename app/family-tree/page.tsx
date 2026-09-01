// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\family-tree\page.tsx

import FamilyUnit from "@/components/familytree/FamilyUnit";
import Union from "@/components/familytree/Union";
import PersonNode from "@/components/familytree/PersonNode";

import styles from "./family-tree.module.css";

export default function FamilyTree() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.heading}>Family Tree</h1>

        <p className={styles.subheading}>
          The bloodlines behind the crown. Dashed nodes mark relatives who
          appear only by name in the records.
        </p>

        {/* HOUSE TARGARYEN */}
        <section id="house-targaryen" className={styles.house}>
          <h2 className={styles.houseTitle}>House Targaryen</h2>

          <p className={styles.generationLabel}>The Old King&apos;s Children</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ name: "Aenys Targaryen II" }}
              parentB={{ name: "Vhaemys Targaryen" }}
              childrenLabel="Children"
            >
              <PersonNode id="malaenar-targaryen" />
              <PersonNode id="baelenys-targaryen" />
              <PersonNode id="vahaemon-targaryen" />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>The King&apos;s Generation</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "baelenys-targaryen" }}
              parentB={{ id: "jaery-targaryen" }}
              childrenLabel="Children"
            >
              <PersonNode id="saera-targaryen" />

              <Union
                a={{ id: "visenor-targaryen" }}
                b={{ id: "rhaella-targaryen" }}
              />

              <Union
                a={{ id: "gaelor-targaryen" }}
                b={{ id: "naella-velaryon" }}
              />

              <PersonNode id="maela-targaryen" />
              <PersonNode id="jacaelon-targaryen" />
              <PersonNode id="vhaemys-targaryen" />
            </FamilyUnit>

            <FamilyUnit
              parentA={{ id: "malaenar-targaryen" }}
              parentB={{ name: "Alysa Targaryen" }}
            />

            <FamilyUnit
              parentA={{ id: "vahaemon-targaryen" }}
              parentB={{ id: "naela-targaryen" }}
              childrenLabel="Children"
            >
              <PersonNode id="visenya-targaryen" />
              <PersonNode id="rhaella-targaryen" />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>Other Royal Branches</p>

          <div className={styles.generationRow}>
            <PersonNode id="baelor-targaryen" />
          </div>

          <p className={styles.houseNote}>
            Grand Maester Baelor belongs to an older branch of the royal
            family and is King Baelenys&apos; great-uncle. The exact line
            connecting his branch to the King&apos;s is not yet recorded.
          </p>

          <p className={styles.houseNote}>
            Rhaella appears twice above: she is both Vahaemon&apos;s daughter
            and Visenor&apos;s wife, tying the exiled branch directly back
            into the royal line.
          </p>
        </section>

        {/* HOUSE VELARYON */}
        <section id="house-velaryon" className={styles.house}>
          <h2 className={styles.houseTitle}>House Velaryon</h2>

          <div className={styles.generationRow}>
            <Union
              a={{ id: "naella-velaryon" }}
              b={{ id: "gaelor-targaryen" }}
            />
          </div>

          <p className={styles.houseNote}>
            Princess Naella&apos;s immediate Velaryon family has not yet been
            named in the records. Her marriage to Prince Gaelor binds House
            Velaryon directly to the royal family.
          </p>
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
          </div>
        </section>

        {/* HOUSE TYRELL */}
        <section id="house-tyrell" className={styles.house}>
          <h2 className={styles.houseTitle}>House Tyrell</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "renrose-tyrell" }}
              childrenLabel="Children"
            >
              <PersonNode id="leo-tyrell" />
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

          <p className={styles.generationLabel}>A Distant Branch</p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ name: "Unknown Dayne" }}
              parentB={{ name: "A Karstark of the North" }}
              childrenLabel="Children"
            >
              <PersonNode id="alester-dayne" />
            </FamilyUnit>
          </div>

          <p className={styles.houseNote}>
            Ser Alester Dayne is a distant cousin of Lorenah&apos;s from
            another branch of House Dayne, not a direct descendant of Darren
            Dayne.
          </p>
        </section>

        {/* HOUSE BARATHEON */}
        <section id="house-baratheon" className={styles.house}>
          <h2 className={styles.houseTitle}>House Baratheon</h2>

          <div className={styles.generationRow}>
            <PersonNode id="steffon-baratheon" />
          </div>
        </section>

        {/* HOUSE LANNISTER */}
        <section id="house-lannister" className={styles.house}>
          <h2 className={styles.houseTitle}>House Lannister</h2>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ name: "Tygett Lannister" }}
              parentB={{ name: "Ella Lannister" }}
              childrenLabel="Children"
            >
              <Union
                a={{ id: "tion-lannister" }}
                b={{ name: "Myrielle Lannister" }}
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
                parentA={{ name: "Unknown Tully" }}
                childrenLabel="Children"
              >
                <Union
                  a={{ name: "Clover Tully's Grandson" }}
                  b={{ name: "A Bracken Girl" }}
                />
              </FamilyUnit>
            </FamilyUnit>
          </div>

          <p className={styles.houseNote}>
            Lord Clover&apos;s grandson recently married into House Bracken.
            The intervening generation has not yet been identified.
          </p>
        </section>

        {/* HOUSE STRONG */}
        <section id="house-strong" className={styles.house}>
          <h2 className={styles.houseTitle}>House Strong</h2>

          <div className={styles.generationRow}>
            <PersonNode id="baran-strong" />
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

          <div className={styles.generationRow}>
            <PersonNode id="orwell-morrigen" />
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
      </div>
    </main>
  );
}