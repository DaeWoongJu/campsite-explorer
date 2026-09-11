import { getRedis } from "./redis";
import { Campsite } from "./types";

const KEY = "custom-campsites";

export async function getCustomCampsites(): Promise<Campsite[]> {
  const redis = getRedis();
  if (!redis) return [];
  const map = await redis.hgetall<Record<string, Campsite>>(KEY);
  return map ? Object.values(map) : [];
}

export interface NewCustomCampsite {
  name: string;
  address: string;
  lat: number;
  lng: number;
  image?: string;
  intro?: string;
  tel?: string;
  homepage?: string;
}

export async function addCustomCampsite(
  input: NewCustomCampsite
): Promise<Campsite | null> {
  const redis = getRedis();
  if (!redis) return null;

  const campsite: Campsite = {
    id: `custom-${crypto.randomUUID()}`,
    name: input.name,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    image: input.image || "https://picsum.photos/seed/customcamp/800/500",
    intro: input.intro || "",
    facilities: [],
    tel: input.tel || undefined,
    homepage: input.homepage || undefined,
    type: "직접 등록",
    region: "",
  };

  await redis.hset(KEY, { [campsite.id]: campsite });
  return campsite;
}

export async function deleteCustomCampsite(id: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const removed = await redis.hdel(KEY, id);
  return removed > 0;
}
