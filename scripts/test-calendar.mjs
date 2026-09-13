import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const cache = new Map();
function load(file) {
  if (!path.extname(file)) file += '.ts';
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const module = { exports: {} };
  cache.set(file, module.exports);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const localRequire = name => load(name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name));
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
}

const calendar = load(path.join(root, 'lib/calendar.ts'));
const { timelineDateOrder } = load(path.join(root, 'lib/timeline-date.ts'));
const { getCalendarEvents } = load(path.join(root, 'data/calendar.ts'));
const { getUpcomingEvents } = load(path.join(root, 'lib/events.ts'));
const timeline = load(path.join(root, 'data/timeline.json'));
const today = load(path.join(root, 'data/worldDate.json'));
const entries = getCalendarEvents();
assert.equal(new Set(entries.map(event => event.id)).size, entries.length);
assert.equal(calendar.calendarDateLabel({ day: 13, moon: 9, year: 99 }), '13th of the 9th Moon, 99 AC');
for (const order of [0, 29, 30, 359, 360, 35999, 36000]) assert.equal(timelineDateOrder(calendar.calendarDateFromOrder(order)), order);
assert.deepEqual(calendar.calendarDateFromOrder(359), { day: 30, moon: 12, year: 0 });
assert.deepEqual(calendar.calendarDateFromOrder(360), { day: 1, moon: 1, year: 1 });
assert.equal(calendar.eventsOnDay(calendar.eventsInMoon(entries, 0, 1), 1).filter(event => event.id === 'aegons-conquest').length, 1);
assert.equal(calendar.eventsInMoon(entries, 1, 1).some(event => event.id === 'aegons-conquest'), false);
for (const chapter of timeline) for (const event of chapter.events) {
  const parsed = calendar.calendarTimelineDate(event.date, chapter.date);
  assert.ok(parsed, `Unplaced timeline event: ${event.title}`);
  assert.ok(entries.some(entry => entry.title === event.title && entry.moon === parsed.moon && entry.year === parsed.year), `Missing timeline event: ${event.title}`);
}
const range = calendar.calendarTimelineDate('18th–19th of the 2nd Moon', 'Mid 2nd Moon, 99 AC');
assert.equal(range.day, 18); assert.equal(range.endDay, 19);
assert.equal(calendar.eventsOnDay([{ ...range, id: 'range' }], 19).length, 1);
assert.equal(calendar.eventsOnDay([{ ...range, id: 'range' }], 20).length, 0);
const approximate = calendar.calendarTimelineDate('Early 1st Moon, 95 AC (approximate placement)');
assert.equal(approximate.day, undefined);
assert.equal(approximate.year, 95);
assert.equal(calendar.calendarTimelineDate('12th of the 2nd Moon, 56 AC', '14th of the 8th Moon, 99 AC').year, 56);
assert.ok(!JSON.stringify(entries).includes('hrrm'));
assert.ok(entries.every(event => !('secret' in event)));
assert.ok(entries.some(event => event.id === 'nameday-rhaella-targaryen' && !event.until), 'Private status must not remove a public nameday');
const upcoming = getUpcomingEvents(today, 1000);
assert.ok(upcoming.every(event => calendar.CALENDAR_TYPES.includes(event.type)));
assert.ok(!upcoming.some(event => /Saera Returns/.test(event.title)));
assert.ok(upcoming.every(event => event.daysUntil >= 0));
const historicUpcoming = getUpcomingEvents({ day: 30, moon: 12, year: 0, era: 'AC' }, 1000);
const feast = historicUpcoming.find(event => event.title === 'The Dragon-Hatching Feast');
assert.equal(feast.daysUntil, timelineDateOrder({ day: 16, moon: 2, year: 99 }) - 359, 'Fixed future events must include all intervening years');
console.log(`Calendar data passed: ${entries.length} entries; all ${timeline.reduce((total, chapter) => total + chapter.events.length, 0)} timeline events represented, ranges, approximate dates, flashbacks, year zero, public namedays and upcoming filters.`);
