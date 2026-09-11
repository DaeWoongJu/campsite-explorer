import { Campsite } from "./types";

export function getReservationLink(campsite: Campsite): {
  url: string;
  label: string;
  isFallback: boolean;
} {
  if (campsite.homepage) {
    return { url: campsite.homepage, label: "예약/홈페이지 ↗", isFallback: false };
  }

  const query = encodeURIComponent(`${campsite.name} 예약`);
  return {
    url: `https://search.naver.com/search.naver?query=${query}`,
    label: "네이버에서 찾아보기 ↗",
    isFallback: true,
  };
}
