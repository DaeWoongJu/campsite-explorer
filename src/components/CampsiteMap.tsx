"use client";

import { useEffect, useRef, useState } from "react";
import { Campsite } from "@/lib/types";

declare global {
  interface Window {
    kakao: any;
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

let sdkLoadPromise: Promise<void> | null = null;

function loadKakaoSdk(): Promise<void> {
  if (!KAKAO_KEY) return Promise.reject(new Error("no key"));
  if (window.kakao?.maps) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;

  sdkLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("Kakao SDK load failed"));
    document.head.appendChild(script);
  });
  return sdkLoadPromise;
}

export default function CampsiteMap({
  campsites,
  selectedId,
  onSelect,
}: {
  campsites: Campsite[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [status, setStatus] = useState<"loading" | "ready" | "no-key" | "error">(
    KAKAO_KEY ? "loading" : "no-key"
  );

  useEffect(() => {
    if (!KAKAO_KEY || !containerRef.current) return;

    let cancelled = false;
    loadKakaoSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const center = new window.kakao.maps.LatLng(36.5, 127.8);
        mapRef.current = new window.kakao.maps.Map(containerRef.current, {
          center,
          level: 13,
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current) return;
    const kakao = window.kakao;

    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};

    campsites.forEach((c) => {
      if (Number.isNaN(c.lat) || Number.isNaN(c.lng)) return;
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(c.lat, c.lng),
        map: mapRef.current,
      });
      kakao.maps.event.addListener(marker, "click", () => onSelect?.(c.id));
      markersRef.current[c.id] = marker;
    });
  }, [campsites, status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !selectedId) return;
    const marker = markersRef.current[selectedId];
    if (marker) {
      mapRef.current.panTo(marker.getPosition());
    }
  }, [selectedId, status]);

  if (status === "no-key") {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
        <p className="font-medium text-zinc-700 dark:text-zinc-300">
          지도를 표시하려면 카카오맵 API 키가 필요해요
        </p>
        <p className="max-w-xs">
          .env.local의 NEXT_PUBLIC_KAKAO_MAP_KEY 값을 설정하면 이 자리에 실제
          지도가 표시됩니다.
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50 p-6 text-center text-sm text-red-500 dark:border-red-900 dark:bg-red-950">
        지도를 불러오지 못했어요. API 키가 올바른지 확인해주세요.
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
