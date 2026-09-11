import { NextRequest, NextResponse } from "next/server";
import { getReviews, addReview, deleteReview } from "@/lib/reviews";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";

export async function GET(
  _request: NextRequest,
  { params }: RouteContext<"/api/reviews/[id]">
) {
  const { id } = await params;
  const reviews = await getReviews(id);
  return NextResponse.json({ reviews });
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext<"/api/reviews/[id]">
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  const author = String(body?.author || "").trim().slice(0, 40);
  const content = String(body?.content || "").trim().slice(0, 1000);
  const rating = Number(body?.rating);

  if (!author || !content || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "author, content, rating(1-5) are required" },
      { status: 400 }
    );
  }

  const review = await addReview(id, { author, content, rating });
  if (!review) {
    return NextResponse.json(
      { error: "리뷰 저장소가 연결되어 있지 않아요." },
      { status: 503 }
    );
  }

  return NextResponse.json({ review }, { status: 201 });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext<"/api/reviews/[id]">
) {
  const { id } = await params;
  const authed = isValidSession(request.cookies.get(ADMIN_COOKIE)?.value);
  if (!authed) {
    return NextResponse.json({ error: "관리자만 삭제할 수 있어요." }, { status: 403 });
  }

  const reviewId = request.nextUrl.searchParams.get("reviewId");
  if (!reviewId) {
    return NextResponse.json({ error: "reviewId가 필요해요." }, { status: 400 });
  }

  const ok = await deleteReview(id, reviewId);
  return NextResponse.json({ ok });
}
