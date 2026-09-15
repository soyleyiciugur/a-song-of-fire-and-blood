import type { ReactNode } from "react";

import PersonNode from "@/components/familytree/PersonNode";
import Union from "@/components/familytree/Union";
import styles from "./family-tree.module.css";

function ChildBranch({ children }: { children: ReactNode }) {
  return <div className={styles.targaryenChildBranch}>{children}</div>;
}

export default function TargaryenLineage() {
  return (
    <div className={styles.targaryenViewport} data-targaryen-viewport>
      <div className={styles.targaryenTree}>
        <div className={styles.targaryenRoot} data-targaryen-root>
          <Union
            a={{ id: "aenys-targaryen-ii" }}
            b={{ id: "vhaemys-targaryen-elder" }}
          />
        </div>

        <div className={styles.targaryenMainStem} aria-hidden="true" />

        <div className={styles.targaryenChildrenRail}>
          <ChildBranch>
            <PersonNode id="baelor-targaryen" />
            <span className={styles.lineageNote}>Eldest son</span>
          </ChildBranch>

          <ChildBranch>
            <Union
              a={{ id: "malaenar-targaryen" }}
              b={{ id: "alysa-targaryen" }}
            />
          </ChildBranch>

          <ChildBranch>
            <Union
              a={{ id: "baelenys-targaryen" }}
              b={{ id: "jaery-targaryen" }}
            />
          </ChildBranch>

          <ChildBranch>
            <Union
              a={{ id: "vahaemon-targaryen" }}
              b={{ id: "naela-targaryen" }}
            />
          </ChildBranch>
        </div>

        <div className={styles.targaryenLowerGrid}>
          <div className={styles.jaeryKinBranch}>
            <div className={styles.jaeryKinConnector} aria-hidden="true" />
            <div className={styles.jaeryKinCard}>
              <span className={styles.lineageNote}>Queen Jaery&apos;s brother</span>
              <PersonNode id="vaenarr-targaryen" />
            </div>
          </div>

          <div className={`${styles.descendantGroup} ${styles.royalDescendants}`}>
            <div className={styles.descendantStem} aria-hidden="true" />
            <div className={`${styles.descendantRail} ${styles.descendantRailSix}`}>
              <div className={styles.descendantNode}>
                <Union
                  a={{ id: "visenor-targaryen" }}
                  b={{ id: "rhaella-targaryen" }}
                />
              </div>
              <div className={styles.descendantNode}><PersonNode id="saera-targaryen" /></div>
              <div className={styles.descendantNode}>
                <Union
                  a={{ id: "gaelor-targaryen" }}
                  b={{ id: "naella-velaryon" }}
                />
              </div>
              <div className={styles.descendantNode}><PersonNode id="maela-targaryen" /></div>
              <div className={styles.descendantNode}><PersonNode id="jacaelon-targaryen" /></div>
              <div className={styles.descendantNode}><PersonNode id="vhaemys-targaryen" /></div>
            </div>
          </div>

          <div className={`${styles.descendantGroup} ${styles.vahaemonDescendants}`}>
            <div className={styles.descendantStem} aria-hidden="true" />
            <div className={`${styles.descendantRail} ${styles.descendantRailTwo}`}>
              <div className={styles.descendantNode}><PersonNode id="visenya-targaryen" /></div>
              <div className={styles.descendantNode}>
                <Union
                  a={{ id: "rhaella-targaryen" }}
                  b={{ id: "visenor-targaryen" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
