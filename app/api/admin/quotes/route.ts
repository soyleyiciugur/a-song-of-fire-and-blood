import { NextResponse } from "next/server";
import { updateJsonFileOnGithub } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const quotes = await request.json();

    await updateJsonFileOnGithub({
      path: "data/quotes.json",
      content: quotes,
      message: "Update quotes via admin panel",
    });

    return NextResponse.json({ success: true, message: "Quotes updated successfully!" });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ success: false, message: "Error saving quotes." }, { status: 500 });
  }
}