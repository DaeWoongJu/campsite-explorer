import { NextRequest, NextResponse } from "next/server";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import { getRedis } from "@/lib/redis";

export async function POST(request: NextRequest) {
  const authed = isValidSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!authed) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "no redis" }, { status: 503 });
  }
  const deleted = await redis.del("reviews:101058");
  return NextResponse.json({ deleted });
}
