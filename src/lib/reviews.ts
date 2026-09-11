import { promises as fs } from "fs";
import path from "path";
import { Review } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "reviews.json");

async function readAll(): Promise<Review[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw) as Review[];
  } catch {
    return [];
  }
}

async function writeAll(reviews: Review[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(reviews, null, 2), "utf-8");
}

export async function getReviewsFor(campsiteId: string): Promise<Review[]> {
  const all = await readAll();
  return all
    .filter((r) => r.campsiteId === campsiteId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addReview(
  input: Omit<Review, "id" | "createdAt">
): Promise<Review> {
  const all = await readAll();
  const review: Review = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all.push(review);
  await writeAll(all);
  return review;
}
