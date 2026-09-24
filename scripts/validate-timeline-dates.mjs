import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const timeline = JSON.parse(fs.readFileSync(path.join(root, "data", "timeline.json"), "utf8"));

const spelledOrdinals = /\b(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth|Thirteenth|Fourteenth|Fifteenth|Sixteenth|Seventeenth|Eighteenth|Nineteenth|Twentieth|Twenty-First|Twenty-Second|Twenty-Third|Twenty-Fourth|Twenty-Fifth|Twenty-Sixth|Twenty-Seventh|Twenty-Eighth|Twenty-Ninth|Thirtieth)\b/i;
const spelledYears = /\b(?:Ninety-Nine|Fifty-Six)\s+AC\b/i;
const exactNumericDate = /^\d{1,2}(?:st|nd|rd|th)(?:[–-]\d{1,2}(?:st|nd|rd|th))?\s+of\s+the\s+\d{1,2}(?:st|nd|rd|th)\s+Moon\b/i;

function validateDate(value, label) {
  if (!value) return;
  assert.equal(spelledOrdinals.test(value), false, `${label}: spell timeline dates with numeric ordinals (${value})`);
  assert.equal(spelledYears.test(value), false, `${label}: use a numeric timeline year (${value})`);

  if (/\bof the\b/i.test(value) && /^\d/.test(value)) {
    assert.match(value, exactNumericDate, `${label}: expected a date such as 20th of the 8th Moon (${value})`);
  }
}

for (const chapter of timeline) {
  validateDate(chapter.date, `${chapter.chapterSlug}.date`);
  for (const event of chapter.events ?? []) {
    validateDate(event.date, `${chapter.chapterSlug}.${event.title}`);
  }
}

console.log(`Timeline date format valid: ${timeline.length} chapters.`);
