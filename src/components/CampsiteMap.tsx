"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=clusterer`;
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
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const overlayRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "no-key" | "error">(
    KAKAO_KEY ? "loading" : "no-key"
  );

  function closeOverlay() {
    overlayRef.current?.setMap(null);
    overlayRef.current = null;
  }

  function openOverlay(campsite: Campsite, marker: any) {
    const kakao = window.kakao;
    closeOverlay();

    const el = document.createElement("div");
    el.style.cssText =
      "background:white;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.2);padding:10px;width:200px;font-family:inherit;position:relative;";
    el.innerHTML = `
      <button aria-label="닫기" style="position:absolute;top:4px;right:6px;border:none;background:none;font-size:14px;cursor:pointer;color:#888;">✕</button>
      <img src="${campsite.image}" alt="" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />
      <div style="font-size:13px;font-weight:600;color:#111;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${campsite.name}</div>
      <button style="width:100%;background:#059669;color:white;border:none;border-radius:6px;padding:6px 0;font-size:12px;font-weight:600;cursor:pointer;">캠핑장 보기</button>
    `;
    const [closeBtn, viewBtn] = el.querySelectorAll("button");
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeOverlay();
    });
    viewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      router.push(`/campsites/${campsite.id}`);
    });

    const overlay = new kakao.maps.CustomOverlay({
      content: el,
      position: marker.getPosition(),
      yAnchor: 1.3,
      zIndex: 10,
    });
    overlay.setMap(mapRef.current);
    overlayRef.current = overlay;
  }

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
        clustererRef.current = new window.kakao.maps.MarkerClusterer({
          map: mapRef.current,
          averageCenter: true,
          minLevel: 6,
          disableClickZoom: false,
        });
        window.kakao.maps.event.addListener(mapRef.current, "click", () =>
          closeOverlay()
        );
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !containerRef.current) return;
    const map = mapRef.current;

    // The container can be 0x0 while hidden behind the mobile list/map
    // tab. Kakao's map sizes itself once at construction time, so it
    // needs an explicit relayout whenever the visible size changes.
    const observer = new ResizeObserver(() => {
      const center = map.getCenter();
      map.relayout();
      map.setCenter(center);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [status]);

  useEffect(() => {
    if (status !== "ready" || !mapRef.current || !clustererRef.current) return;
    const kakao = window.kakao;

    clustererRef.current.clear();
    markersRef.current = {};
    closeOverlay();

    const markers = campsites
      .filter((c) => !Number.isNaN(c.lat) && !Number.isNaN(c.lng))
      .map((c) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(c.lat, c.lng),
        });
        kakao.maps.event.addListener(marker, "click", () => {
          onSelect?.(c.id);
          openOverlay(c, marker);
        });
        markersRef.current[c.id] = marker;
        return marker;
      });

    clustererRef.current.addMarkers(markers);
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
