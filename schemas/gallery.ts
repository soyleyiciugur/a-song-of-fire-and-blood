import { z } from "zod";

export const WorldDateSchema = z.object({
  day: z.number().int().min(1).max(30),
  moon: z.number().int().min(1).max(12),
  year: z.number().int().min(1),
  era: z.enum(["BC", "AC"]),
});

export const GalleryEntrySchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  caption: z.string().default(""),
  characterIds: z.array(z.string()).default([]),
  houseIds: z.array(z.string()).default([]),
  dragonIds: z.array(z.string()).default([]),
  chapterId: z.string().nullable().default(null),
  worldDate: WorldDateSchema.nullable().default(null),
  uploadedAt: z.string().default(""),
});

export const GalleryListSchema = z.array(GalleryEntrySchema);

export type GalleryEntry = z.infer<typeof GalleryEntrySchema>;
