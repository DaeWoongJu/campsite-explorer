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
  const query = encodeURIComponent(`${campsite.name} 예약`);
  return {
    url: `https://search.naver.com/search.naver?query=${query}`,
    label: "네이버에서 찾아보기 ↗",
    isFallback: true,
  };
}

/** Returns 1-2 links: the source homepage (if any) plus a search
 *  fallback when there's no homepage, or when the homepage is just a
 *  social profile rather than a real booking/info site. */
export function getReservationLinks(campsite: Campsite): ReservationLink[] {
  if (!campsite.homepage) {
    return [naverSearchLink(campsite)];
  }

  const { label, isSocial } = classifyHomepage(campsite.homepage);
  const primary: ReservationLink = {
    url: campsite.homepage,
    label,
    isFallback: false,
  };

  return isSocial ? [primary, naverSearchLink(campsite)] : [primary];
}
