export type ScrollCategory =
  | "Natural History"
  | "Religion & Faith"
  | "War & Conquest"
  | "Medicine & Affliction"
  | "Genealogy & Lineage"
  | "Law & Governance"
  | "Myth & Legend";

export interface Scroll {
  id: string;
  title: string;
  subtitle?: string;
  /** e.g. "Maester Aemon" */
  author: string;
  /** e.g. "Maester of Castle Black" */
  authorTitle?: string;
  category: ScrollCategory;
  /** Short teaser shown on the archive/list page */
  summary: string;
  /** Body content. Separate paragraphs with a blank line (\n\n). */
  content: string;
  /** Character IDs this scroll references or is about */
  relatedCharacterIds: string[];
  /** House names this scroll references or is about — stores house.name, same convention as Character.house */
  relatedHouses: string[];
  /** Optional free-text reference to a chapter this scroll was found/mentioned in */
  chapterRef?: string;
  /** In-universe date, e.g. "102 AC" */
  dateWritten?: string;
  /** House name whose sigil is stamped as the wax seal. Falls back to a maester's chain seal if omitted. */
  sealHouse?: string;
  published: boolean;
}
