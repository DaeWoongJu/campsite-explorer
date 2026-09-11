import { NextRequest, NextResponse } from "next/server";
import { recordVisit, recordCampsiteView } from "@/lib/stats";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const campsiteMatch = pathname.match(/^\/campsites\/([^/]+)$/);

  try {
    if (campsiteMatch) {
      await Promise.all([
        recordVisit(),
        recordCampsiteView(decodeURIComponent(campsiteMatch[1])),
      ]);
    } else if (pathname === "/") {
      await recordVisit();
    }
  } catch {
    // Stats are best-effort; never block a page load over tracking.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/campsites/:id"],
};
