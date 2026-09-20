import { z } from "zod";

export const HouseOfDragonPersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  epi: z.string().default(""),
  house: z.string().default("House Targaryen"),
  b: z.number().nullable().default(null),
  d: z.number().nullable().default(null),
  st: z.enum(["Alive", "Dead", "Missing", "Unknown"]).default("Unknown"),
  dr: z.string().default(""),
  sx: z.enum(["M", "F"]).default("M"),
  father: z.string().nullable().default(null),
  mother: z.string().nullable().default(null),
  attachTo: z.string().nullable().default(null),
  side: z.enum(["L", "R"]).default("R"),
  root: z.boolean().default(false),
  note: z.string().default(""),
  x: z.number().nullable().default(null),
  y: z.number().nullable().default(null),
});

export const HouseOfDragonUnionSchema = z.object({
  a: z.string(),
  b: z.string(),
  label: z.string().default(""),
});

export const HouseOfDragonTreeSchema = z.object({
  people: z.record(z.string(), HouseOfDragonPersonSchema),
  order: z.array(z.string()),
  unions: z.array(HouseOfDragonUnionSchema),
});

export type HouseOfDragonPerson = z.infer<typeof HouseOfDragonPersonSchema>;
export type HouseOfDragonUnion = z.infer<typeof HouseOfDragonUnionSchema>;
export type HouseOfDragonTree = z.infer<typeof HouseOfDragonTreeSchema>;
