"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loadKakaoSdk } from "@/lib/kakao-sdk";

declare global {
  interface Window {
    daum: any;
  }
}

let postcodeLoadPromise: Promise<void> | null = null;

function loadDaumPostcode(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (postcodeLoadPromise) return postcodeLoadPromise;

  postcodeLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Postcode script load failed"));
    document.head.appendChild(script);
  });
  return postcodeLoadPromise;
}

export default function AdminAddCampsiteForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [image, setImage] = useState("");
  const [intro, setIntro] = useState("");
  const [tel, setTel] = useState("");
  const [homepage, setHomepage] = useState("");
  const [status, setStatus] = useState<"idle" | "geocoding" | "submitting">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPostcode, setShowPostcode] = useState(false);
  const postcodeContainerRef = useRef<HTMLDivElement>(null);

  // Daum Postcode's own .open() relies on window.open, which many
  // browsers (and some in-app webviews) block outright regardless of
  // user gesture. Embedding it directly in a modal we control avoids
  // popups entirely and works everywhere.
  useEffect(() => {
    if (!showPostcode || !postcodeContainerRef.current) return;
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        const picked = data.roadAddress || data.jibunAddress || data.address;
        setAddress(picked);
        setShowPostcode(false);
        geocode(picked);
      },
      width: "100%",
      height: "100%",
    }).embed(postcodeContainerRef.current);
  }, [showPostcode]);

  async function geocode(addr: string) {
    setStatus("geocoding");
    setError(null);
    try {
      await loadKakaoSdk();
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(addr, (result: any[], geocodeStatus: string) => {
        if (geocodeStatus === window.kakao.maps.services.Status.OK && result[0]) {
          setCoords({ lat: Number(result[0].y), lng: Number(result[0].x) });
        } else {
          setCoords(null);
          setError(
            "이 주소로는 좌표를 찾지 못했어요. 주소 검색에서 다시 선택해주세요."
          );
        }
        setStatus("idle");
      });
    } catch {
      setStatus("idle");
      setError("카카오 지도를 불러오지 못했어요.");
    }
  }

  async function handleSearchAddress() {
    setError(null);
    try {
      await loadDaumPostcode();
      setShowPostcode(true);
    } catch {
      setError("주소 검색 창을 불러오지 못했어요.");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !address.trim() || !coords) {
      setError("이름과 주소(검색으로 좌표 확인까지)는 필수예요.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/admin/campsites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          lat: coords.lat,
          lng: coords.lng,
          image: image || undefined,
          intro: intro || undefined,
          tel: tel || undefined,
          homepage: homepage || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");

      setSuccess(`"${name}" 캠핑장을 추가했어요.`);
      setName("");
      setAddress("");
      setCoords(null);
      setImage("");
      setIntro("");
      setTel("");
      setHomepage("");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "추가에 실패했어요."
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        캠핑장 직접 추가
      </h2>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="캠핑장 이름 (필수)"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />

      <div className="flex gap-2">
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="주소 (검색으로 채워짐)"
          readOnly
          className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        />
        <button
          type="button"
          onClick={handleSearchAddress}
          className="flex-shrink-0 rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          주소 검색
        </button>
      </div>

      {status === "geocoding" && (
        <p className="text-xs text-zinc-400">좌표 확인 중...</p>
      )}
      {coords && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          좌표 확인됨: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>
      )}

      <input
        value={image}
        onChange={(e) => setImage(e.target.value)}
        placeholder="사진 주소(URL) — 선택"
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        value={intro}
        onChange={(e) => setIntro(e.target.value)}
        placeholder="소개 — 선택"
        rows={2}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <input
          value={tel}
          onChange={(e) => setTel(e.target.value)}
          placeholder="전화번호 — 선택"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          value={homepage}
          onChange={(e) => setHomepage(e.target.value)}
          placeholder="홈페이지/예약 링크 — 선택"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      {success && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">{success}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {status === "submitting" ? "추가 중..." : "캠핑장 추가"}
      </button>

      {showPostcode && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,.5)",
          }}
          className="flex items-center justify-center p-4"
        >
          <div className="relative h-[500px] w-full max-w-md rounded-xl bg-white p-2">
            <button
              type="button"
              onClick={() => setShowPostcode(false)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-white shadow"
              aria-label="닫기"
            >
              ✕
            </button>
            <div ref={postcodeContainerRef} className="h-full w-full" />
          </div>
        </div>
      )}
    </form>
  );
}
