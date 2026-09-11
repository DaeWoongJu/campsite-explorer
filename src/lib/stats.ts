import { getRedis } from "./redis";

const TOTAL_KEY = "stats:visits:total";
const CLICKS_KEY = "stats:campsite:clicks";

function todayKey(): string {
  return `stats:visits:day:${new Date().toISOString().slice(0, 10)}`;
}

export async function recordVisit(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await Promise.all([
    redis.incr(TOTAL_KEY),
    redis.incr(todayKey()).then((n) => {
      if (n === 1) redis.expire(todayKey(), 60 * 60 * 24 * 90);
    }),
  ]);
}

export async function recordCampsiteView(campsiteId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.zincrby(CLICKS_KEY, 1, campsiteId);
}

export interface Stats {
  connected: boolean;
  totalVisits: number;
  todayVisits: number;
  topCampsites: { id: string; count: number }[];
}

export async function getStats(): Promise<Stats> {
  const redis = getRedis();
  if (!redis) {
    return { connected: false, totalVisits: 0, todayVisits: 0, topCampsites: [] };
  }

  const [total, today, top] = await Promise.all([
    redis.get<number>(TOTAL_KEY),
    redis.get<number>(todayKey()),
    redis.zrange<string[]>(CLICKS_KEY, 0, 19, {
      rev: true,
      withScores: true,
    }),
  ]);

  // Upstash's REST gateway returns numeric-looking sorted-set members
  // (e.g. GoCamping content IDs) as JSON numbers, not strings, even
  // though Redis members are always strings — coerce them back.
  const topCampsites: { id: string; count: number }[] = [];
  for (let i = 0; i < top.length; i += 2) {
    topCampsites.push({ id: String(top[i]), count: Number(top[i + 1]) });
  }

  return {
    connected: true,
    totalVisits: total ?? 0,
    todayVisits: today ?? 0,
    topCampsites,
  };
}
