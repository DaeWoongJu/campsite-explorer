import { NextRequest, NextResponse } from "next/server";
import { addReview, getReviewsFor } from "@/lib/reviews";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/reviews/[id]">
) {
  const { id } = await params;
  const reviews = await getReviewsFor(id);
  return NextResponse.json({ reviews });
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/reviews/[id]">
) {
  const { id } = await params;
  const body = await request.json();

  const author = String(body.author || "").trim().slice(0, 40);
  const content = String(body.content || "").trim().slice(0, 1000);
  const rating = Number(body.rating);

  if (!author || !content || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "author, content, rating(1-5) are required" },
      { status: 400 }
    );
  }

  const review = await addReview({ campsiteId: id, author, content, rating });
  return NextResponse.json({ review }, { status: 201 });
}
