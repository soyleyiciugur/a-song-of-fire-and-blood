import fallbackTree from "@/data/house-of-the-dragon.json";
import { createAdminClient } from "@/lib/supabase/admin";
import { HouseOfDragonTreeSchema, type HouseOfDragonTree } from "@/schemas/houseOfDragonTree";

const TREE_ID = "main";

export async function getHouseOfDragonTree(): Promise<HouseOfDragonTree> {
  const fallback = HouseOfDragonTreeSchema.parse(fallbackTree);
  const supabase = createAdminClient();
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("house_of_the_dragon_tree")
    .select("data")
    .eq("id", TREE_ID)
    .maybeSingle();

  if (error) {
    console.error("House of the Dragon tree read failed; using bundled fallback:", error);
    return fallback;
  }

  const parsed = HouseOfDragonTreeSchema.safeParse(data?.data);
  if (!parsed.success) {
    if (data?.data) console.error("Invalid House of the Dragon tree in Supabase; using bundled fallback:", parsed.error);
    return fallback;
  }

  return parsed.data;
}
