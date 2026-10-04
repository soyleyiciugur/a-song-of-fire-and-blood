import type { TableSpeakerId } from "./table-speaker";

// Keep targeting restrictions, effect names and controls explicit in both voices.
const prompts: Record<string, [string, string]> = {
  "ARRIVAL — The Mander's Pact: choose another Character.": [
    "The Mander's Pact — choose another Character. A pact needs two.",
    "The Mander's Pact — choose another Character, my liege."
  ],
  "ARRIVAL — Veiled Sight: choose a card from the revealed enemy hand.": [
    "Veiled Sight — choose a card from the revealed enemy hand. Look closely.",
    "Veiled Sight — kindly choose a card from the revealed enemy hand, Your Grace."
  ],
  "ARRIVAL — Iron Wrath: choose another Unit.": [
    "Iron Wrath — choose another Unit. Someone must bear it.",
    "Iron Wrath — name another Unit to receive your wrath, my liege."
  ],
  "Tyroshi Trade — discard one card to trade it, or Keep All.": [
    "Tyroshi Trade — discard one card to trade, or Keep All. Your bargain.",
    "Tyroshi Trade — discard one card to trade, my liege, or choose Keep All."
  ],
  "Card selected — click your board to deploy it.": [
    "Click your board to deploy the card. It needs a place.",
    "Your forces await, my liege. Click your board to deploy the card."
  ],
  "Card selected — click your board or Play Card to confirm.": [
    "Click your board or Play Card. Best make it official.",
    "At your pleasure, Your Grace: click your board or Play Card to confirm."
  ],
  "Choose any Character to equip.": [
    "Choose any Character to equip. It does little on the shelf.",
    "Which Character shall bear this, my liege? Choose any Character to equip."
  ],
  "Choose any Character to gain +1 Influence this turn.": [
    "Choose any Character for +1 Influence this turn. A word can help.",
    "Choose any Character for +1 Influence this turn, Your Grace. A most useful word."
  ],
  "Choose a Character you control for The Brothers' Tilt.": [
    "The Brothers' Tilt — choose a Character you control. One of yours.",
    "The Brothers' Tilt awaits your champion, my liege. Choose a Character you control."
  ],
  "Trial by Combat — choose either duelist first.": [
    "Trial by Combat — choose either duelist first. Someone must step forward.",
    "Trial by Combat — kindly name either duelist first, Your Grace."
  ],
  "Trial by Combat — choose an enemy Character.": [
    "Trial by Combat — choose an enemy Character. There is your opponent.",
    "Trial by Combat — choose an enemy Character, my liege. Your champion awaits."
  ],
  "Trial by Combat — choose one of your Characters.": [
    "Trial by Combat — choose one of your Characters. Your side needs a champion.",
    "Trial by Combat — choose one of your Characters to uphold your cause, Your Grace."
  ],
  "Military Conflict — choose an enemy unit or enemy Standing.": [
    "Military Conflict — choose an enemy unit or enemy Standing. Give them a target.",
    "Military Conflict — name an enemy unit or enemy Standing as your target, my liege."
  ],
  "Political Conflict — enemy Standing is unopposed. Click Standing to confirm.": [
    "Political Conflict — enemy Standing is unopposed. Click Standing. No one objects. Or don't.",
    "Political Conflict — enemy Standing is unopposed, Your Grace. Click Standing to confirm."
  ],
  "CONFRONT — choose a Political defender or attack enemy Standing directly.": [
    "CONFRONT — choose a Political defender or attack enemy Standing directly. Your quarrel.",
    "CONFRONT — choose a Political defender, my liege, or attack enemy Standing directly."
  ],
  "Choose the Political defender.": [
    "Choose the Political defender. Someone has to answer.",
    "Whom shall we challenge, my liege? Choose the Political defender."
  ],
};

export function tablePromptCopy(prompt: string | null, speaker: TableSpeakerId) {
  return prompt ? prompts[prompt]?.[speaker === "mara" ? 0 : 1] ?? prompt : "";
}

export function tableTurnCopy(title: string, speaker: TableSpeakerId) {
  if (title === "Opponent used Royal Favor") {
    return speaker === "mara" ? "They have one more Command this turn." : "One more Command is theirs this turn, my liege.";
  }
  if (title === "Royal Favor used") {
    return speaker === "mara" ? "Make that extra Command count." : "One more Command at your service, my liege.";
  }
  if (title === "Your Turn") {
    return speaker === "mara" ? "Your turn. Make it count." : "The table is yours, my liege.";
  }
  const name = title.endsWith("'s Turn") ? title.slice(0, -7) : null;
  const subject = name && name !== "Opponent" ? name : "Your opponent";
  return speaker === "mara"
    ? `${subject}'s turn. We wait.`
    : `${subject} has the floor, Your Grace.`;
}

export function tableWarningCopy(message: string, speaker: TableSpeakerId) {
  if (/You may replace (?:up to|at most) (\d+) cards\./.test(message)) {
    const limit = message.match(/\d+/)?.[0] ?? "3";
    return speaker === "mara" ? `No more than ${limit} replacements. Choose carefully.` : `Only ${limit} replacements, my liege. Which shall we set aside?`;
  }
  const warnings: Record<string, [string, string]> = {
    "Wait for your turn.": ["Their turn. Yours will come.", "A moment, Your Grace. The other Ruler has the floor."],
    "Wait for your opening hand.": ["Wait for your hand. No choosing yet.", "Your opening hand will be ready shortly, my liege."],
    "Resolve the pending Arrival ability first.": ["Settle the Arrival first. Then we move on.", "The Arrival awaits your decision first, my liege."],
    "Let the drawn card settle first.": ["Let the card land first.", "A moment for your new card to arrive, Your Grace."],
  };
  return warnings[message]?.[speaker === "mara" ? 0 : 1] ?? (speaker === "mara" ? message : `Your Grace — ${message}`);
}
