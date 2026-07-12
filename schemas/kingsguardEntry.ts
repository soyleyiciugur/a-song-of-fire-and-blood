// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\schemas\kingsguardEntry.ts
import { z } from "zod";

export const KingsguardDeedSchema = z.object({
  date: z.string().optional(),
  description: z.string(),
}).strict();

export const KingsguardEntrySchema = z.object({
  id: z.string(),
  characterId: z.string().optional(),
  manualName: z.string().optional(),
  manualTitle: z.string().optional(),
  appointedDate: z.string().optional(),
  endDate: z.string().optional(),
  precedingCharacterId: z.string().optional(),
  oath: z.string().optional(),
  deeds: z.array(KingsguardDeedSchema).default([]),
  notes: z.string().optional(),
  published: z.boolean().default(false),
}).strict();

export const KingsguardListSchema = z.array(KingsguardEntrySchema);

export type KingsguardEntryFromSchema = z.infer<typeof KingsguardEntrySchema>;
