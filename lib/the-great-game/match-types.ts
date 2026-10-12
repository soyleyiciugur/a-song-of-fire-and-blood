export type MatchType = "custom" | "ranked";
export type MatchScope = "total" | MatchType;
export const MATCH_TYPES = [
 {value:"custom" as const,label:"Friendly",title:"A friendly table",description:"Test your hand by the hearth. No rating or rank changes."},
 {value:"ranked" as const,label:"Crown",title:"A contest for the crown",description:"Stake your reputation. Results count toward rating, Ranks and seasons."},
];
/** Omitted values belong to legacy clients, whose tables were always ranked. */
export function parseMatchType(value: unknown): MatchType {
 if(value===undefined) return "ranked";
 if(value==="custom" || value==="ranked") return value;
 throw new Error("Choose Friendly or Crown.");
}
export function matchTypeLabel(value?: MatchType): string {return value==="custom"?"Friendly":"Crown";}
