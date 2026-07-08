import { z } from "zod";

export const CharacterStatusSchema = z.enum(["Alive", "Dead", "Unknown", "Missing"]);

export const CharacterQuoteSchema = z.object({
  text: z.string().min(1),
  speakerId: z.string().min(1).optional(),
  speakerName: z.string().min(1),
  chapterSlug: z.string().min(1).optional(),
  chapterTitle: z.string().min(1).optional(),
}).strict();

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  nickname: z.string().min(1).optional(),
  aliases: z.array(z.string()),
  house: z.string().min(1),
  title: z.string().min(1),
  status: CharacterStatusSchema,
  secret: z.object({
    status: CharacterStatusSchema,
    note: z.string().min(1),
  }).strict().optional(),
  age: z.number().int().nonnegative(),
  height: z.string().min(1).optional(),
  father: z.string().min(1),
  mother: z.string().min(1),
  spouse: z.string().min(1).optional(),
  siblings: z.array(z.string()),
  children: z.array(z.string()).optional(),
  mentor: z.string().min(1).optional(),
  dragon: z.string().min(1).optional(),
  traits: z.array(z.string().min(1)),
  goals: z.array(z.string().min(1)),
  relationships: z.record(z.string(), z.string().min(1)),
  summary: z.string().min(1),
  quote: CharacterQuoteSchema.optional(),
  quotes: z.array(CharacterQuoteSchema).optional(),
  portrait: z.string().min(1).optional(),
  miniPortrait: z.string().min(1).optional(),
}).strict();

export const CharacterRecordSchema = z.record(z.string(), CharacterSchema);

export type CharacterFromSchema = z.infer<typeof CharacterSchema>;
