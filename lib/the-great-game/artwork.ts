import { z } from "zod";
import { findGameCard } from "./cards";

export const ArtworkSettingsSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  zoom: z.number().min(1).max(3),
}).strict();
export type ArtworkSettings = z.infer<typeof ArtworkSettingsSchema>;
export const DEFAULT_ARTWORK: ArtworkSettings = { x: 50, y: 0, zoom: 1 };
export const ArtworkMapSchema = z.record(z.string().refine(id => Boolean(findGameCard(id)), "Unknown card"), ArtworkSettingsSchema);
