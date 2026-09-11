import { getRedis } from "./redis";

export interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  createdAt: string;
}

function reviewsKey(campsiteId: string): string {
  return `reviews:${campsiteId}`;
}

export async function getReviews(campsiteId: string): Promise<Review[]> {
  const redis = getRedis();
  if (!redis) return [];
  const raw = await redis.lrange<Review>(reviewsKey(campsiteId), 0, -1);
  return raw;
}

export async function addReview(
  campsiteId: string,
  input: { author: string; rating: number; content: string }
): Promise<Review | null> {
  const redis = getRedis();
  if (!redis) return null;

  const review: Review = {
    id: crypto.randomUUID(),
    author: input.author,
    rating: input.rating,
    content: input.content,
    createdAt: new Date().toISOString(),
  };

  await redis.lpush(reviewsKey(campsiteId), review);
  return review;
}
