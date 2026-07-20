// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\app\api\admin\content-sync\route.ts

import { NextRequest, NextResponse } from "next/server";

// Maps each detection type to the data file(s) it should be checked against,
// relative to the repo's data directory. A type can map to more than one file
// (e.g. "map" is split across two files, and "relationships" data actually
// lives inside characters.json rather than its own file).
const TYPE_FILE_MAP: Record<string, string[]> = {
  characters: ["characters/characters.json", "bookOfBrothers.json"],
  houses: ["houses.json"],
  dragons: ["dragons.json"],
  timeline: ["timeline.json", "chapters/chapters.json"],
  events: ["events.json", "chapters/chapters.json"],
  map: ["map/character-positions.json", "map/locations.json"],
  dates: ["worldDate.json"],
  relationships: ["characters/characters.json"],
  quotes: ["quotes.json", "chapters/chapters.json"],
};

function resolveGithubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || undefined;
}

async function fetchGithubFile(
  repo: string,
  branch: string,
  path: string
): Promise<{ path: string; content: string } | { path: string; error: string }> {
  const token = resolveGithubToken();
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURI(path)}?ref=${encodeURIComponent(branch)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
      // Always get the latest — never cache a stale copy of the data files.
      cache: "no-store",
    });

    if (!res.ok) {
      return { path, error: `${res.status} ${res.statusText}` };
    }

    const content = await res.text();
    return { path, content };
  } catch (err: unknown) {
    return { path, error: err instanceof Error ? err.message : "fetch failed" };
  }
}

const SYSTEM_PROMPT = `You are a lore analyst for a Game of Thrones fan fiction project called "A Song of Fire and Blood".
Your job is to read a chapter and extract structured data changes to update the site's JSON data files.

The data files use these schemas. Follow them EXACTLY — field names, casing, and value style matter because
the output is merged directly into these files.

- characters: { id, name, nickname, aliases[], house, title, status, age, nameday: { day, moon, year }, height,
  father, mother, spouse, siblings[], children[], mentor, dragon, traits[], goals[], relationships: { otherCharacterId: "one sentence" },
  summary, quotes[] }
  -- traits[] MUST be short (1-3 word) adjectives or noun-phrases, e.g. "Loyal", "Quietly Ruthless", "Battle-Scarred".
     NEVER a full sentence. If unsure, omit rather than pad.
  -- summary is 2-5 sentences of prose.
  -- relationships values are ONE sentence each, written from that character's point of view about the other person.
- houses: { id, name, words, seat, sigilSrc, color, secondaryColor, description }
- dragons: { id, name, status, riderId, previousRiderId, image, traits[], description }
  -- traits[] follow the same short-phrase rule as characters.
- timeline: { chapterSlug, chapterTitle, date, events: [ { title, description, date, characters[] } ] }
  -- Use this ONLY for chapter-level story beats grouped under a chapter. "date" is a loose in-world phrase (e.g. "Early 3rd Moon, 99 AC").
- events: { id, title, type, location, chapterSlug, day, moon, year, description }
  -- Use this for a SINGLE, dateable, named occurrence (a feast, wedding, battle, coronation, etc.) that deserves its
     own standalone entry, distinct from the broader timeline. "type" is a short lowercase category like "feast", "wedding", "battle".
     "day"/"moon"/"year" are integers (in-world calendar).
- map: { character, from, to, reason } — this data lives across two files, character-positions.json and
  locations.json; when context for both is provided, treat character-positions.json as the source of truth for
  who is currently where.
- dates: { day, moon, year, era }
  -- A single specific in-world calendar date explicitly mentioned in the text (era is usually "AC"). Only emit this
     when the chapter states an explicit day/moon/year, not a vague phrase. Emit the latest date the chapter mentions. Emit it via "value", not "fields" (see below).
- relationships: relationship data is NOT a separate file — it lives inside each character's own "relationships"
  object in characters.json ({ character1, character2, type, description } describes the shape of a single
  relationship conceptually, but it should be emitted as an update to the relevant character's "relationships" map,
  keyed by the other character's id, value a one-sentence description from that character's point of view).
- quotes: { text, speakerId, speakerName, chapterSlug, chapterTitle, note }
  -- "note" is optional short context like "to Visenor" or null.

If bookOfBrothers.json is included in the context, it's supplementary reference data — Kingsguard service records
keyed by characterId (oath, appointedDate, endDate, deeds[]) — not itself a detection type. Use it only to inform
"characters" changes for anyone who is or was a sworn Kingsguard brother; don't try to emit changes shaped like it.

If chapters.json is included in the context, it's the canonical list of existing chapters (slug, title, and
similar metadata). Use it to match "chapterSlug"/"chapterTitle" values exactly against real, existing chapters
rather than inventing a slug — this matters for "timeline", "events", and "quotes" changes.

Return ONLY valid JSON. No prose, no markdown fences, no explanation before or after.
The JSON must be complete and valid. If you have many changes, keep each entry concise to stay within limits.

CRITICAL: every change must include a "value" object — the COMPLETE, ready-to-merge record in the exact schema
shape for that type, with every field filled in (using "-" or [] for fields the chapter doesn't address, same as
the existing data style). This is the object a human will paste directly into the JSON file, so it must be whole,
not a partial patch. Do not make the reader reconstruct it from a diff. Do not remove previously added data unless something has changed about the said data with the latest chapter. 

For "update" operations, "value" must be the FULL updated record (existing fields the "existing JSON context"
already had, carried over unchanged, plus whatever this chapter changed) — never just the changed fields alone.
If you don't have the full existing record because no JSON context was provided, still output every field you can
infer or mark unknown ones "-", but never omit a schema field from "value".

You may ALSO include "fields" — a lighter old/new diff purely for human review UI (only for the fields that
actually changed, using "old"/"new") — but "value" is mandatory and authoritative; "fields" is optional and
supplementary.

Required structure:
{
  "summary": "1-2 sentence summary of the chapter's lore impact",
  "changes": [
    {
      "type": "characters|houses|dragons|timeline|events|map|dates|relationships|quotes",
      "operation": "new|update|note",
      "subject": "Name, identifier, or short human-readable label",
      "slug": "kebab-case-slug (omit for dates)",
      "confidence": "high|medium|low",
      "value": { "...": "the COMPLETE final record in the target schema — mandatory for new/update" },
      "fields": { "fieldName": { "old": "previous value or null", "new": "new value", "note": "optional context" } },
      "note": "optional general note (used alone for operation \"note\", where no value/fields apply)"
    }
  ]
}

Confidence rules (be honest — this drives which changes a human reviews first):
- "high": the chapter states this outright and unambiguously (a name, a death, an explicit date, a direct quote).
- "medium": reasonably inferred from context but not stated in so many words (e.g. implied relationship shift, approximate date).
- "low": a guess, pattern-match, or something that could easily be wrong (tone read, inferred motive, uncertain slug match to an existing entry).

Rules:
- operation "new" = this entity does not exist yet — "value" is the brand new complete record
- operation "update" = an existing entity has changed — "value" is the FULL record after the update, reusing the
  existing JSON context for every field this chapter didn't touch
- operation "note" = something noteworthy but not a structural field change — use "note" only, no "value" needed
- Be conservative about WHAT you report as changed: only include changes clearly evidenced in the chapter. When
  genuinely uncertain, still include it but mark confidence "low" rather than omitting it or inflating confidence.
- Within "value", keep field values true to the schema's style — short single words/phrases for most fields, full
  prose only for summary/description/quote-text fields.
- Do not remove previously added data unless something has changed about the said data with the latest chapter.
- Slug format: lowercase-with-dashes
- Output must be complete valid JSON — do not truncate`;

function resolveApiKey(keyIndex: number): string | null {
  const keys = [
    process.env.ANTHROPIC_API_KEY,
    process.env.ANTHROPIC_API_KEY_2,
    process.env.ANTHROPIC_API_KEY_3,
    process.env.ANTHROPIC_API_KEY_4,
    process.env.ANTHROPIC_API_KEY_5,
  ];
  return keys[keyIndex] ?? null;
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();

  // Strip markdown fences
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // Find first { and last } to extract JSON object
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function repairJson(raw: string): unknown {
  // First try clean parse
  try {
    return JSON.parse(raw);
  } catch {
    // Try to recover truncated JSON by closing open structures
    let attempt = raw.trimEnd();

    // Remove trailing comma before attempting close
    attempt = attempt.replace(/,\s*$/, "");

    // Count open braces/brackets and close them
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escape = false;

    for (const ch of attempt) {
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") braces++;
      if (ch === "}") braces--;
      if (ch === "[") brackets++;
      if (ch === "]") brackets--;
    }

    while (brackets > 0) { attempt += "]"; brackets--; }
    while (braces > 0) { attempt += "}"; braces--; }

    return JSON.parse(attempt);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    chapter,
    slug,
    jsonContext,
    types,
    keyIndex = 0,
    useGithub = false,
    githubRepo,
    githubBranch = "main",
    githubDataDir = "data",
  } = body;

  if (!chapter?.trim()) {
    return NextResponse.json({ error: "Chapter text is required." }, { status: 400 });
  }

  const apiKey = resolveApiKey(keyIndex);
  if (!apiKey) {
    return NextResponse.json(
      { error: `API key ${keyIndex + 1} is not configured in .env.local.` },
      { status: 400 }
    );
  }

  const typeDesc: Record<string, string> = {
    characters: "Characters (new characters, status changes, trait updates, title changes, location updates — traits must stay short adjectives, not sentences)",
    houses: "Houses (new houses, motto/seat changes, allegiance shifts)",
    timeline: "Timeline events (chapter-level story beats, grouped under this chapter's date)",
    events: "Standalone named events (a specific feast, wedding, battle, coronation, etc. with its own day/moon/year)",
    map: "Map movements (character location changes, travel destinations)",
    dragons: "Dragons (new dragons, bond changes, death/hatching, new eggs — traits must stay short adjectives)",
    dates: "World dates (only an explicit, specific in-world day/moon/year mentioned in the text)",
    relationships: "Relationships (new bonds, marriage, betrayal, alliance changes between characters)",
    quotes: "Quotes (memorable spoken lines worth preserving, with speaker and optional context note)",
  };

  const typesToDetect = (types as string[])
    .map((t) => typeDesc[t] ?? t)
    .map((d) => `- ${d}`)
    .join("\n");

  // Trim chapter to avoid blowing the context window
  // Long chapters: trim to 10k chars, leave more room for output
  const chapterTrimmed = chapter.slice(0, 10000);

  // Pull the current data files straight from GitHub, one per selected type, so
  // "update" changes are based on what's actually in the repo right now rather
  // than a manually pasted (and possibly stale) snapshot.
  const githubResults: Array<{ path: string; content?: string; error?: string }> = [];
  let githubContextBlock = "";

  if (useGithub && githubRepo) {
    const filesToFetch = Array.from(
      new Set(
        (types as string[])
          .flatMap((t) => TYPE_FILE_MAP[t] ?? [])
          .filter(Boolean)
      )
    );

    const fetches = filesToFetch.map((file) =>
      fetchGithubFile(githubRepo, githubBranch, `${githubDataDir}/${file}`.replace(/\/+/g, "/"))
    );

    const settled = await Promise.all(fetches);
    for (const r of settled) {
      if ("content" in r) {
        githubResults.push({ path: r.path, content: r.content });
      } else {
        githubResults.push({ path: r.path, error: r.error });
      }
    }

    githubContextBlock = githubResults
      .filter((r) => r.content)
      .map((r) => `--- ${r.path} ---\n${(r.content as string).slice(0, 6000)}`)
      .join("\n\n");
  }

  const manualContext = jsonContext?.trim() ? jsonContext.trim().slice(0, 6000) : null;
  const combinedContext = [githubContextBlock, manualContext].filter(Boolean).join("\n\n");
  const contextTrimmed = combinedContext.trim() ? combinedContext.slice(0, 16000) : null;

  const userMsg = [
    `Chapter${slug ? ` "${slug}"` : ""}:`,
    "---",
    chapterTrimmed,
    chapter.length > 10000 ? `\n[Chapter trimmed — ${chapter.length} chars total, showing first 10000]` : "",
    "---",
    contextTrimmed ? `\nExisting JSON context (current contents of the data files — use this to build the complete "value" for "update" operations):\n---\n${contextTrimmed}\n---` : "",
    `\nDetect the following types of changes:\n${typesToDetect}`,
    "\nReturn only the JSON object. Every new/update change needs a complete \"value\" object in the target schema, not just the changed fields. Every change needs a confidence field. Output must be complete valid JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      const message = err?.error?.message ?? "Anthropic API error";
      const status = response.status;
      return NextResponse.json({ error: message, status }, { status });
    }

    const data = await response.json();
    const raw = (data.content as { type: string; text?: string }[])
      .map((b) => b.text ?? "")
      .join("");

    const stopReason = data.stop_reason;

    try {
      const extracted = extractJson(raw);
      const parsed = repairJson(extracted) as { summary?: string; changes?: Array<Record<string, unknown>> };

      // Backfill a default confidence for any change the model forgot to score
      if (Array.isArray(parsed.changes)) {
        parsed.changes = parsed.changes.map((c) => ({
          confidence: "medium",
          ...c,
        }));
      }

      // Warn the client if the response was truncated
      const wasRepaired = stopReason === "max_tokens";

      return NextResponse.json({
        ...parsed,
        _meta: {
          stop_reason: stopReason,
          repaired: wasRepaired,
          chapter_trimmed: chapter.length > 10000,
          github: useGithub
            ? {
                repo: githubRepo,
                branch: githubBranch,
                files: githubResults.map((r) => ({
                  path: r.path,
                  ok: !!r.content,
                  error: r.error ?? null,
                  content: r.content ?? null,
                })),
              }
            : null,
        },
      });
    } catch {
      // Return raw for debugging
      return NextResponse.json(
        {
          error: "Could not parse AI response as JSON.",
          raw: raw.slice(0, 500),
          stop_reason: stopReason,
          hint:
            stopReason === "max_tokens"
              ? "Response was cut off — try selecting fewer detection types or splitting the chapter."
              : "Try again — the model occasionally adds unexpected text.",
        },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}