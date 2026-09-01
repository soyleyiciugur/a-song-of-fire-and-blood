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

          <p className={styles.generationLabel}>The Elder Generation</p>

          <div className={styles.generationRow}>
            <PersonNode id="baelor-targaryen" />

            <Union
              a={{ id: "aenys-targaryen-ii" }}
              b={{ id: "vhaemys-targaryen-elder" }}
            />
          </div>

          <p className={styles.generationLabel}>
            The Children of Aenys II
          </p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "aenys-targaryen-ii" }}
              parentB={{ id: "vhaemys-targaryen-elder" }}
              childrenLabel="Children"
            >
              <Union
                a={{ id: "malaenar-targaryen" }}
                b={{ id: "alysa-targaryen" }}
              />

              <Union
                a={{ id: "baelenys-targaryen" }}
                b={{ id: "jaery-targaryen" }}
              />

              <Union
                a={{ id: "vahaemon-targaryen" }}
                b={{ id: "naela-targaryen" }}
              />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>
            The King&apos;s Children
          </p>

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
          </div>

          <p className={styles.generationLabel}>
            Vahaemon&apos;s Children
          </p>

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "vahaemon-targaryen" }}
              parentB={{ id: "naela-targaryen" }}
              childrenLabel="Children"
            >
              <PersonNode id="visenya-targaryen" />

              <Union
                a={{ id: "rhaella-targaryen" }}
                b={{ id: "visenor-targaryen" }}
              />
            </FamilyUnit>
          </div>

          <p className={styles.generationLabel}>
            Queen Jaery&apos;s Branch
          </p>

          <div className={styles.generationRow}>
            <PersonNode id="vaenarr-targaryen" />

            <Union
              a={{ id: "jaery-targaryen" }}
              b={{ id: "baelenys-targaryen" }}
            />
          </div>
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