import type { Metadata } from "next";
import DragonComparison from "./DragonComparison";
export const metadata: Metadata = { title: "The Measure of Fire", description: "Compare dragon silhouettes on a shared scale, from Balerion to the last dragon." };
export default function DragonScalePage() { return <DragonComparison />; }
