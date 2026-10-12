// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\scripts\validate-data.mjs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import * as ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const nodeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function resolveCandidate(filePath) {
  const candidates = [
    filePath,
    `${filePath}.ts`,
    `${filePath}.tsx`,
    `${filePath}.js`,
    `${filePath}.jsx`,
    path.join(filePath, "index.ts"),
    path.join(filePath, "index.tsx"),
    path.join(filePath, "index.js"),
    path.join(filePath, "index.jsx"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function resolveRequest(request, parentDir) {
  if (request.startsWith("@/")) {
    const resolved = resolveCandidate(path.join(rootDir, request.slice(2)));
    if (!resolved) throw new Error(`Cannot resolve alias import: ${request}`);
    return resolved;
  }

  if (request.startsWith(".")) {
    const resolved = resolveCandidate(path.resolve(parentDir, request));
    if (!resolved) throw new Error(`Cannot resolve relative import: ${request}`);
    return resolved;
  }

  return request;
}

function loadModule(filePath) {
  const resolved = path.normalize(filePath);
  if (moduleCache.has(resolved)) {
    return moduleCache.get(resolved).exports;
  }

  const source = fs.readFileSync(resolved, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
    fileName: resolved,
  }).outputText;

  const mod = { exports: {} };
  moduleCache.set(resolved, mod);

  const localRequire = (request) => {
    const next = resolveRequest(request, path.dirname(resolved));
    if (next === request) return nodeRequire(request);
    return loadModule(next);
  };

  const wrapped = new vm.Script(transpiled, { filename: resolved });
  const context = vm.createContext({
    module: mod,
    exports: mod.exports,
    require: localRequire,
    __filename: resolved,
    __dirname: path.dirname(resolved),
    console,
    process,
    Buffer,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  });

  wrapped.runInContext(context);
  return mod.exports;
}

function slugifyHouse(house) {
  return house
    .replace(/^house\s+/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-+|-+$)/g, "");
}

const readData = (file) => JSON.parse(fs.readFileSync(path.join(rootDir, "data", file), "utf8").replace(/^\uFEFF/, ""));
const characters = readData("characters/characters.json");
const chapterList = readData("chapters.json");
const dragons = readData("dragons.json");
const houses = readData("houses.json");
const quotes = readData("quotes.json");
const MAP_LOCATIONS = readData("map/locations.json");
const MAP_EVENTS = readData("events.json").filter((event) => event.location && event.chapterSlug);
const timeline = readData("timeline.json");
const {
  CharacterListSchema,
  ChapterListSchema,
  DragonListSchema,
  HouseListSchema,
  MapEventListSchema,
  MapLocationListSchema,
  TimelineListSchema,
} = loadModule(path.join(rootDir, "schemas/index.ts"));

const errors = [];

function addSchemaErrors(label, schema, value) {
  const result = schema.safeParse(value);
  if (result.success) return;

  for (const issue of result.error.issues) {
    const issuePath = issue.path.length ? issue.path.join(".") : label;
    errors.push(`${label}.${issuePath}: ${issue.message}`);
  }
}

addSchemaErrors("characters", CharacterListSchema, characters);
addSchemaErrors("chapters", ChapterListSchema, chapterList);
addSchemaErrors("dragons", DragonListSchema, dragons);
addSchemaErrors("houses", HouseListSchema, houses);
addSchemaErrors("map.locations", MapLocationListSchema, MAP_LOCATIONS);
addSchemaErrors("map.events", MapEventListSchema, MAP_EVENTS);
addSchemaErrors("timeline", TimelineListSchema, timeline);

const characterList = Object.values(characters);
const characterIds = new Set(characterList.map((character) => character.id));
const dragonIds = new Set(dragons.map((dragon) => dragon.id));

if (characterIds.size !== characterList.length) {
  errors.push("Duplicate character IDs detected.");
}

for (const character of characterList) {
  const houseSlug = character.house && character.house !== "-" ? slugifyHouse(character.house) : null;
  if (houseSlug && !houses.some((house) => house.id === houseSlug)) {
    errors.push(`Character ${character.id} references unknown house: ${character.house}`);
  }

  for (const relatedId of Object.keys(character.relationships ?? {})) {
    if (!characterIds.has(relatedId) && !dragonIds.has(relatedId)) {
      errors.push(`Character ${character.id} has relationship to missing character: ${relatedId}`);
    }
  }
}

for (const quote of quotes) {
  if (quote.speakerId && !characterIds.has(quote.speakerId)) {
    errors.push(`Quote references missing speaker: ${quote.speakerId} (${quote.text})`);
  }
}

for (const dragon of dragons) {
  if (dragon.riderId && !characterIds.has(dragon.riderId)) {
    errors.push(`Dragon ${dragon.id} references missing rider: ${dragon.riderId}`);
  }
  if (dragon.previousRiderId && !characterIds.has(dragon.previousRiderId)) {
    errors.push(`Dragon ${dragon.id} references missing previous rider: ${dragon.previousRiderId}`);
  }
}

const chapterSlugs = new Set(chapterList.map((chapter) => chapter.slug));
if (chapterSlugs.size !== chapterList.length) {
  errors.push("Duplicate chapter slugs detected.");
}

for (const event of MAP_EVENTS) {
  const slugs = Array.isArray(event.chapterSlugs) ? event.chapterSlugs : [event.chapterSlug];
  for (const slug of slugs) {
    if (!chapterSlugs.has(slug)) {
      errors.push(`Map event ${event.id} references missing chapter: ${slug}`);
    }
  }
}

for (const location of MAP_LOCATIONS) {
  if (!location.name) {
    errors.push("Map location with empty name found.");
  }
}

if (errors.length > 0) {
  console.error("Data validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Data validation passed.");
