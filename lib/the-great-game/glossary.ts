import type { Trait } from "./types";
export const KEYWORD_RULES: Record<Trait, string> = {
  unique: "Your deck may contain only one copy of this card.",
  dragon: "A Dragon Unit. Up to two Dragons may be on your board at once.",
    summon: "Created by an ability. Summons cannot be included in a deck.",
    dragonrider:
      "This Character is bonded to a specific Dragon. That Dragon's Bond discount applies while its rider is ruled by the same Ruler.",
    guard:
      "Enemy Units must face Guard Units before attacking other legal Military targets or Standing.",
    intrigue:
      "While this Character is Ready, normal Political attackers must choose a Ready Intrigue Character as the defender.",
    swift:
      "This Unit may initiate a Military Conflict on the turn it is deployed.",
    schemer:
      "This Character may initiate a Political Conflict on the turn it is deployed.",
    challenge:
      "This Unit ignores Guard restrictions and may choose any Military target or attack enemy Standing directly.",
    confront:
      "This Character ignores Political defender restrictions and may choose any Ready enemy Character or attack enemy Standing directly.",
  };

export const STATUS_RULES: Record<"Deployed" | "Exhausted" | "Grounded", [string, string]> = {
  Deployed: [
    "Just arrived this turn. No Military Conflict without Swift; no Political Conflict without Schemer. Give them a moment.",
    "Newly arrived, my liege. This turn, initiating a Military Conflict requires Swift, and a Political Conflict requires Schemer.",
  ],
  Exhausted: [
    "Spent for now. Cannot initiate another Conflict until readied. All Units ready when the turn ends.",
    "Their efforts are spent, Your Grace. They cannot initiate a Conflict until readied. All Units ready when the turn ends.",
  ],
  Grounded: [
    "The Dragon is down. Cannot initiate a Conflict. Recovers one Health at the start of its controller's turn; Grounded clears at half maximum Health, rounded up.",
    "Your Dragon must recover, my liege. It cannot initiate a Conflict while Grounded. It regains one Health at the start of its controller's turn, recovering at half maximum Health, rounded up.",
  ],
};

