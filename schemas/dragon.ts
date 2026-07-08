import { z } from "zod";

export const DragonStatusSchema = z.enum(["Alive", "Dead"]);

export const DragonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  status: DragonStatusSchema,
  riderId: z.string().min(1).optional(),
  previousRiderId: z.string().min(1).optional(),
  image: z.string().min(1),
  traits: z.array(z.string().min(1)),
  description: z.string().min(1),
}).strict();

export const DragonListSchema = z.array(DragonSchema);

export type DragonFromSchema = z.infer<typeof DragonSchema>;
