// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\timeline.ts
import timelineData from "./timeline.json";

export type TimelineEvent = {
  title: string;
  description: string;
  date?: string;
  characters?: string[];
  /** Optional editorial override; when omitted it is inferred from the entry. */
  kind?: "conflict" | "death" | "politics" | "family" | "travel" | "revelation" | "other";
  location?: string;
  cause?: string;
  consequence?: string;
};

export type TimelineChapter = {
  chapterSlug: string;
  chapterTitle: string;
  date?: string;
  events: TimelineEvent[];
};

export const timeline: TimelineChapter[] = timelineData as TimelineChapter[];

const KIND_PATTERNS: Record<Exclude<TimelineEvent["kind"], undefined>, RegExp> = {
  death: /dead|death|die|dies|killed|murder|execut|slaughter|massacre|poison/i,
  conflict: /battle|duel|fight|war|kill|murder|assault|tourney|combat|attack|clash|sword/i,
  politics: /king|crown|throne|heir|council|hand|lord|claim|alliance|war|faith/i,
  family: /father|mother|brother|sister|son|daughter|wife|husband|child|family|marry/i,
  travel: /travel|arrive|depart|fly|flee|escape|journey|ride|return|reach/i,
  revelation: /reveal|secret|discover|learn|confess|letter|identity|truth|unknown/i,
  other: /$a/,
};

export function getTimelineEventKind(event: TimelineEvent): NonNullable<TimelineEvent["kind"]> {
  if (event.kind) return event.kind;
  const text = `${event.title} ${event.description}`;
  if (KIND_PATTERNS.death.test(text)) return "death";
  if (KIND_PATTERNS.conflict.test(text)) return "conflict";
  if (KIND_PATTERNS.politics.test(text)) return "politics";
  if (KIND_PATTERNS.family.test(text)) return "family";
  if (KIND_PATTERNS.travel.test(text)) return "travel";
  if (KIND_PATTERNS.revelation.test(text)) return "revelation";
  return "other";
}
