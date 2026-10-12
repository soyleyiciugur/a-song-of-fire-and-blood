export type ChapterTextPart = {
  text: string;
  styles: Array<"em" | "strong" | "del" | "code" | "u">;
};

// Deliberately limited inline syntax; arbitrary HTML is always literal text.
export function chapterTextParts(text: string, styles: ChapterTextPart["styles"] = []): ChapterTextPart[] {
  const pattern = /(\*\*\*|___|\*\*|__|~~|`|\*|_)(?=\S)([^\n]*?\S)\1|<u>([^\n]+?)<\/u>/g;
  const parts: ChapterTextPart[] = [];
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index! > offset) parts.push({ text: text.slice(offset, match.index), styles });
    const marker = match[1];
    const tags: ChapterTextPart["styles"] = match[3] !== undefined ? ["u"]
      : marker === "***" || marker === "___" ? ["strong", "em"]
      : marker === "**" || marker === "__" ? ["strong"]
      : marker === "~~" ? ["del"] : marker === "`" ? ["code"] : ["em"];
    const inner = match[3] ?? match[2];
    if (marker === "`") parts.push({ text: inner, styles: [...styles, ...tags] });
    else parts.push(...chapterTextParts(inner, [...styles, ...tags]));
    offset = match.index! + match[0].length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset), styles });
  return parts;
}

// Slice visible text, then restore its markers so page breaks retain styling.
export function sliceChapterText(parts: ChapterTextPart[], start: number, end: number) {
  let offset = 0;
  return parts.map((part) => {
    const text = part.text.slice(Math.max(0, start - offset), Math.max(0, end - offset));
    offset += part.text.length;
    if (!text) return "";
    const [, leading, body, trailing] = text.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    if (!body) return text;
    return leading + part.styles.reduceRight((value, style) => {
      const marker = { em: "*", strong: "**", del: "~~", code: "`", u: "<u>" }[style];
      return marker + value + (style === "u" ? "</u>" : marker);
    }, body) + trailing;
  }).join("");
}
