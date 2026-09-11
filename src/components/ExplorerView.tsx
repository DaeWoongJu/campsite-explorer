"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Campsite } from "@/lib/types";
import { getReservationLink } from "@/lib/links";
import CampsiteMap from "./CampsiteMap";

const PAGE_SIZE = 30;

export default function ExplorerView({
  initialCampsites,
  live,
}: {
  initialCampsites: Campsite[];
  live: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!query.trim()) return initialCampsites;
    const q = query.trim().toLowerCase();
    return initialCampsites.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    );
  }, [initialCampsites, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const displayed = filtered.slice(0, visibleCount);

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            전국 캠핑장 탐색
          </h1>
          <p className="text-sm text-zinc-500">
            {filtered.length}개의 캠핑장 ·{" "}
            <span
              className={
                live
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400"
              }
            >
              {live ? "고캠핑 실시간 데이터" : "샘플 데이터 (API 키 미설정)"}
            </span>
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="캠핑장 이름, 주소, 지역으로 검색"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-500 sm:w-80 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </header>

      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-3 overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-zinc-400">
              검색 결과가 없어요.
            </p>
          )}
          {displayed.map((c) => (
            <CampsiteCard
              key={c.id}
              campsite={c}
              selected={c.id === selectedId}
              onHover={() => setSelectedId(c.id)}
            />
          ))}
          {visibleCount < filtered.length && (
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              더 보기 ({visibleCount} / {filtered.length})
            </button>
          )}
        </div>
        <div className="hidden min-h-[300px] md:block">
          <CampsiteMap
            campsites={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </div>
  );
}

function CampsiteCard({
  campsite,
  selected,
  onHover,
}: {
  campsite: Campsite;
  selected: boolean;
  onHover: () => void;
}) {
  const router = useRouter();
  const reservation = getReservationLink(campsite);

  return (
    <div
      onMouseEnter={onHover}
      onClick={() => router.push(`/campsites/${campsite.id}`)}
      className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors ${
        selected
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={campsite.image}
        alt={campsite.name}
        loading="lazy"
        className="h-24 w-32 flex-shrink-0 rounded-lg object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-zinc-900 dark:text-zinc-50">
            {campsite.name}
          </span>
          {campsite.type && (
            <span className="flex-shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
              {campsite.type}
            </span>
          )}
        </div>
        <p className="truncate text-xs text-zinc-500">{campsite.address}</p>
        <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {campsite.intro}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-1">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            자세히 보기
          </span>
          <a
            href={reservation.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`text-xs font-medium hover:underline ${
              reservation.isFallback
                ? "text-zinc-400"
                : "text-zinc-500"
            }`}
          >
            {reservation.label}
          </a>
        </div>
      </div>
    </div>
  );
}
