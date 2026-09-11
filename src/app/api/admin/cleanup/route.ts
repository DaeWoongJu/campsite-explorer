import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function POST() {
  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ error: "no redis" }, { status: 503 });
  }
  const deleted = await redis.del("reviews:101058");
  return NextResponse.json({ deleted });
}
