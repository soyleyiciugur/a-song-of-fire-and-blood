import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const key = process.env.GIPHY_API_KEY;
  if (!key) return NextResponse.json({ error: "giphy_not_configured" }, { status: 503 });
  const q = request.nextUrl.searchParams.get("q")?.trim().slice(0, 50) ?? "";
  if (!q) return NextResponse.json({ data: [] });
  const params = new URLSearchParams({ api_key: key, q, limit: "24", rating: "pg-13" });
  const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params}`, { next: { revalidate: 0 } });
  if (!response.ok) return NextResponse.json({ error: "giphy_unavailable" }, { status: 502 });
  const payload = await response.json() as { data?: Array<{id:string;title:string;images?:{fixed_height?:{url?:string}}}> };
  const data=(payload.data??[]).flatMap(g=>{
    const url=g.images?.fixed_height?.url;
    return url?[{id:g.id,title:g.title,url}]:[];
  });
  return NextResponse.json({ data });
}
