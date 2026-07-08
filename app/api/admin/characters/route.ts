import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { CharacterSchema } from "../../../../schemas/character";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Gelen karakter listesini doğrula
    const validatedData = z.array(CharacterSchema).parse(body);

    const filePath = path.join(process.cwd(), "data", "characters", "characters.json");
    fs.writeFileSync(filePath, JSON.stringify(validatedData, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "Characters updated successfully!" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { success: false, message: "Error saving. Check if all required fields are filled." },
      { status: 500 }
    );
  }
}