import { NextRequest, NextResponse } from "next/server";
import { balancedSearchIndex } from "@/lib/search";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) return NextResponse.json({ results: [] });
  const results = balancedSearchIndex(query, 12).map(({ keywords: _keywords, ...result }) => result);
  return NextResponse.json({ results });
}
