"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GREAT_GAME_INNKEEPER_ACTION_EVENT } from "@/lib/the-great-game/emotes";

type InnkeeperClip = "idle" | "tankard" | "ale" | "salt" | "coin1" | "coin2";
type SlotIndex = 0 | 1;
type TransitionReason = "idle-loop" | "action" | "external" | "return-to-idle";

type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: (now: number, metadata: unknown) => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

type ChromaScratch = {
  baseAlpha: Uint8ClampedArray;
  erodedAlpha: Uint8ClampedArray;
  finalAlpha: Uint8ClampedArray;
};

type TransitionState = {
  fromSlot: SlotIndex;
  toSlot: SlotIndex;
  nextClip: InnkeeperClip;
  reason: TransitionReason;
  startedAt: number;
};

const MARA_CLIPS: Record<"idle", string> & Partial<Record<InnkeeperClip, string>> = {
  idle: "/images/cards/innkeepers/mara_idle.mp4",
  tankard: "/images/cards/innkeepers/mara_tankard.mp4",
  ale: "/images/cards/innkeepers/mara_ale.mp4",
  salt: "/images/cards/innkeepers/mara_salt.mp4",
};
const ALDREN_CLIPS: Record<"idle", string> & Partial<Record<InnkeeperClip, string>> = {
  idle: "/images/cards/innkeepers/aldren_idle.mp4",
  ale: "/images/cards/innkeepers/aldren_ale.mp4",
  salt: "/images/cards/innkeepers/aldren_salt.mp4",
  coin1: "/images/cards/innkeepers/aldren_coin1.mp4",
  coin2: "/images/cards/innkeepers/aldren_coin2.mp4",
};

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const CROSSFADE_MS = 260;
const IDLE_LOOP_LEAD_MS = CROSSFADE_MS + 120;
const ACTION_RETURN_LEAD_MS = CROSSFADE_MS + 140;
const PLAYBACK_WATCHDOG_MS = 250;
const IDLE_ACTION_MIN_MS = 45_000;
const IDLE_ACTION_MAX_MS = 90_000;

// The generated videos use a very saturated green screen. Keying with green
// dominance against the *average* of red and blue catches green spill on red
// hair much better than comparing green only to max(red, blue).
const KEY_GREEN_FLOOR = 55;
const KEY_SOFT_START = 10;
const KEY_FULL = 82;
const EDGE_SHRINK = 0.55;
const EDGE_FEATHER = 0.12;
const EDGE_ALPHA_CUTOFF = 10;
const DESPILL_BASE = 0.82;
const DESPILL_EDGE_BOOST = 0.18;
const EDGE_WARMTH = 0.06;

const chromaScratch = new WeakMap<HTMLCanvasElement, ChromaScratch>();
const blendScratch = new WeakMap<HTMLCanvasElement, ImageData>();

function getChromaScratch(canvas: HTMLCanvasElement) {
  const pixelCount = CANVAS_WIDTH * CANVAS_HEIGHT;
  const existing = chromaScratch.get(canvas);
  if (existing?.baseAlpha.length === pixelCount) return existing;

  const scratch = {
    baseAlpha: new Uint8ClampedArray(pixelCount),
    erodedAlpha: new Uint8ClampedArray(pixelCount),
    finalAlpha: new Uint8ClampedArray(pixelCount),
  };
  chromaScratch.set(canvas, scratch);
  return scratch;
}

function getBlendImageData(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const existing = blendScratch.get(canvas);
  if (existing?.width === CANVAS_WIDTH && existing.height === CANVAS_HEIGHT) return existing;
  const next = context.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
  blendScratch.set(canvas, next);
  return next;
}

function smoothstep(value: number) {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function drawChromaFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.drawImage(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const frame = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const pixels = frame.data;
  const { baseAlpha, erodedAlpha, finalAlpha } = getChromaScratch(canvas);

  // Pass 1: generate a soft matte and remove green spill. Using (R+B)/2 as the
  // neutral baseline catches the yellow/green halo that survives around Mara's
  // red hair even when green is not greater than red.
  for (let pixel = 0, dataIndex = 0; pixel < baseAlpha.length; pixel += 1, dataIndex += 4) {
    const red = pixels[dataIndex];
    const green = pixels[dataIndex + 1];
    const blue = pixels[dataIndex + 2];
    const neutralGreen = (red + blue) * 0.5;
    const greenExcess = green - neutralGreen;

    let alpha = 255;
    if (green >= KEY_GREEN_FLOOR && greenExcess > KEY_SOFT_START) {
      const progress = smoothstep((greenExcess - KEY_SOFT_START) / (KEY_FULL - KEY_SOFT_START));
      alpha = Math.round(255 * (1 - progress));
    }
    baseAlpha[pixel] = alpha;

    if (greenExcess > 0) {
      const edgeBias = 1 - alpha / 255;
      const strength = Math.min(1, DESPILL_BASE + edgeBias * DESPILL_EDGE_BOOST);
      const removable = greenExcess * strength;
      pixels[dataIndex + 1] = Math.max(0, Math.round(green - removable));

      // A tiny warm correction looks much more natural than a grey fringe on
      // Mara's copper-red hair after spill suppression.
      if (alpha < 235 && red > blue) {
        pixels[dataIndex] = Math.min(255, Math.round(red + greenExcess * EDGE_WARMTH * edgeBias));
      }
    }
  }

  // Pass 2: pull the matte inward using all eight neighbours. This removes the
  // one-pixel fluorescent rim while keeping the inner hair mass intact.
  for (let y = 0; y < CANVAS_HEIGHT; y += 1) {
    for (let x = 0; x < CANVAS_WIDTH; x += 1) {
      const pixel = y * CANVAS_WIDTH + x;
      const alpha = baseAlpha[pixel];

      if (alpha === 0 || x === 0 || y === 0 || x === CANVAS_WIDTH - 1 || y === CANVAS_HEIGHT - 1) {
        erodedAlpha[pixel] = alpha;
        continue;
      }

      let neighborMin = alpha;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const neighbor = pixel + offsetY * CANVAS_WIDTH + offsetX;
          neighborMin = Math.min(neighborMin, baseAlpha[neighbor]);
        }
      }

      erodedAlpha[pixel] = Math.round(alpha - (alpha - neighborMin) * EDGE_SHRINK);
    }
  }

  // Pass 3: tiny feather from the already-eroded matte. Background pixels stay
  // transparent, so feathering cannot re-introduce green outside the subject.
  for (let y = 0; y < CANVAS_HEIGHT; y += 1) {
    for (let x = 0; x < CANVAS_WIDTH; x += 1) {
      const pixel = y * CANVAS_WIDTH + x;
      const alpha = erodedAlpha[pixel];

      if (alpha === 0 || x === 0 || y === 0 || x === CANVAS_WIDTH - 1 || y === CANVAS_HEIGHT - 1) {
        finalAlpha[pixel] = alpha;
        continue;
      }

      let total = 0;
      let count = 0;
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          total += erodedAlpha[pixel + offsetY * CANVAS_WIDTH + offsetX];
          count += 1;
        }
      }

      const neighborAverage = total / count;
      const feathered = Math.round(alpha * (1 - EDGE_FEATHER) + neighborAverage * EDGE_FEATHER);
      finalAlpha[pixel] = feathered < EDGE_ALPHA_CUTOFF ? 0 : feathered;
    }
  }

  for (let pixel = 0, dataIndex = 3; pixel < finalAlpha.length; pixel += 1, dataIndex += 4) {
    pixels[dataIndex] = finalAlpha[pixel];
  }

  context.putImageData(frame, 0, 0);
}

function copyKeyedCanvas(source: HTMLCanvasElement, output: HTMLCanvasElement) {
  const context = output.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.drawImage(source, 0, 0);
}

// Pixel-space dissolve instead of CSS opacity fading. Linear interpolation of
// premultiplied RGBA keeps the character's opacity at 100% where both clips
// contain Mara, so she no longer briefly disappears against the tavern during
// a transition. Props that exist in only one clip still fade naturally.
function blendKeyedCanvases(
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
  outputCanvas: HTMLCanvasElement,
  progress: number,
) {
  const fromContext = fromCanvas.getContext("2d", { willReadFrequently: true });
  const toContext = toCanvas.getContext("2d", { willReadFrequently: true });
  const outputContext = outputCanvas.getContext("2d");
  if (!fromContext || !toContext || !outputContext) return;

  const from = fromContext.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
  const to = toContext.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
  const outputImage = getBlendImageData(outputCanvas, outputContext);
  const out = outputImage.data;

  const t = Math.min(1, Math.max(0, progress));
  const inverse = 1 - t;

  for (let index = 0; index < out.length; index += 4) {
    const fromAlpha = from[index + 3] / 255;
    const toAlpha = to[index + 3] / 255;
    const outAlpha = fromAlpha * inverse + toAlpha * t;

    if (outAlpha <= 0.001) {
      out[index] = 0;
      out[index + 1] = 0;
      out[index + 2] = 0;
      out[index + 3] = 0;
      continue;
    }

    const fromWeight = fromAlpha * inverse;
    const toWeight = toAlpha * t;
    out[index] = Math.round((from[index] * fromWeight + to[index] * toWeight) / outAlpha);
    out[index + 1] = Math.round((from[index + 1] * fromWeight + to[index + 1] * toWeight) / outAlpha);
    out[index + 2] = Math.round((from[index + 2] * fromWeight + to[index + 2] * toWeight) / outAlpha);
    out[index + 3] = Math.round(outAlpha * 255);
  }

  outputContext.putImageData(outputImage, 0, 0);
}

function waitForLoadedData(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Innkeeper video failed to load."));
    };
    const cleanup = () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function seekToStart(video: HTMLVideoElement) {
  if (video.currentTime <= 0.015) {
    video.currentTime = 0;
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const onSeeked = () => resolve();
    video.addEventListener("seeked", onSeeked, { once: true });
    video.currentTime = 0;
  });
}

export default function InnkeeperVideo({
  className,
  label,
  supporter,
}: {
  className?: string;
  label: string;
  supporter: "mara" | "aldren";
}) {
  const clips = supporter === "mara" ? MARA_CLIPS : ALDREN_CLIPS;
  const videoRefs = useRef<[FrameVideo | null, FrameVideo | null]>([null, null]);
  const sourceCanvasRefs = useRef<[HTMLCanvasElement | null, HTMLCanvasElement | null]>([null, null]);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const slotClipRef = useRef<[InnkeeperClip, InnkeeperClip]>(["idle", "idle"]);
  const activeSlotRef = useRef<SlotIndex>(0);
  const transitionRef = useRef<TransitionState | null>(null);
  const transitionRafRef = useRef<number | null>(null);
  const transitioningRef = useRef(false);
  const mountedRef = useRef(false);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preloaderRef = useRef<HTMLVideoElement[]>([]);
  const transitionFnRef = useRef<((clip: InnkeeperClip, reason: TransitionReason) => void) | null>(null);
  const reducedMotionRef = useRef(false);
  const watchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const externalRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingExternalClipRef = useRef<InnkeeperClip | null>(null);
  const actionQueueRef = useRef<InnkeeperClip[]>([]);

  const [reducedMotion, setReducedMotion] = useState(false);

  const getSourceCanvas = useCallback((slot: SlotIndex) => {
    let canvas = sourceCanvasRefs.current[slot];
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      sourceCanvasRefs.current[slot] = canvas;
    }
    return canvas;
  }, []);

  const renderActiveFrame = useCallback((slot = activeSlotRef.current) => {
    const output = outputCanvasRef.current;
    if (!output) return;
    copyKeyedCanvas(getSourceCanvas(slot), output);
  }, [getSourceCanvas]);

  const clearActionTimer = useCallback(() => {
    if (!actionTimerRef.current) return;
    clearTimeout(actionTimerRef.current);
    actionTimerRef.current = null;
  }, []);

  const stopTransitionAnimation = useCallback(() => {
    if (transitionRafRef.current !== null) {
      window.cancelAnimationFrame(transitionRafRef.current);
      transitionRafRef.current = null;
    }
    transitionRef.current = null;
  }, []);

  const scheduleNextActionRef = useRef<() => void>(() => undefined);

  const prepareSlot = useCallback(async (slot: SlotIndex, clip: InnkeeperClip) => {
    const video = videoRefs.current[slot];
    if (!video) throw new Error("Innkeeper video slot is unavailable.");

    video.pause();
    slotClipRef.current[slot] = clip;

    const source = clips[clip] ?? clips.idle;
    const requestedSrc = new URL(source, window.location.origin).href;
    if (video.src !== requestedSrc) {
      video.src = source;
      video.load();
    }

    await waitForLoadedData(video);
    await seekToStart(video);
    drawChromaFrame(video, getSourceCanvas(slot));
  }, [clips, getSourceCanvas]);

  const crossfadeTo = useCallback(async (nextClip: InnkeeperClip, reason: TransitionReason) => {
    if (!mountedRef.current || reducedMotionRef.current || transitioningRef.current) return;

    const fromSlot = activeSlotRef.current;
    const toSlot = (fromSlot === 0 ? 1 : 0) as SlotIndex;
    const outgoingVideo = videoRefs.current[fromSlot];
    const incomingVideo = videoRefs.current[toSlot];
    const outputCanvas = outputCanvasRef.current;
    if (!outgoingVideo || !incomingVideo || !outputCanvas) return;

    transitioningRef.current = true;
    if (reason !== "idle-loop") clearActionTimer();
    stopTransitionAnimation();

    try {
      await prepareSlot(toSlot, nextClip);
      if (!mountedRef.current) return;

      await incomingVideo.play();
      if (!mountedRef.current) return;
      drawChromaFrame(incomingVideo, getSourceCanvas(toSlot));

      const state: TransitionState = {
        fromSlot,
        toSlot,
        nextClip,
        reason,
        startedAt: performance.now(),
      };
      transitionRef.current = state;

      const animateTransition = (now: number) => {
        if (!mountedRef.current || transitionRef.current !== state) return;

        const progress = Math.min(1, (now - state.startedAt) / CROSSFADE_MS);
        const eased = smoothstep(progress);
        blendKeyedCanvases(
          getSourceCanvas(state.fromSlot),
          getSourceCanvas(state.toSlot),
          outputCanvas,
          eased,
        );

        if (progress < 1) {
          transitionRafRef.current = window.requestAnimationFrame(animateTransition);
          return;
        }

        transitionRafRef.current = null;
        transitionRef.current = null;
        outgoingVideo.pause();
        activeSlotRef.current = state.toSlot;
        transitioningRef.current = false;
        renderActiveFrame(state.toSlot);

        if (state.nextClip === "idle" && state.reason !== "idle-loop") {
          scheduleNextActionRef.current();
        }
      };

      transitionRafRef.current = window.requestAnimationFrame(animateTransition);
    } catch {
      stopTransitionAnimation();
      transitioningRef.current = false;
      incomingVideo.pause();

      if (
        outgoingVideo.ended
        || (Number.isFinite(outgoingVideo.duration) && outgoingVideo.currentTime >= outgoingVideo.duration - 0.05)
      ) {
        outgoingVideo.currentTime = 0;
      }

      void outgoingVideo.play().catch(() => undefined);
      renderActiveFrame(fromSlot);
      if (slotClipRef.current[fromSlot] === "idle") scheduleNextActionRef.current();
    }
  }, [clearActionTimer, getSourceCanvas, prepareSlot, renderActiveFrame, stopTransitionAnimation]);

  useEffect(() => {
    transitionFnRef.current = (clip, reason) => {
      void crossfadeTo(clip, reason);
    };
  }, [crossfadeTo]);

  useEffect(() => {
    const actionPool: InnkeeperClip[] = supporter === "aldren"
      ? ["ale", "salt", "coin1", "coin2"]
      : ["tankard", "ale"];

    // Shuffle once, then move each played clip to the back. This keeps the
    // random feel while guaranteeing that a clip cannot repeat until the
    // rest of this innkeeper's action pool has had a turn.
    actionQueueRef.current = [...actionPool].sort(() => Math.random() - 0.5);

    scheduleNextActionRef.current = () => {
      clearActionTimer();
      if (!mountedRef.current || reducedMotionRef.current) return;
      if (slotClipRef.current[activeSlotRef.current] !== "idle") return;

      const delay = IDLE_ACTION_MIN_MS + Math.random() * (IDLE_ACTION_MAX_MS - IDLE_ACTION_MIN_MS);
      const tryAction = () => {
        actionTimerRef.current = null;
        if (!mountedRef.current || reducedMotionRef.current) return;

        if (transitioningRef.current || slotClipRef.current[activeSlotRef.current] !== "idle") {
          actionTimerRef.current = setTimeout(tryAction, 750);
          return;
        }

        const action = actionQueueRef.current.shift();
        if (!action) return;
        actionQueueRef.current.push(action);
        transitionFnRef.current?.(action, "action");
      };

      actionTimerRef.current = setTimeout(tryAction, delay);
    };
  }, [clearActionTimer, supporter]);

  useEffect(() => {
    const tryExternalClip = () => {
      if (!mountedRef.current || reducedMotionRef.current) return;
      const clip = pendingExternalClipRef.current;
      if (!clip) return;

      if (transitioningRef.current) {
        if (externalRetryRef.current) clearTimeout(externalRetryRef.current);
        externalRetryRef.current = setTimeout(tryExternalClip, 90);
        return;
      }

      pendingExternalClipRef.current = null;
      clearActionTimer();
      transitionFnRef.current?.(clip, "external");
    };

    const onExternalAction = (event: Event) => {
      const detail = (event as CustomEvent<{ clip?: string }>).detail;
      if (detail?.clip !== "salt" || supporter === "aldren") return;
      pendingExternalClipRef.current = "salt";
      tryExternalClip();
    };

    window.addEventListener(GREAT_GAME_INNKEEPER_ACTION_EVENT, onExternalAction);
    return () => {
      window.removeEventListener(GREAT_GAME_INNKEEPER_ACTION_EVENT, onExternalAction);
      if (externalRetryRef.current) clearTimeout(externalRetryRef.current);
      externalRetryRef.current = null;
      pendingExternalClipRef.current = null;
    };
  }, [clearActionTimer, supporter]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = media.matches;
      setReducedMotion(media.matches);
    };
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Create both keying canvases before playback so the compositor always has
    // a valid source even on the first transition.
    getSourceCanvas(0);
    getSourceCanvas(1);

    const preloadClips: InnkeeperClip[] = supporter === "mara"
      ? ["tankard", "ale", "salt"]
      : ["ale", "salt", "coin1", "coin2"];
    const preloaders = preloadClips.map((clip) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.src = clips[clip] ?? clips.idle;
      video.load();
      return video;
    });
    preloaderRef.current = preloaders;

    const start = async () => {
      try {
        await prepareSlot(0, "idle");
        if (!mountedRef.current) return;
        renderActiveFrame(0);

        if (reducedMotionRef.current) return;
        const firstVideo = videoRefs.current[0];
        if (firstVideo) await firstVideo.play();
        scheduleNextActionRef.current();
      } catch {
        // Leave the innkeeper area transparent rather than exposing green if
        // the first clip cannot be decoded.
      }
    };

    void start();

    return () => {
      mountedRef.current = false;
      clearActionTimer();
      if (externalRetryRef.current) clearTimeout(externalRetryRef.current);
      externalRetryRef.current = null;
      pendingExternalClipRef.current = null;
      stopTransitionAnimation();
      videoRefs.current.forEach((video) => video?.pause());
      preloaderRef.current.forEach((video) => {
        video.pause();
        video.removeAttribute("src");
        video.load();
      });
      preloaderRef.current = [];
    };
  }, [clearActionTimer, clips, getSourceCanvas, prepareSlot, renderActiveFrame, stopTransitionAnimation, supporter]);

  useEffect(() => {
    const videos = videoRefs.current;
    const cleanups: Array<() => void> = [];

    videos.forEach((video, rawSlot) => {
      if (!video) return;
      const slot = rawSlot as SlotIndex;
      let stopped = false;
      let animationFrame = 0;
      let videoFrame = 0;

      const draw = () => {
        if (stopped) return;
        drawChromaFrame(video, getSourceCanvas(slot));

        if (!transitioningRef.current && slot === activeSlotRef.current) {
          renderActiveFrame(slot);
        }

        if (
          slot === activeSlotRef.current
          && !transitioningRef.current
          && !reducedMotionRef.current
          && Number.isFinite(video.duration)
          && video.duration > 0
        ) {
          const remaining = video.duration - video.currentTime;
          const currentClip = slotClipRef.current[slot];

          if (currentClip === "idle" && remaining <= IDLE_LOOP_LEAD_MS / 1000) {
            transitionFnRef.current?.("idle", "idle-loop");
          } else if (currentClip !== "idle" && remaining <= ACTION_RETURN_LEAD_MS / 1000) {
            // Start returning to idle *before* an action clip reaches its final
            // frame. Some generated MP4s/browser combinations can sit on the
            // last decoded frame without dispatching `ended` promptly, which
            // previously left Mara frozen after ale/tankard actions.
            transitionFnRef.current?.("idle", "return-to-idle");
          }
        }
      };

      if (typeof video.requestVideoFrameCallback === "function") {
        const onFrame = () => {
          draw();
          if (!stopped) videoFrame = video.requestVideoFrameCallback?.(onFrame) ?? 0;
        };
        videoFrame = video.requestVideoFrameCallback(onFrame);
      } else {
        const onFrame = () => {
          if (!video.paused || video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) draw();
          if (!stopped) animationFrame = window.requestAnimationFrame(onFrame);
        };
        animationFrame = window.requestAnimationFrame(onFrame);
      }

      cleanups.push(() => {
        stopped = true;
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        if (videoFrame) video.cancelVideoFrameCallback?.(videoFrame);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [getSourceCanvas, renderActiveFrame]);

  useEffect(() => {
    if (watchdogRef.current) clearInterval(watchdogRef.current);

    watchdogRef.current = setInterval(() => {
      if (!mountedRef.current || reducedMotionRef.current || transitioningRef.current) return;

      const slot = activeSlotRef.current;
      const video = videoRefs.current[slot];
      if (!video) return;

      const currentClip = slotClipRef.current[slot];
      const duration = video.duration;
      const hasDuration = Number.isFinite(duration) && duration > 0;
      const remaining = hasDuration ? duration - video.currentTime : Number.POSITIVE_INFINITY;

      if (currentClip === "idle") {
        if (video.ended || (hasDuration && remaining <= IDLE_LOOP_LEAD_MS / 1000)) {
          transitionFnRef.current?.("idle", "idle-loop");
          return;
        }
      } else if (
        video.ended
        || (hasDuration && remaining <= ACTION_RETURN_LEAD_MS / 1000)
        || (video.paused && hasDuration && remaining <= 0.75)
      ) {
        // Belt-and-suspenders fallback for action clips. Do not depend on the
        // media `ended` event alone: proactively return to idle if the clip is
        // at/near its end or has unexpectedly paused on the final frame.
        transitionFnRef.current?.("idle", "return-to-idle");
        return;
      }

      // If playback was interrupted for a non-terminal reason, resume it.
      if (video.paused && !video.ended) {
        void video.play().catch(() => undefined);
      }
    }, PLAYBACK_WATCHDOG_MS);

    return () => {
      if (watchdogRef.current) clearInterval(watchdogRef.current);
      watchdogRef.current = null;
    };
  }, []);

  const handleEnded = useCallback((slot: SlotIndex) => {
    if (!mountedRef.current || reducedMotionRef.current) return;
    if (slot !== activeSlotRef.current || transitioningRef.current) return;

    const currentClip = slotClipRef.current[slot];
    if (currentClip === "idle") {
      transitionFnRef.current?.("idle", "idle-loop");
    } else {
      transitionFnRef.current?.("idle", "return-to-idle");
    }
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;

    clearActionTimer();
    const activeVideo = videoRefs.current[activeSlotRef.current];
    if (!activeVideo) return;

    if (reducedMotion) {
      videoRefs.current.forEach((video) => video?.pause());
      renderActiveFrame(activeSlotRef.current);
      return;
    }

    void activeVideo.play().catch(() => undefined);
    if (slotClipRef.current[activeSlotRef.current] === "idle") scheduleNextActionRef.current();
  }, [clearActionTimer, reducedMotion, renderActiveFrame]);

  return (
    <>
      <canvas
        ref={outputCanvasRef}
        className={className}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label={label}
        role="img"
      />

      {([0, 1] as const).map((slot) => (
        <video
          key={`innkeeper-video-${slot}`}
          ref={(node) => {
            videoRefs.current[slot] = node;
          }}
          muted
          playsInline
          preload="auto"
          onEnded={() => handleEnded(slot)}
          aria-hidden="true"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      ))}
    </>
  );
}
