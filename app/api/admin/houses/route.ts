import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { HouseListSchema } from "../../../../schemas/house";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = HouseListSchema.parse(body);

    const filePath = path.join(process.cwd(), "data", "houses.json");
    fs.writeFileSync(filePath, JSON.stringify(validatedData, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "Houses updated successfully!" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json(
      { success: false, message: "Error saving data. Please ensure all required fields are filled." },
      { status: 500 }
    );
  }
}