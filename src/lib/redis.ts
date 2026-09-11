import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let attempted = false;

/** Returns a Redis client, or null when no store is connected yet.
 *  Callers must handle null and no-op — this lets the app run
 *  locally/without stats before a database is attached. */
export function getRedis(): Redis | null {
  if (attempted) return client;
  attempted = true;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    client = new Redis({ url, token });
  }
  return client;
}
