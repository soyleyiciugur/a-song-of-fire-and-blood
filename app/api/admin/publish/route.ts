import { NextResponse } from "next/server";
import { z } from "zod";
import { CharacterSchema } from "../../../../schemas/character";
import { HouseListSchema } from "../../../../schemas/house";
import { updateMultipleFilesOnGithub } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { characters, quotes, houses } = body;

    const files: { path: string; content: unknown }[] = [];

    if (characters) {
      const validatedChars = z.array(CharacterSchema).parse(characters);
      files.push({ path: "data/characters/characters.json", content: validatedChars });
    }

    if (quotes) {
      files.push({ path: "data/quotes.json", content: quotes });
    }

    if (houses) {
      const validatedHouses = HouseListSchema.parse(houses);
      files.push({ path: "data/houses.json", content: validatedHouses });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: "No changes to publish." },
        { status: 400 }
      );
    }

    await updateMultipleFilesOnGithub(files, "Publish changes via admin panel");

    return NextResponse.json({ success: true, message: "Published successfully!" });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, message: "Error publishing changes." },
      { status: 500 }
    );
  }
}