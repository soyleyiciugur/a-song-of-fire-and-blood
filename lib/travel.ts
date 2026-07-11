import { getMapLocation } from "@/data/map/locations";

// Scale calibrated against the wiki's "Basics": Westeros spans ~3000mi N-S
// and ~900mi E-W, which both work out to ~59 miles per map percentage point
// on known-world.webp — so we use that to compute straight-line distance
// between ANY two plotted locations instead of a fixed city-pair table.
const MILES_PER_PCT = 59;
const LAND_MULTIPLIER = 1.15; // roads/kingsroads rarely run perfectly straight
const SEA_MULTIPLIER = 1.05; // ships track coasts and currents a bit
const RAVEN_MULTIPLIER = 1.05; // ravens leapfrog keep to keep, not laser-straight

export interface TravelResult {
  straightMiles: number;
  landMiles: number;
  seaMiles: number;
  footDays: number;
  horseDays: [number, number];
  armyDays: [number, number];
  seaDays: number;
  dragonHours: [number, number];
  ravenHours: number;
}

export function calculateTravel(fromName: string, toName: string): TravelResult | null {
  const from = getMapLocation(fromName);
  const to = getMapLocation(toName);
  if (!from || !to || fromName === toName) return null;

  const dx = from.xPct - to.xPct;
  const dy = from.yPct - to.yPct;
  const straightMiles = Math.sqrt(dx * dx + dy * dy) * MILES_PER_PCT;
  const landMiles = straightMiles * LAND_MULTIPLIER;
  const seaMiles = straightMiles * SEA_MULTIPLIER;
  const ravenMiles = straightMiles * RAVEN_MULTIPLIER;

  return {
    straightMiles,
    landMiles,
    seaMiles,
    footDays: landMiles / 24, // on foot: 24mi/day
    horseDays: [landMiles / 40, landMiles / 30], // horseback: 30-40mi/day
    armyDays: [landMiles / 30, landMiles / 20], // with army/carriages: 20-30mi/day
    seaDays: seaMiles / 170, // by ship, sailing day & night: 170mi/day
    dragonHours: [straightMiles / 60, straightMiles / 35], // dragon: 35-60mph
    ravenHours: (ravenMiles / 500) * 24, // raven: 500mi/day at max speed
  };
}
