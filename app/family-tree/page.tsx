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
              parentB={{ name: "Vhaemys Targaryen (the Elder)" }}
              childrenLabel="Children"
            >
              <PersonNode id="baelenys-targaryen" />
              <PersonNode id="malaenar-targaryen" />
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
              <Union a={{ id: "visenor-targaryen" }} b={{ id: "rhaella-targaryen" }} />
              <Union a={{ id: "gaelor-targaryen" }} b={{ id: "naella-velaryon" }} />
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
              parentB={{ name: "Naela Velaryon" }}
              childrenLabel="Children"
            >
              <PersonNode id="rhaella-targaryen" />
              <PersonNode name="Unnamed sibling" />
            </FamilyUnit>
          </div>

          <p className={styles.houseNote}>
            Rhaella appears twice above: she is both Vahaemon&apos;s exiled
            daughter and Visenor&apos;s wife, the marriage that tied the
            traitor&apos;s bloodline back into the crown&apos;s own.
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
              <PersonNode id="timos-hightower" />
              <PersonNode id="alysanne-hightower" />
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

          <div className={styles.generationRow}>
            <FamilyUnit
              parentA={{ id: "darren-dayne" }}
              childrenLabel="Children"
            >
              <PersonNode id="lorenah-dayne" />
            </FamilyUnit>
          </div>

          <p className={styles.houseNote}>
            Ser Alester Dayne is a distant cousin of Lorenah&apos;s from
            another branch of House Dayne, not a direct descendant of Darren
            Dayne.
          </p>
        </section>
      </div>
    </main>
  );
}
