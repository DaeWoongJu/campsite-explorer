"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Campsite } from "@/lib/types";
import { loadKakaoSdk, hasKakaoKey } from "@/lib/kakao-sdk";

const KAKAO_KEY = hasKakaoKey();

interface Popup {
  campsite: Campsite;
  x: number;
  y: number;
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
  const campsitesRef = useRef<Campsite[]>(campsites);
  campsitesRef.current = campsites;
  const [status, setStatus] = useState<"loading" | "ready" | "no-key" | "error">(
    KAKAO_KEY ? "loading" : "no-key"
  );
  // Rendered as a normal React element on top of the map, instead of
  // Kakao's CustomOverlay — a plain HTML string injected into Kakao's
  // own DOM tree turned out to be unreliably clickable (its gesture
  // layer intercepts taps before they reach nested buttons).
  const [popup, setPopup] = useState<Popup | null>(null);
  const lastClickAtRef = useRef(0);

  function showPopup(campsite: Campsite) {
    const projection = mapRef.current.getProjection();
    const point = projection.containerPointFromCoords(
      new window.kakao.maps.LatLng(campsite.lat, campsite.lng)
    );
    setPopup({ campsite, x: point.x, y: point.y });
  }

  // Kakao's own event system (kakao.maps.event.addListener(map, "click", ...))
  // did not reliably fire on some real mobile browsers even though the
  // native DOM "click" on the same element did — so tap handling is done
  // entirely via a native listener on the container, using the Kakao
  // projection only as a coordinate-math helper (not an event source).
  function resolveTap(clientX: number, clientY: number, target: EventTarget | null) {
    // Some mobile browsers treat a first tap on an element as a hover
    // rather than a click (the "needs two taps" hover-emulation quirk),
    // and/or fire both "touchend" and a synthetic "click" ~300ms later
    // for the same physical tap. Debounce so double-firing does not
    // double-process, but do NOT skip the first genuine tap.
    const now = Date.now();
    if (now - lastClickAtRef.current < 400) return;
    lastClickAtRef.current = now;

    // MarkerClusterer's cluster bubbles are plain DOM elements whose
    // text is just the count (e.g. "12"). Let Kakao's own click-to-zoom
    // handle those; only resolve individual-marker taps ourselves.
    const targetText = (target as HTMLElement | null)?.textContent?.trim();
    if (targetText && /^\d+$/.test(targetText)) return;

    if (!containerRef.current || !mapRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickPoint = { x: clientX - rect.left, y: clientY - rect.top };
    const projection = mapRef.current.getProjection();

    // Measured on a real device: a tap on the visible (round, upper)
    // part of the pin lands about 40px above the marker's actual
    // anchor point, which Kakao places at the icon's bottom tip.
    // Compare against the anchor shifted up by that amount so a
    // natural tap on the icon body — not just its exact tip — matches.
    const ANCHOR_BIAS_Y = 25;
    let nearest: Campsite | null = null;
    let nearestDist = 50; // px

    for (const c of campsitesRef.current) {
      if (Number.isNaN(c.lat) || Number.isNaN(c.lng)) continue;
      const p = projection.containerPointFromCoords(
        new window.kakao.maps.LatLng(c.lat, c.lng)
      );
      const dist = Math.hypot(
        p.x - clickPoint.x,
        p.y - ANCHOR_BIAS_Y - clickPoint.y
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = c;
      }
    }

    if (nearest) {
      onSelect?.(nearest.id);
      showPopup(nearest);
    } else {
      setPopup(null);
    }
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
        containerRef.current.addEventListener("click", (e) =>
          resolveTap(e.clientX, e.clientY, e.target)
        );
        containerRef.current.addEventListener("touchend", (e) => {
          const touch = e.changedTouches[0];
          if (touch) resolveTap(touch.clientX, touch.clientY, e.target);
        });
        window.kakao.maps.event.addListener(mapRef.current, "dragstart", () =>
          setPopup(null)
        );
        window.kakao.maps.event.addListener(mapRef.current, "zoom_changed", () =>
          setPopup(null)
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
    setPopup(null);

    const markers = campsites
      .filter((c) => !Number.isNaN(c.lat) && !Number.isNaN(c.lng))
      .map((c) => {
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(c.lat, c.lng),
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

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full rounded-lg" />
      {popup && (
        <div
          style={{
            position: "absolute",
            left: Math.max(105, popup.x),
            top: Math.max(170, popup.y),
            transform: "translate(-50%, -130%)",
            width: 200,
            background: "white",
            borderRadius: 10,
            padding: 10,
            boxShadow: "0 2px 10px rgba(0,0,0,.25)",
            zIndex: 40,
          }}
        >
          <button
            aria-label="닫기"
            onClick={() => setPopup(null)}
            style={{
              position: "absolute",
              right: 6,
              top: 4,
              border: "none",
              background: "none",
              fontSize: 14,
              cursor: "pointer",
              color: "#888",
            }}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={popup.campsite.image}
            alt=""
            style={{
              width: "100%",
              height: 90,
              objectFit: "cover",
              borderRadius: 6,
              marginBottom: 6,
              display: "block",
            }}
          />
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#111",
              marginBottom: 6,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {popup.campsite.name}
          </div>
          <button
            onClick={() => router.push(`/campsites/${popup.campsite.id}`)}
            style={{
              width: "100%",
              background: "#059669",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 0",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            캠핑장 보기
          </button>
        </div>
      )}
    </div>
  );
}
