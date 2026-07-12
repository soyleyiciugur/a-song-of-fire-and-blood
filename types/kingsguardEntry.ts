// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\types\kingsguardEntry.ts
export interface KingsguardDeed {
  date?: string; // in-universe date, e.g. "97 AC"
  description: string;
}

export interface KingsguardEntry {
  id: string;
  /**
   * Links this entry to an existing character — name, portrait, and status
   * are pulled from there automatically. Leave empty for legendary/historical
   * knights who don't have a full character page; use the manual* fields
   * below instead.
   */
  characterId?: string;
  /** Fallback display name, used only when characterId is empty */
  manualName?: string;
  /** Fallback title/epithet, used only when characterId is empty */
  manualTitle?: string;
  /** In-universe date this knight took the white cloak */
  appointedDate?: string;
  /** In-universe date their service ended (death, retirement, dismissal) */
  endDate?: string;
  /** Character ID of the knight whose place on the Kingsguard they took, if any */
  precedingCharacterId?: string;
  /** The vow itself, or personal variations on it, as sworn before the King */
  oath?: string;
  /** Chronological record of notable deeds during their service, White-Book style */
  deeds: KingsguardDeed[];
  /** Editor notes, not shown publicly unless you choose to render them */
  notes?: string;
  published: boolean;
}
