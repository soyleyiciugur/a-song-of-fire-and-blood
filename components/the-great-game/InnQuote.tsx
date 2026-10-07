"use client";
import { useEffect, useState } from "react";
import { chooseInnQuote, type InnQuote as Quote, type InnQuoteKind } from "@/lib/the-great-game/inn-quotes";
import { pickTableSpeaker } from "@/lib/the-great-game/table-speaker";

export default function InnQuote({ kind, className }: { kind: InnQuoteKind; className?: string }) {
  const [selection, setSelection] = useState<{ kind: InnQuoteKind; quote: Quote } | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSelection({ kind, quote: chooseInnQuote(kind, pickTableSpeaker()) }), 0);
    return () => clearTimeout(timer);
  }, [kind]);
  const quote = selection?.kind === kind ? selection.quote : null;
  return <p className={className} data-inn-speaker={quote?.speaker} style={!quote ? { visibility: "hidden" } : undefined}>
    <span>“{quote?.text ?? "A warm hearth and a willing opponent improve any evening."}”</span><small>— {quote?.speaker === "aldren" ? "Aldren" : "Mara"}</small>
  </p>;
}
