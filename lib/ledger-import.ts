import type { LedgerChecklistItem } from "@/lib/supabase/database.types";

export const LEDGER_IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const LEDGER_IMPORT_MAX_ENTRIES = 250;

export interface LedgerImportDraft {
  heading: string;
  matter: string;
  checklist: LedgerChecklistItem[];
  pinned: boolean;
  status: "open" | "settled";
  archived: boolean;
  character_ids: string[];
  chapter_slug: string | null;
}

export interface LedgerImportResult {
  entries: LedgerImportDraft[];
  warnings: string[];
}

function objectValue(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeChecklist(value: unknown, rowNumber: number, warnings: string[]) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`Entry ${rowNumber}: checklist must be an array.`);
  return value.map((item, itemIndex) => {
    const row = objectValue(item);
    if (!row || typeof row.text !== "string") {
      throw new Error(`Entry ${rowNumber}, matter ${itemIndex + 1}: text is required.`);
    }
    if (row.text.length > 500) throw new Error(`Entry ${rowNumber}, matter ${itemIndex + 1}: text exceeds 500 characters.`);
    if (typeof row.id !== "string" || !row.id.trim()) warnings.push(`Entry ${rowNumber}, matter ${itemIndex + 1} received a new ID.`);
    return {
      id: typeof row.id === "string" && row.id.trim() ? row.id : crypto.randomUUID(),
      text: row.text,
      done: booleanValue(row.done),
    };
  });
}

export function parseLedgerImport(
  source: string,
  knownCharacterIds: ReadonlySet<string>,
  knownChapterSlugs: ReadonlySet<string>,
): LedgerImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(source);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  const envelope = objectValue(parsed);
  const rows = Array.isArray(parsed) ? parsed : envelope && Array.isArray(envelope.entries) ? envelope.entries : null;
  if (!rows) throw new Error('Use a JSON array or an object containing an "entries" array.');
  if (!rows.length) throw new Error("This file contains no ledger entries.");
  if (rows.length > LEDGER_IMPORT_MAX_ENTRIES) throw new Error(`A single import may contain at most ${LEDGER_IMPORT_MAX_ENTRIES} entries.`);

  const warnings: string[] = [];
  const entries = rows.map((item, index): LedgerImportDraft => {
    const rowNumber = index + 1;
    const row = objectValue(item);
    if (!row) throw new Error(`Entry ${rowNumber} must be an object.`);
    if (typeof row.heading !== "string" || !row.heading.trim()) throw new Error(`Entry ${rowNumber}: heading is required.`);
    if (row.heading.length > 140) throw new Error(`Entry ${rowNumber}: heading exceeds 140 characters.`);
    const matter = row.matter === undefined || row.matter === null ? "" : row.matter;
    if (typeof matter !== "string") throw new Error(`Entry ${rowNumber}: matter must be text.`);
    if (matter.length > 4000) throw new Error(`Entry ${rowNumber}: matter exceeds 4000 characters.`);
    const status = row.status ?? "open";
    if (status !== "open" && status !== "settled") throw new Error(`Entry ${rowNumber}: status must be "open" or "settled".`);

    const rawCharacterIds = row.character_ids ?? [];
    if (!Array.isArray(rawCharacterIds) || rawCharacterIds.some((id) => typeof id !== "string")) {
      throw new Error(`Entry ${rowNumber}: character_ids must be an array of strings.`);
    }
    const characterIds = [...new Set(rawCharacterIds)].filter((id) => {
      if (knownCharacterIds.has(id)) return true;
      warnings.push(`Entry ${rowNumber}: unknown character "${id}" was left unbound.`);
      return false;
    });

    const rawChapterSlug = row.chapter_slug ?? null;
    if (rawChapterSlug !== null && typeof rawChapterSlug !== "string") throw new Error(`Entry ${rowNumber}: chapter_slug must be text or null.`);
    const chapterSlug = rawChapterSlug && knownChapterSlugs.has(rawChapterSlug) ? rawChapterSlug : null;
    if (rawChapterSlug && !chapterSlug) warnings.push(`Entry ${rowNumber}: unknown chapter "${rawChapterSlug}" was left unbound.`);

    return {
      heading: row.heading.trim(),
      matter,
      checklist: normalizeChecklist(row.checklist, rowNumber, warnings),
      pinned: booleanValue(row.pinned),
      status,
      archived: booleanValue(row.archived),
      character_ids: characterIds,
      chapter_slug: chapterSlug,
    };
  });

  return { entries, warnings };
}
