import { HouseListSchema, type HouseFromSchema } from "../schemas/house";
import housesData from "./houses.json";

// JSON'daki veriyi Zod şemanla doğrulayıp içeri alıyoruz
export const houses: HouseFromSchema[] = HouseListSchema.parse(housesData);

// Sitenin hane bulmak için eskiden beri kullandığı fonksiyon (bunu koruduk ki site bozulmasın)
export function getHouse(id: string): HouseFromSchema | undefined {
  return houses.find((house) => house.id === id);
}