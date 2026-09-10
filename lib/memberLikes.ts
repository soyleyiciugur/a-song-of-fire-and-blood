"use client";
import { createClient } from "@/lib/supabase/client";
type LikeState = { count: number; liked: boolean };
type Pending = { kind: string; id: string; resolve: (value: LikeState) => void; reject: (error: unknown) => void };
let pending: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | undefined;

// A thread can contain many buttons; load their counts in one request per surface.
export function loadLikeState(kind: string, id: string): Promise<LikeState> {
  return new Promise((resolve, reject) => {
    pending.push({ kind, id, resolve, reject });
    if (timer) return;
    timer = setTimeout(async () => {
      const batch = pending; pending = []; timer = undefined;
      const supabase = createClient();
      await Promise.all([...new Set(batch.map(item => item.kind))].map(async kind => {
        const entries = batch.filter(item => item.kind === kind);
        try {
          const { data, error } = await supabase.rpc("member_like_counts", { kind, targets: [...new Set(entries.map(item => item.id))] });
          if (error) throw error;
          const rows = data as { target_id: string; total: number; liked: boolean }[];
          entries.forEach(item => { const row = rows.find(row => row.target_id === item.id); item.resolve({ count: Number(row?.total ?? 0), liked: row?.liked ?? false }); });
        } catch (error) { entries.forEach(item => item.reject(error)); }
      }));
    }, 20);
  });
}
