import { Campsite } from "./types";
import { MOCK_CAMPSITES } from "./mock-campsites";

const GOCAMPING_BASE_URL =
  "https://apis.data.go.kr/B551011/GoCamping/basedList";

interface GoCampingItem {
  contentId: string;
  facltNm: string;
  addr1: string;
  addr2?: string;
  mapX: string;
  mapY: string;
  firstImageUrl?: string;
  intro?: string;
  lineIntro?: string;
  sbrsCl?: string;
  tel?: string;
  homepage?: string;
  induty?: string;
  doNm?: string;
  sigunguNm?: string;
}

interface GoCampingResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: GoCampingItem[] } | "";
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

function normalize(item: GoCampingItem): Campsite {
  return {
    id: item.contentId,
    name: item.facltNm,
    address: item.addr2 ? `${item.addr1} ${item.addr2}` : item.addr1,
    lat: parseFloat(item.mapY),
    lng: parseFloat(item.mapX),
    image: item.firstImageUrl || "https://picsum.photos/seed/nocamp/800/500",
    intro: stripHtml(item.lineIntro || item.intro || ""),
    facilities: (item.sbrsCl || "")
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean),
    tel: item.tel || undefined,
    homepage: extractFirstUrl(item.homepage) || undefined,
    type: item.induty || undefined,
    region: [item.doNm, item.sigunguNm].filter(Boolean).join(" "),
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function extractFirstUrl(value?: string): string | null {
  if (!value) return null;
  const match = value.match(/https?:\/\/[^\s"'<>]+/);
  return match ? match[0] : null;
}

export function hasLiveApi(): boolean {
  return Boolean(process.env.GOCAMPING_API_KEY);
}

export async function getCampsites(query?: string): Promise<Campsite[]> {
  const apiKey = process.env.GOCAMPING_API_KEY;

  if (!apiKey) {
    return filterByQuery(MOCK_CAMPSITES, query);
  }

  const url = new URL(GOCAMPING_BASE_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("numOfRows", "200");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "CampsiteExplorer");
  url.searchParams.set("_type", "json");
  if (query) url.searchParams.set("keyword", query);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`GoCamping API error: ${res.status}`);
    const data: GoCampingResponse = await res.json();
    const items = data.response.body.items;
    if (!items) return [];
    return items.item
      .filter((i) => i.mapX && i.mapY)
      .map(normalize);
  } catch (err) {
    console.error("Failed to fetch GoCamping data, falling back to mock:", err);
    return filterByQuery(MOCK_CAMPSITES, query);
  }
}

export async function getCampsiteById(id: string): Promise<Campsite | null> {
  const all = await getCampsites();
  return all.find((c) => c.id === id) || null;
}

function filterByQuery(list: Campsite[], query?: string): Campsite[] {
  if (!query) return list;
  const q = query.toLowerCase();
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
  );
}
