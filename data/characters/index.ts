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
import { darrenDayne } from "./darren-dayne";
import { steffonBaratheon } from "./steffon-baratheon";
import { cordinPoole } from "./cordin-poole";
import { brannynVance } from "./brannyn-vance";
import { orwellMorrigen } from "./orwell-morrigen";
import { timosHightower } from "./timos-hightower";
import { alysanneHightower } from "./alysanne-hightower";
import { baelorTargaryen } from "./baelor-targaryen";
import { rickardStark } from "./rickard-stark";
import { brandonStark } from "./brandon-stark";
import { tionLannister } from "./tion-lannister";
import { malaenarTargaryen } from "./malaenar-targaryen";
import { vahaemonTargaryen } from "./vahaemon-targaryen";
import { curtassWhent } from "./curtass-whent";

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
  "darren-dayne": darrenDayne,
  "steffon-baratheon": steffonBaratheon,
  "cordin-poole": cordinPoole,
  "brannyn-vance": brannynVance,
  "orwell-morrigen": orwellMorrigen,
  "timos-hightower": timosHightower,
  "alysanne-hightower": alysanneHightower,
  "baelor-targaryen": baelorTargaryen,
  "rickard-stark": rickardStark,
  "brandon-stark": brandonStark,
  "tion-lannister": tionLannister,
  "malaenar-targaryen": malaenarTargaryen,
  "vahaemon-targaryen": vahaemonTargaryen,
  "curtass-whent": curtassWhent,
} as const;
