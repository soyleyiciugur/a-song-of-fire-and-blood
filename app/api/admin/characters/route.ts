import { NextResponse } from "next/server";
import { z } from "zod";
import { CharacterSchema } from "../../../../schemas/character";
import { updateJsonFileOnGithub } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = z.array(CharacterSchema).parse(body);

    await updateJsonFileOnGithub({
      path: "data/characters/characters.json",
      content: validatedData,
      message: "Update characters via admin panel",
    });

    return NextResponse.json({ success: true, message: "Characters updated successfully!" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { success: false, message: "Error saving. Check if all required fields are filled." },
      { status: 500 }
    );
  }
}