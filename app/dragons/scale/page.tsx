import type { Metadata } from "next";
import DragonComparison from "./DragonComparison";
import { dragonSizeIds } from "@/data/dragon-size-comparison";

export const metadata: Metadata = {
  title: "The Measure of Fire",
  description: "Compare dragon silhouettes on a shared scale, from Balerion to the last dragon.",
};

type DragonScalePageProps = {
  searchParams: Promise<{ dragon?: string | string[] }>;
};

export default async function DragonScalePage({ searchParams }: DragonScalePageProps) {
  const requestedDragon = (await searchParams).dragon;
  const dragonId = Array.isArray(requestedDragon) ? requestedDragon[0] : requestedDragon;
  const initialSelected = dragonId && dragonSizeIds.has(dragonId) ? [dragonId] : undefined;

  return <DragonComparison initialSelected={initialSelected} />;
}
