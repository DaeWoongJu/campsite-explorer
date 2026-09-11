"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Campsite } from "@/lib/types";
import CampsiteMap from "./CampsiteMap";

export default function ExplorerView({
  initialCampsites,
  live,
}: {
  initialCampsites: Campsite[];
  live: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>();

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
          {filtered.map((c) => (
            <CampsiteCard
              key={c.id}
              campsite={c}
              selected={c.id === selectedId}
              onHover={() => setSelectedId(c.id)}
            />
          ))}
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
  return (
    <div
      onMouseEnter={onHover}
      className={`flex gap-3 rounded-xl border p-3 transition-colors ${
        selected
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={campsite.image}
        alt={campsite.name}
        className="h-24 w-32 flex-shrink-0 rounded-lg object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/campsites/${campsite.id}`}
            className="truncate font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
          >
            {campsite.name}
          </Link>
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
          <Link
            href={`/campsites/${campsite.id}`}
            className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            자세히 보기
          </Link>
          {campsite.homepage && (
            <a
              href={campsite.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-zinc-500 hover:underline"
            >
              예약/홈페이지 ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
