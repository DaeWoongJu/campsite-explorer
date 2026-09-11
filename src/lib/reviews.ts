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
  const map = await redis.hgetall<Record<string, Review>>(reviewsKey(campsiteId));
  if (!map) return [];
  return Object.values(map).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

  await redis.hset(reviewsKey(campsiteId), { [review.id]: review });
  return review;
}

export async function deleteReview(
  campsiteId: string,
  reviewId: string
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  const removed = await redis.hdel(reviewsKey(campsiteId), reviewId);
  return removed > 0;
}
