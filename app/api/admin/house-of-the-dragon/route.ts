import { NextResponse } from "next/server";

import { isLuckAdmin } from "@/lib/adminAccess";
import { createAdminClient } from "@/lib/supabase/admin";
import { HouseOfDragonTreeSchema } from "@/schemas/houseOfDragonTree";

const TREE_ID = "main";

export async function POST(request: Request) {
  if (!(await isLuckAdmin())) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase service credentials are not configured." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const tree = HouseOfDragonTreeSchema.parse(body?.tree);

    const { data: current, error: readError } = await supabase
      .from("house_of_the_dragon_tree")
      .select("data, version")
      .eq("id", TREE_ID)
      .maybeSingle();

    if (readError) throw readError;

    const nextVersion = Number(current?.version ?? 0) + 1;

    if (current?.data) {
      const { error: revisionError } = await supabase
        .from("house_of_the_dragon_tree_revisions")
        .insert({ tree_id: TREE_ID, data: current.data, version: current.version ?? 0 });
      if (revisionError) throw revisionError;
    }

    const { error: writeError } = await supabase
      .from("house_of_the_dragon_tree")
      .upsert(
        {
          id: TREE_ID,
          data: tree,
          version: nextVersion,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (writeError) throw writeError;

    return NextResponse.json({
      success: true,
      version: nextVersion,
      message: "Lineage published to Supabase.",
    });
  } catch (error) {
    console.error("House of the Dragon publish error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Publish failed." },
      { status: 500 },
    );
  }
}
