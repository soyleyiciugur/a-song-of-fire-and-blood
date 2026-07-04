import type { Character } from "@/types/character";

import { baelenysTargaryen } from "./baelenys-targaryen";
import { jaeryTargaryen } from "./jaery-targaryen";
import { maelaTargaryen } from "./maela-targaryen";
import { jacaelonTargaryen } from "./jacaelon-targaryen";
import { saeraTargaryen } from "./saera-targaryen";
import { gaelorTargaryen } from "./gaelor-targaryen";
import { visenorTargaryen } from "./visenor-targaryen";
import { vhaemysTargaryen } from "./vhaemys-targaryen";
import { rhaellaTargaryen } from "./rhaella-targaryen";
import { naellaVelaryon } from "./naella-velaryon";
import { lorenahDayne } from "./lorenah-dayne";
import { serAlesterDayne } from "./ser-alester-dayne";
import { derrinHightower } from "./derrin-hightower";
import { serSaathosMaris } from "./ser-saathos-maris";

export const characters = {
  "baelenys-targaryen": baelenysTargaryen,
  "jaery-targaryen": jaeryTargaryen,
  "maela-targaryen": maelaTargaryen,
  "jacaelon-targaryen": jacaelonTargaryen,
  "saera-targaryen": saeraTargaryen,
  "gaelor-targaryen": gaelorTargaryen,
  "visenor-targaryen": visenorTargaryen,
  "vhaemys-targaryen": vhaemysTargaryen,
  "rhaella-targaryen": rhaellaTargaryen,
  "naella-velaryon": naellaVelaryon,
  "lorenah-dayne": lorenahDayne,
  "ser-alester-dayne": serAlesterDayne,
  "derrin-hightower": derrinHightower,
  "ser-saathos-maris": serSaathosMaris,
} as const;