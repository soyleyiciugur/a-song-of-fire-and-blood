import { NextResponse } from "next/server";
import { HouseListSchema } from "../../../../schemas/house";
import { updateJsonFileOnGithub } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = HouseListSchema.parse(body);

    await updateJsonFileOnGithub({
      path: "data/houses.json",
      content: validatedData,
      message: "Update houses via admin panel",
    });

    return NextResponse.json({ success: true, message: "Houses updated successfully!" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { success: false, message: "Error saving data. Please ensure all required fields are filled." },
      { status: 500 }
    );
  }
}