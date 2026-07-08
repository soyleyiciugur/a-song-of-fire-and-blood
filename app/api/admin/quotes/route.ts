import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const quotes = await request.json();
    
    // Artık sadece saf JSON kaydediyoruz
    const filePath = path.join(process.cwd(), "data", "quotes.json");
    fs.writeFileSync(filePath, JSON.stringify(quotes, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "Quotes updated successfully!" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ success: false, message: "Error saving quotes." }, { status: 500 });
  }
}