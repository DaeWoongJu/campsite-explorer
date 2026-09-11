import { Campsite } from "./types";

export interface ReservationLink {
  url: string;
  label: string;
  isFallback: boolean;
}

const SOCIAL_HOSTS: { match: string; label: string }[] = [
  { match: "instagram.com", label: "인스타그램 ↗" },
  { match: "facebook.com", label: "페이스북 ↗" },
  { match: "blog.naver.com", label: "네이버 블로그 ↗" },
  { match: "cafe.naver.com", label: "네이버 카페 ↗" },
  { match: "youtube.com", label: "유튜브 ↗" },
  { match: "youtu.be", label: "유튜브 ↗" },
];

function classifyHomepage(url: string): { label: string; isSocial: boolean } {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const social = SOCIAL_HOSTS.find((s) => host.includes(s.match));
    if (social) return { label: social.label, isSocial: true };
  } catch {
    // ignore malformed URLs, fall through to default label
  }
  return { label: "예약/홈페이지 ↗", isSocial: false };
}

function naverSearchLink(campsite: Campsite): ReservationLink {
  const query = encodeURIComponent(campsite.name);
  return {
    url: `https://map.naver.com/p/search/${query}`,
    label: "네이버 지도에서 예약하기 ↗",
    isFallback: true,
  };
}

/** Returns the source homepage (if any) plus a Naver Map search
 *  fallback. The fallback is always included alongside a real
 *  homepage too — GoCamping's own homepage URLs are often stale
 *  (dead domains) and we cannot pre-check 3000+ links, so users
 *  always have a working backup path. */
export function getReservationLinks(campsite: Campsite): ReservationLink[] {
  if (!campsite.homepage) {
    return [naverSearchLink(campsite)];
  }

  const { label } = classifyHomepage(campsite.homepage);
  const primary: ReservationLink = {
    url: campsite.homepage,
    label,
    isFallback: false,
  };

  return [primary, naverSearchLink(campsite)];
}
