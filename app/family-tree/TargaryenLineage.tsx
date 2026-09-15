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
  const [contentSize, setContentSize] = useState({ width: 1280, height: 620 });
  const [didAutoFit, setDidAutoFit] = useState(false);

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const measure = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      setContentSize({
        width: Math.ceil(contentRef.current.scrollWidth || rect.width || 1280),
        height: Math.ceil(contentRef.current.scrollHeight || rect.height || 620),
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
      const nextScale = Number(Math.max(0.42, fitScale).toFixed(3));

      setScale((current) => {
        if (!didAutoFit) return nextScale;
        if (Math.abs(current - nextScale) < 0.015) return current;
        return current;
      });

      requestAnimationFrame(() => {
        const targetLeft = Math.max(0, (contentSize.width * (!didAutoFit ? nextScale : scale) - viewport.clientWidth) / 2);
        viewport.scrollLeft = targetLeft;
        if (!showEarlierLine) viewport.scrollTop = 0;
      });

      if (!didAutoFit) setDidAutoFit(true);
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [contentSize, didAutoFit, scale, showEarlierLine]);

  const zoomOut = () => setScale((current) => Math.max(0.42, Number((current - 0.08).toFixed(2))));
  const zoomIn = () => setScale((current) => Math.min(1.3, Number((current + 0.08).toFixed(2))));
  const zoomReset = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fitScale = Math.min(1, (viewport.clientWidth - 40) / contentSize.width);
    const nextScale = Number(Math.max(0.42, fitScale).toFixed(2));
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
        </div>
        <button
          type="button"
          className={styles.targaryenCollapseToggle}
          onClick={() => setShowEarlierLine((current) => !current)}
          aria-expanded={showEarlierLine}
        >
          <span className={styles.targaryenCollapseEyebrow}>Earlier line</span>
          <span>{showEarlierLine ? "Hide the line before Aenys II" : "Show the line before Aenys II"}</span>
        </button>
      </div>

      <div ref={viewportRef} className={styles.targaryenViewport} data-targaryen-viewport>
        <div className={styles.targaryenCanvas} style={canvasStyle}>
          <div ref={contentRef} className={styles.targaryenTree} style={contentStyle}>
            {showEarlierLine && (
              <div className={styles.earlierLinePanel}>
                <span className={styles.earlierLineLabel}>Earlier Targaryen kings</span>
                <PersonNode name="Jaehaerys Targaryen I" dimmed />
                <div className={styles.earlierLineBranch}>
                  <div className={styles.earlierSiblingNode}>
                    <PersonNode id="baelor-targaryen" />
                    <span className={styles.lineageNote}>Elder son</span>
                  </div>
                  <div className={styles.earlierLineContinuation} aria-hidden="true" />
                </div>
              </div>
            )}

            <div className={styles.targaryenRoot} data-targaryen-root>
              <Union
                a={{ id: "aenys-targaryen-ii" }}
                b={{ id: "vhaemys-targaryen-elder" }}
              />
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
            </div>

            <div className={styles.targaryenLowerGrid}>
              <div className={`${styles.descendantGroup} ${styles.vahaemonDescendants}`}>
                <div className={styles.descendantStem} aria-hidden="true" />
                <div className={`${styles.descendantRail} ${styles.descendantRailTwo}`}>
                  <div className={styles.descendantNode}><PersonNode id="visenya-targaryen" /></div>
                  <div className={styles.descendantNode}>
                    <div className={styles.spouseBranch}>
                      <PersonNode id="rhaella-targaryen" />
                      <span className={styles.lineageNote}>Wed to Visenor</span>
                    </div>
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
