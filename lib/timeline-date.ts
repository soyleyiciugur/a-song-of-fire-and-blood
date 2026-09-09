type WorldDate = { day: number; moon: number; year: number };

export function timelineDateOrder({ day, moon, year }: WorldDate): number {
  return year * 360 + (moon - 1) * 30 + day - 1;
}

/** Use the start of ranges; Early/Mid/Late sort at the start of each third. */
export function parseTimelineDate(date?: string, chapterDate?: string): number {
  const text = date ?? chapterDate ?? "";
  const year = text.match(/(\d+)\s+AC\b/i)?.[1]
    ?? chapterDate?.match(/(\d+)\s+AC\b/i)?.[1];
  const moon = text.match(/(\d+)(?:st|nd|rd|th)?\s+Moon\b/i)?.[1];
  const day = text.match(/^(\d+)(?:st|nd|rd|th)?(?:\s*[–-]\s*\d+(?:st|nd|rd|th)?)?\s+of\s+(?:the\s+)?/i)?.[1];
  const approximateDay = /^Late\b/i.test(text) ? 21 : /^Mid\b/i.test(text) ? 11 : 1;
  if (!year || !moon) return Number.POSITIVE_INFINITY;
  return timelineDateOrder({ year: Number(year), moon: Number(moon), day: day ? Number(day) : approximateDay });
}
