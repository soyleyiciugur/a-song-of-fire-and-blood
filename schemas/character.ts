// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\character.ts
import { z } from "zod";

export const CharacterStatusSchema = z.enum(["Alive", "Dead", "Unknown", "Missing"]);

export const CharacterQuoteSchema = z.object({
  text: z.string(),
  speakerId: z.string().optional(),
  speakerName: z.string(),
  chapterSlug: z.string().optional(),
  chapterTitle: z.string().optional(),
}).strict();

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  nickname: z.string().optional().default("-"),
  aliases: z.array(z.string()).default([]),
  house: z.string().default("-"),
  title: z.string().default("-"),
  status: CharacterStatusSchema.default("Unknown"),
  secret: z.object({
    status: CharacterStatusSchema,
    note: z.string().optional(),
  }).strict().optional(),
  age: z.number().int().nonnegative().default(0),
  height: z.string().optional().default("-"),
  father: z.string().default("-"),
  mother: z.string().default("-"),
  spouse: z.string().optional().default("-"),
  siblings: z.array(z.string()).default([]),
  children: z.array(z.string()).optional().default([]),
  mentor: z.string().optional().default("-"),
  dragon: z.string().optional().default("-"),
  traits: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  relationships: z.record(z.string(), z.string()).default({}),
  summary: z.string().default("No summary."),
  quote: CharacterQuoteSchema.optional(),
  quotes: z.array(CharacterQuoteSchema).optional().default([]),
  portrait: z.string().optional(),
  miniPortrait: z.string().optional(),
}).strict();

export const CharacterRecordSchema = z.record(z.string(), CharacterSchema);
export type CharacterFromSchema = z.infer<typeof CharacterSchema>;