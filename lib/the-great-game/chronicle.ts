import { findGameCard, getAllGameCards } from "./cards";
import type { GameLogEntry, PlayerId } from "./types";

export type ChronicleIconKind = "played" | "artifact" | "military" | "political" | "buff" | "debuff" | "command" | "location" | "death" | "grounded" | "heal" | "draw" | "burned" | "system";

export type ChronicleEvent = {
  id: number; turn: number; playerId?: PlayerId; turnOwnerId?: PlayerId;
  icon: ChronicleIconKind; level: "major" | "normal" | "system";
  title: string; detail: string; source?: string;
  commandRefill?: boolean;
  entries: GameLogEntry[];
  changes: NonNullable<NonNullable<GameLogEntry["chronicle"]>["changes"]>;
};

const cardsByName = new Map(getAllGameCards().map(card => [card.name, card]));
export function formatChronicleEntry(entry: GameLogEntry): ChronicleEvent | null {
  const message = entry.message;
  if (/ begins Turn \d+\.$| ends Turn \d+\.$| enters play\.$/.test(message)) return null;
  const result: ChronicleEvent = { id: entry.id, turn: entry.turn, playerId: entry.playerId,
    turnOwnerId: entry.turnOwnerId, icon: "system", level: "normal", title: message.replace(/\.$/, ""), detail: "",
    entries: [entry], changes: entry.chronicle?.changes ?? [] };
  let match: RegExpMatchArray | null;
  if ((match = message.match(/^Played (.+) for (\d+) Command\.$/))) {
    result.title = match[1]; result.detail = `Played · ${match[2]} Command`; result.icon = "played"; result.level = "major";
    if (cardsByName.get(match[1])?.cardType === "artifact") result.icon = "artifact";
    if (cardsByName.get(match[1])?.cardType === "location") result.icon = "location";
    if (cardsByName.get(match[1])?.special === "royal-favor") { result.icon = "command"; result.level = "normal"; }
  } else if ((match = message.match(/^Drew (.+)\. \((\d+) cards remain in deck\)$/))) {
    result.title = match[1]; result.detail = `Drawn · ${match[2]} remaining`; result.icon = "draw";
  } else if ((match = message.match(/^(.+) is burned\. \((\d+) cards remain in deck\)$/))) {
    result.title = match[1]; result.detail = `Burned · ${match[2]} remaining`; result.icon = "burned";
  } else if ((match = message.match(/^Command refills to (\d+)\.(?: \((.*)\))?$/))) {
    result.commandRefill = true;
    const refillDelta = match[2]?.match(/^(\d+) → (\d+) Command/);
    result.title = "Command"; result.detail = refillDelta ? `${refillDelta[1]} → ${refillDelta[2]}` : `Refilled · ${match[1]}`;
    result.icon = "command"; result.level = "system";
  } else if ((match = message.match(/^(.+) is equipped to (.+)\.$/))) {
    result.title = match[1]; result.detail = `Equipped → ${match[2]}`; result.icon = "artifact"; result.level = "major";
  } else if ((match = message.match(/^(.+) becomes the active Location\.$/))) {
    result.title = match[1]; result.detail = "Became the active Location"; result.icon = "location"; result.level = "major";
  } else if ((match = message.match(/^(.+) is destroyed\.$/))) {
    result.title = match[1]; result.detail = "Destroyed"; result.icon = "death"; result.level = "major";
  } else if ((match = message.match(/^([A-Z][A-Z -]+) — ([^:]+): (.+)$/))) {
    result.title = match[2]; result.source = match[2];
    result.detail = `${match[1].toLowerCase().replace(/^./, c => c.toUpperCase())} → ${match[3].replace(/ activates\.\s*/, " · ").replace(/[ .·]+$/, "")}`;
    const type = cardsByName.get(match[2])?.cardType;
    result.icon = type === "artifact" ? "artifact" : type === "location" ? "location" : /reduces|loses|damage/.test(match[3]) ? "debuff" : "buff";
    result.level = type === "artifact" ? "major" : "normal";
  } else if ((match = message.match(/^(.*?): (.+)$/))) {
    result.title = match[1]; result.detail = match[2].replace(/\.$/, ""); result.source = match[1];
    result.icon = /damage|loses/.test(message) ? "debuff" : "buff";
  }
  if (/Royal Favor/.test(message)) result.icon = "command";
  if (result.icon === "system" && /gains|recovers|heals|increases/.test(message)) result.icon = "buff";
  if (result.icon === "system" && /loses|reduces|takes .*damage|burned/.test(message)) result.icon = "debuff";
  if (/opening |The Great Game begins/.test(message)) result.level = "system";
  if (/Military Conflict|Military Attack|challenges .+ politically/.test(message)) { result.icon = "military"; result.level = "major"; }
  if (/Political Conflict|Political Victory|challenges .+ politically/.test(message)) { result.icon = "political"; result.level = "major"; }
  if (/\b(?:heals?|recovers?|restores?)\b.*Health/i.test(message)) result.icon = "heal";
  if (/\bgains \d+ Standing\b/.test(message)) result.icon = "heal";
  if (/ becomes Grounded\.| is no longer Grounded\./.test(message)) result.icon = "grounded";
  if (/ is burned\./.test(message)) result.icon = "burned";
  const metadata = entry.chronicle;
  if (metadata?.kind === "conflict") {
    const source = metadata.sourceCardId && findGameCard(metadata.sourceCardId);
    const target = metadata.targetCardId && findGameCard(metadata.targetCardId);
    result.title = `${source ? source.name : "Conflict"} → ${target ? target.name : "Opposing Standing"}`;
    result.detail = `${metadata.conflict} · ${metadata.result}`;
    result.icon = metadata.conflict === "Political" ? "political" : "military"; result.level = "major";
  }
  return result;
}

export function buildChronicle(log: GameLogEntry[], viewerId: PlayerId): ChronicleEvent[] {
  // Apply the privacy guard here too, including old saved games without visibility metadata.
  const visible = log.filter(entry => !(entry.playerId !== viewerId &&
    (entry.visibility === "owner" || /^Drew .+\. \(\d+ cards remain in deck\)$|^As I Was Saying reduces /.test(entry.message))));
  const owners = new Map<number, PlayerId>();
  for (const entry of visible) {
    if (entry.turnOwnerId) owners.set(entry.turn, entry.turnOwnerId);
    else if (/ begins Turn /.test(entry.message) && entry.playerId) owners.set(entry.turn, entry.playerId);
  }
  const events: ChronicleEvent[] = [];
  const actions = new Map<number, ChronicleEvent>();
  // Find the primary first; a trait can log before its action's play/conflict line.
  for (const entry of visible) {
    if (entry.chronicle?.kind) {
      const event = formatChronicleEntry(entry);
      if (event) actions.set(entry.chronicle.actionId, event);
    }
  }
  const emitted = new Set<number>();
  for (const entry of visible) {
    const event = formatChronicleEntry(entry);
    if (!event) continue;
    event.turnOwnerId ??= owners.get(entry.turn);
    const parent = entry.chronicle && actions.get(entry.chronicle.actionId);
    if (parent) {
      if (!emitted.has(parent.id)) {
        parent.turnOwnerId ??= owners.get(parent.turn);
        events.push(parent); emitted.add(parent.id);
      }
      if (entry.id !== parent.id) parent.entries.push(entry);
    } else {
      const previous = events.at(-1);
      // Collapse only consecutive activations from the same source in one resolution.
      if (event.source && previous?.source === event.source && previous.turn === event.turn &&
          previous.playerId === event.playerId && entry.chronicle?.actionId !== undefined &&
          previous.entries[0].chronicle?.actionId === entry.chronicle.actionId) previous.entries.push(entry);
      else events.push(event);
    }
  }
  return events;
}
