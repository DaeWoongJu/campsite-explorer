"use client";

import { useEffect, useState, FormEvent } from "react";
import { Review } from "@/lib/types";

export default function ReviewSection({ campsiteId }: { campsiteId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reviews/${campsiteId}`)
      .then((res) => res.json())
      .then((data) => !cancelled && setReviews(data.reviews))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campsiteId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!author.trim() || !content.trim()) {
      setError("이름과 리뷰 내용을 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${campsiteId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, rating, content }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setReviews((prev) => [data.review, ...prev]);
      setAuthor("");
      setContent("");
      setRating(5);
    } catch {
      setError("리뷰 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const average =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">리뷰</h2>
        {average && (
          <span className="text-sm text-zinc-500">
            ★ {average} ({reviews.length}개)
          </span>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
      >
        <div className="flex gap-2">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="이름"
            maxLength={40}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {"★".repeat(n)} ({n})
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이용 후기를 남겨주세요"
          rows={3}
          maxLength={1000}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? "등록 중..." : "리뷰 등록"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {loading && <p className="text-sm text-zinc-400">불러오는 중...</p>}
        {!loading && reviews.length === 0 && (
          <p className="text-sm text-zinc-400">아직 리뷰가 없어요. 첫 리뷰를 남겨보세요!</p>
        )}
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.author}</span>
              <span className="text-sm text-amber-500">{"★".repeat(r.rating)}</span>
            </div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {r.content}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(r.createdAt).toLocaleDateString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
