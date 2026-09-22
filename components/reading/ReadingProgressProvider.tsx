"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LEGACY_BOOKMARK_STORAGE_KEY,
  normalizeReadingProgress,
  READING_PROGRESS_STORAGE_KEY,
  type ReadingProgress,
  isWithinSpoilerBoundary,
} from "@/lib/reading-progress";

type ReadingProgressContextValue = {
  progress: ReadingProgress | null;
  ready: boolean;
  setProgress: (chapterSlug: string, page?: number) => Promise<void>;
  clearProgress: () => Promise<void>;
  updatePosition: (chapterSlug: string, page: number) => Promise<void>;
};

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

function readLocalProgress() {
  try {
    return normalizeReadingProgress(
      JSON.parse(localStorage.getItem(READING_PROGRESS_STORAGE_KEY) ?? localStorage.getItem(LEGACY_BOOKMARK_STORAGE_KEY) ?? "null"),
    );
  } catch {
    return null;
  }
}

function writeLocalProgress(progress: ReadingProgress) {
  localStorage.setItem(READING_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  localStorage.setItem(LEGACY_BOOKMARK_STORAGE_KEY, JSON.stringify({ slug: progress.chapterSlug, page: progress.page }));
}

export default function ReadingProgressProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [progress, updateProgress] = useState<ReadingProgress | null>(null);
  const [ready, setReady] = useState(false);

  const hydrate = useCallback(async () => {
    const local = readLocalProgress();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      updateProgress(local);
      setReady(true);
      return;
    }
    const { data } = await supabase.from("reading_progress").select("chapter_slug,page_index,updated_at").eq("user_id", user.id).maybeSingle();
    const remote = data ? normalizeReadingProgress({ chapterSlug: data.chapter_slug, page: data.page_index, updatedAt: data.updated_at }) : null;
    const chosen = remote && (!local || Date.parse(remote.updatedAt) >= Date.parse(local.updatedAt)) ? remote : local;
    if (chosen) {
      writeLocalProgress(chosen);
      updateProgress(chosen);
      if (!remote || chosen.updatedAt !== remote.updatedAt) {
        await supabase.from("reading_progress").upsert({ user_id: user.id, chapter_slug: chosen.chapterSlug, page_index: chosen.page }, { onConflict: "user_id" });
      }
    }
    setReady(true);
  }, [supabase]);

  useEffect(() => {
    const initial = window.setTimeout(() => void hydrate(), 0);
    const { data } = supabase.auth.onAuthStateChange(() => { setTimeout(() => void hydrate(), 0); });
    return () => {
      window.clearTimeout(initial);
      data.subscription.unsubscribe();
    };
  }, [hydrate, supabase]);

  const setProgress = useCallback(async (chapterSlug: string, page = 0) => {
    const next = normalizeReadingProgress({ chapterSlug, page, updatedAt: new Date().toISOString() });
    if (!next) return;
    writeLocalProgress(next);
    updateProgress(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("reading_progress").upsert({ user_id: user.id, chapter_slug: next.chapterSlug, page_index: next.page }, { onConflict: "user_id" });
  }, [supabase]);

  const updatePosition = useCallback(async (chapterSlug: string, page: number) => {
    if (progress?.chapterSlug !== chapterSlug) return;
    const next = normalizeReadingProgress({ chapterSlug, page, updatedAt: new Date().toISOString() });
    if (!next) return;
    writeLocalProgress(next);
    updateProgress(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("reading_progress").upsert({ user_id: user.id, chapter_slug: next.chapterSlug, page_index: next.page }, { onConflict: "user_id" });
  }, [progress?.chapterSlug, supabase]);

  const clearProgress = useCallback(async () => {
    localStorage.removeItem(READING_PROGRESS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_BOOKMARK_STORAGE_KEY);
    updateProgress(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("reading_progress").delete().eq("user_id", user.id);
  }, [supabase]);

  return <ReadingProgressContext.Provider value={{ progress, ready, setProgress, clearProgress, updatePosition }}>{children}</ReadingProgressContext.Provider>;
}

export function useReadingProgress() {
  const value = useContext(ReadingProgressContext);
  if (!value) throw new Error("useReadingProgress must be used within ReadingProgressProvider");
  return value;
}

export function useSpoilerBoundary() {
  const { progress, ready } = useReadingProgress();
  return {
    boundaryChapterSlug: progress?.chapterSlug ?? null,
    ready,
    canReveal: useCallback((chapterSlug?: string | null) => !ready || isWithinSpoilerBoundary(chapterSlug, progress?.chapterSlug), [progress?.chapterSlug, ready]),
  };
}
