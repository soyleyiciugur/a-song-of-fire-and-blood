"use client";
import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { normalizeMatchCode } from "@/lib/the-great-game/online";

export default function JoinInvitation({ onCode, onOpen, open }: { onCode: (code: string) => void; onOpen: () => void; open: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const handled = useRef<string | null>(null);
  const raw = params.get("join");
  useEffect(() => {
    if (!raw) { handled.current = null; return; }
    if (handled.current === raw) return;
    const code = normalizeMatchCode(raw);
    if (code.length !== 6) return;
    handled.current = raw;
    onCode(code);
    if (!open) onOpen();
    const next = new URLSearchParams(params.toString());
    next.delete("join");
    router.replace(`/cards/play${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [raw, params, router, onCode, onOpen, open]);
  return null;
}
