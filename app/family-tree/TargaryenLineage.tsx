"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import PersonNode from "@/components/familytree/PersonNode";
import Union from "@/components/familytree/Union";
import styles from "./family-tree.module.css";

function ChildBranch({ children }: { children: ReactNode }) {
  return <div className={styles.targaryenChildBranch}>{children}</div>;
}

export default function TargaryenLineage() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [showEarlierLine, setShowEarlierLine] = useState(false);
  const [scale, setScale] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 1420, height: 760 });
  const [didAutoFit, setDidAutoFit] = useState(false);

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const measure = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      setContentSize({
        width: Math.ceil(contentRef.current.scrollWidth || rect.width || 1420),
        height: Math.ceil(contentRef.current.scrollHeight || rect.height || 760),
      });
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [showEarlierLine]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !contentSize.width) return;

    const fit = () => {
      const paddingAllowance = window.matchMedia("(max-width: 700px)").matches ? 20 : 56;
      const fitScale = Math.min(1, (viewport.clientWidth - paddingAllowance) / contentSize.width);
      const nextScale = Number(Math.max(0.34, fitScale).toFixed(3));

      setScale((current) => {
        if (!didAutoFit) return nextScale;
        if (Math.abs(current - nextScale) < 0.015) return current;
        return current;
      });

      requestAnimationFrame(() => {
        const appliedScale = !didAutoFit ? nextScale : scale;
        const targetLeft = Math.max(0, (contentSize.width * appliedScale - viewport.clientWidth) / 2);
        viewport.scrollLeft = targetLeft;
        if (!showEarlierLine) viewport.scrollTop = 0;
      });

      if (!didAutoFit) setDidAutoFit(true);
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [contentSize, didAutoFit, scale, showEarlierLine]);

  const zoomOut = () => setScale((current) => Math.max(0.34, Number((current - 0.08).toFixed(2))));
  const zoomIn = () => setScale((current) => Math.min(1.3, Number((current + 0.08).toFixed(2))));
  const zoomReset = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const paddingAllowance = window.matchMedia("(max-width: 700px)").matches ? 20 : 40;
    const fitScale = Math.min(1, (viewport.clientWidth - paddingAllowance) / contentSize.width);
    const nextScale = Number(Math.max(0.34, fitScale).toFixed(2));
    setScale(nextScale);
    requestAnimationFrame(() => {
      viewport.scrollLeft = Math.max(0, (contentSize.width * nextScale - viewport.clientWidth) / 2);
      viewport.scrollTop = 0;
    });
  };

  const canvasStyle = useMemo(
    () => ({
      width: `${Math.max(1, Math.round(contentSize.width * scale))}px`,
      height: `${Math.max(1, Math.round(contentSize.height * scale))}px`,
    }),
    [contentSize, scale],
  );

  const contentStyle = useMemo(
    () => ({
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      width: `${contentSize.width}px`,
    }),
    [contentSize.width, scale],
  );

  return (
    <div className={styles.targaryenMapShell}>
      <div className={styles.targaryenMapHud}>
        <div className={styles.targaryenZoomGroup}>
          <button type="button" className={styles.targaryenHudButton} onClick={zoomOut} aria-label="Zoom out">−</button>
          <button type="button" className={styles.targaryenHudButton} onClick={zoomReset}>Fit</button>
          <button type="button" className={styles.targaryenHudButton} onClick={zoomIn} aria-label="Zoom in">+</button>
          <span className={styles.targaryenZoomReadout}>{Math.round(scale * 100)}%</span>
        </div>
        <button
          type="button"
          className={styles.targaryenCollapseToggle}
          onClick={() => setShowEarlierLine((current) => !current)}
          aria-expanded={showEarlierLine}
        >
          <span className={styles.targaryenCollapseEyebrow}>Dynasty</span>
          <span>{showEarlierLine ? "Hide earlier kings" : "Show earlier kings"}</span>
        </button>
      </div>

      <div ref={viewportRef} className={styles.targaryenViewport} data-targaryen-viewport>
        <div className={styles.targaryenCanvas} style={canvasStyle}>
          <div ref={contentRef} className={styles.targaryenTree} style={contentStyle}>
            {showEarlierLine ? (
              <div className={styles.earlierDynastyPanel}>
                <div className={styles.earlierDynastyStage}>
                  <PersonNode id="aegon-targaryen-i" />
                  <span className={styles.lineageNote}>The Conqueror</span>
                </div>

                <div className={styles.earlierDynastyStem} aria-hidden="true" />

                <div className={styles.earlierDynastyKingsRow}>
                  <div className={styles.earlierDynastyBranch}>
                    <PersonNode id="aenys-targaryen-i" />
                  </div>
                  <div className={styles.earlierDynastyBranch}>
                    <PersonNode id="maegor-targaryen-i" />
                  </div>
                </div>

                <div className={styles.earlierDynastyJaehaerys}>
                  <div className={styles.earlierDynastyJaehaerysStem} aria-hidden="true" />
                  <Union
                    a={{ id: "jaehaerys-targaryen-i" }}
                    b={{ id: "alysanne-targaryen" }}
                  />
                </div>

                <div className={styles.earlierDynastyTransitionStem} aria-hidden="true" />
              </div>
            ) : null}

            <div className={styles.targaryenRootBand}>
              <div className={styles.rootSiblingBranch}>
                <PersonNode id="baelor-targaryen" />
                <span className={styles.lineageNote}>Elder son</span>
              </div>

              <div className={styles.rootUnionBranch}>
                <Union
                  a={{ id: "aenys-targaryen-ii" }}
                  b={{ id: "queen-vhaemys-targaryen" }}
                />
              </div>

              <div className={styles.rootSiblingSpacer} aria-hidden="true" />
            </div>

            <div className={styles.targaryenMainStem} aria-hidden="true" />

            <div className={styles.targaryenChildrenRail}>
              <ChildBranch>
                <Union
                  a={{ id: "vahaemon-targaryen" }}
                  b={{ id: "naela-targaryen" }}
                />
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

              <div className={styles.branchSpacer} aria-hidden="true" />
            </div>

            <div className={styles.targaryenLowerGrid}>
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
                  <div className={styles.descendantNode}><PersonNode id="visenor-targaryen" /></div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
