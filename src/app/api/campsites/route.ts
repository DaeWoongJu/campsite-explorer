import { NextRequest, NextResponse } from "next/server";
import { getCampsites, hasLiveApi } from "@/lib/campsites";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") || undefined;
  const campsites = await getCampsites(query);
  return NextResponse.json({ campsites, live: hasLiveApi() });
}
