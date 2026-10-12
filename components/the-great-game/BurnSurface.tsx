"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { getFontEmbedCSS, toCanvas } from "html-to-image";
import { distributeBurnPixels } from "@/lib/the-great-game/burn-pixels";
import styles from "@/app/cards/play/play.module.css";
let preparedFonts: Promise<string> | undefined;
const gemRasters = new Map<string, Promise<string>>();
function transparentGemRaster(url: string) {
  let raster = gemRasters.get(url);
  if (!raster) {
    raster = new Promise<string>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 192; canvas.height = 192;
          canvas.getContext("2d")!.drawImage(image, 0, 0, 192, 192);
          resolve(canvas.toDataURL("image/png"));
        } catch (error) { reject(error); }
      };
      image.onerror = () => { gemRasters.delete(url); reject(new Error("Gem raster unavailable")); };
      image.src = url;
    });
    gemRasters.set(url, raster);
  }
  return raster;
}
export function prepareBurnFonts(node: HTMLElement) {
  preparedFonts ??= getFontEmbedCSS(node, { preferredFontFormat: "woff2" }).catch(() => {
    preparedFonts = undefined;
    return "";
  });
  return preparedFonts;
}
export default function BurnSurface({ burning, children, onComplete }: { burning: boolean; children: ReactNode; onComplete?: () => void }) {
  const source = useRef<HTMLDivElement>(null);
  const layers = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = source.current;
    const host = layers.current;
    if (!burning || !node || !host) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let captureTimeout: ReturnType<typeof setTimeout> | undefined;
    const preparationTimers: ReturnType<typeof setTimeout>[] = [];
    const boundedPreparation = <T,>(promise: Promise<T>, fallback: T, ms: number) =>
      Promise.race([promise, new Promise<T>(resolve => {
        preparationTimers.push(setTimeout(() => resolve(fallback), ms));
      })]);
    const animations: Animation[] = [];
    const wait = (ms: number) => new Promise<void>(resolve => { timeout = setTimeout(resolve, ms); });
    const complete = () => { if (!cancelled) onComplete?.(); };
    async function dissolve() {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        if (frame.current) frame.current.style.opacity = "1";
        await wait(1500); complete(); return;
      }
      try {
        const capture = async () => {
          host!.dataset.capturePhase = "fonts";
          await boundedPreparation(document.fonts.ready.then(() => undefined), undefined, 800);
          const fontEmbedCSS = await boundedPreparation(prepareBurnFonts(document.body), "", 1200);
          host!.dataset.capturePhase = "images";
          // html-to-image already fetches and decodes the cloned images. Waiting on
          // lazy source images as well can stall the effect until capture times out.
          for (const image of node!.querySelectorAll("img")) {
            image.loading = "eager";
          }
          // Rasterize transparent WebP gems before SVG/foreignObject capture.
          // This also bypasses Next's optimized-image URL and MIME inference.
          const originals: { image: HTMLImageElement; src: string; srcset: string }[] = [];
          await Promise.allSettled(Array.from(node!.querySelectorAll("img")).map(async image => {
            const url = new URL(image.src, location.href);
            const asset = url.searchParams.get("url") ?? url.pathname;
            if (!asset.startsWith("/images/cards/command-gems/")) return;
            const png = await transparentGemRaster(asset);
            if (cancelled) return;
            originals.push({ image, src: image.src, srcset: image.srcset });
            image.srcset = ""; image.src = png;
            await image.decode();
          }));
          host!.dataset.capturePhase = "render";
          try { return await toCanvas(node!, {
            pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
            // Next image URLs share /_next/image; the query identifies the actual asset.
            includeQueryParams: true,
            preferredFontFormat: "woff2",
            fontEmbedCSS,
            imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
          }); } finally {
            for (const original of originals) {
              original.image.src = original.src;
              original.image.srcset = original.srcset;
            }
          }
        };
        const captureWithRetry = async () => {
          try { return await capture(); }
          catch (error) {
            if (cancelled) throw error;
            // A first-load resource abort can be transient and differ by viewer.
            // Retry the prepared capture once before dropping to the fallback.
            await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
            if (cancelled) throw error;
            return capture();
          }
        };
        const snapshot = await Promise.race([captureWithRetry(), new Promise<never>((_, reject) => { captureTimeout = setTimeout(() => reject(new Error("Burn capture timed out")), 5000); })]);
        clearTimeout(captureTimeout);
        if (cancelled) return;
        const context = snapshot.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        const image = context.getImageData(0, 0, snapshot.width, snapshot.height);
        const groups = distributeBurnPixels(image.data, image.width, image.height, 24);
        const fragment = document.createDocumentFragment();
        const canvases = groups.map(pixels => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width; canvas.height = image.height;
          canvas.className = styles.burnDustLayer;
          canvas.getContext("2d")!.putImageData(new ImageData(pixels, image.width, image.height), 0, 0);
          fragment.appendChild(canvas); return canvas;
        });
        // Separate sparse canvases soften one another when the browser rescales them.
        // Keep the intact raster over the dust for a fully opaque first frame.
        snapshot.className = styles.burnDustLayer;
        fragment.appendChild(snapshot);
        host!.replaceChildren(fragment);
        // Show the same prepared pixels from the first frame through the final ash.
        // Never swap a live DOM card for a subtly different browser SVG rasterization.
        node!.style.visibility = "hidden"; host!.style.visibility = "visible";
        // Give the compositor time to upload textures before the first visible frame.
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        if (cancelled) return;
        if (frame.current) frame.current.style.opacity = "1";
        const entrance = frame.current!.animate([
          { opacity: 0, transform: "translateX(18px) scale(.96)" },
          { opacity: 1, transform: "translateX(0) scale(1)" },
        ], { duration: 300, easing: "ease", fill: "both" });
        animations.push(entrance);
        await entrance.finished;
        await wait(200);
        if (cancelled) return;
        animations.push(snapshot.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 800, easing: "linear", fill: "forwards",
        }));
        for (const [index, canvas] of canvases.entries()) {
          const x = 180 + (index * 37) % 100;
          const y = -45 + (index * 17) % 65;
          const angle = -5 + (index * 7) % 11;
          animations.push(canvas.animate([
            { transform: "translate3d(0,0,0) rotate(0deg)", opacity: 1, offset: 0 },
            { transform: "translate3d(" + x * .65 + "px," + y * .65 + "px,0) rotate(" + angle * .65 + "deg)", opacity: 1, offset: .65 },
            { transform: "translate3d(" + x + "px," + y + "px,0) rotate(" + angle + "deg)", opacity: 0, offset: 1 },
          ], { duration: 1100, delay: index * 775 / (canvases.length - 1), easing: "linear", fill: "both" }));
        }
        await Promise.all(animations.map(animation => animation.finished));
        complete();
      } catch (error) {
        if (cancelled) return;
        if (process.env.NODE_ENV === "development") console.warn("Burn snapshot unavailable", host!.dataset.capturePhase, error);
        // A failed capture must not leave the public reveal queue stuck.
        node!.style.visibility = "visible"; host!.replaceChildren();
        if (frame.current) frame.current.style.opacity = "1";
        await wait(1500);
        if (cancelled) return;
        const fallback = node!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: "linear", fill: "forwards" });
        animations.push(fallback);
        try { await fallback.finished; complete(); } catch { /* Unmounted. */ }
      }
    }
    void dissolve();
    return () => {
      cancelled = true; clearTimeout(timeout); clearTimeout(captureTimeout);
      preparationTimers.forEach(clearTimeout);
      animations.forEach(animation => animation.cancel());
      host.replaceChildren(); host.style.visibility = "hidden"; node.style.visibility = "visible";
    };
  }, [burning, onComplete]);
  return <div ref={frame} className={styles.burnCanvasFrame} style={burning ? { opacity: 0, pointerEvents: "none" } : undefined}>
    <div ref={source} className={styles.burnSurface}>{children}</div>
    {burning && <div ref={layers} className={styles.burnDustLayers} aria-hidden="true" />}
  </div>;
}
