// This file is C:\Users\Locpick-13\a-song-of-fire-and-blood\data\dragons.ts
import dragonsData from "./dragons.json";

export type DragonStatus = "Alive" | "Dead";

export type Dragon = {
  id: string;
  name: string;
  status: DragonStatus;
  riderId?: string;
  previousRiderId?: string;
  image: string;
  traits: string[];
  description: string;
};

export const dragons: Dragon[] = dragonsData as Dragon[];

export function getDragon(id: string): Dragon | undefined {
  return dragons.find((dragon) => dragon.id === id);
}