import { Campsite } from "./types";
import { MOCK_CAMPSITES } from "./mock-campsites";

const GOCAMPING_BASE_URL =
  "https://apis.data.go.kr/B551011/GoCamping/basedList";
const GOCAMPING_IMAGE_URL =
  "https://apis.data.go.kr/B551011/GoCamping/imageList";

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
  const trimmed = value.trim();
  if (!trimmed) return null;

  const httpMatch = trimmed.match(/https?:\/\/[^\s"'<>]+/);
  if (httpMatch) return httpMatch[0];

  // Many entries store a bare domain like "www.example.com" with no protocol.
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return null;
}

export function hasLiveApi(): boolean {
  return Boolean(process.env.GOCAMPING_API_KEY);
}

const PAGE_SIZE = 500;

async function fetchPage(
  apiKey: string,
  pageNo: number
): Promise<{ items: GoCampingItem[]; totalCount: number }> {
  const url = new URL(GOCAMPING_BASE_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("numOfRows", String(PAGE_SIZE));
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "CampsiteExplorer");
  url.searchParams.set("_type", "json");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`GoCamping API error: ${res.status}`);
  const data: GoCampingResponse = await res.json();
  const items = data.response.body.items;
  return {
    items: items ? items.item : [],
    totalCount: data.response.body.totalCount,
  };
}

async function fetchAllFromGoCamping(apiKey: string): Promise<Campsite[]> {
  const first = await fetchPage(apiKey, 1);
  const totalPages = Math.ceil(first.totalCount / PAGE_SIZE);

  const restPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
      fetchPage(apiKey, i + 2)
    )
  );

  const allItems = [first, ...restPages].flatMap((p) => p.items);
  return allItems.filter((i) => i.mapX && i.mapY).map(normalize);
}

let cachedCampsites: Campsite[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export async function getCampsites(query?: string): Promise<Campsite[]> {
  const apiKey = process.env.GOCAMPING_API_KEY;

  if (!apiKey) {
    return filterByQuery(MOCK_CAMPSITES, query);
  }

  try {
    if (!cachedCampsites || Date.now() - cachedAt > CACHE_TTL_MS) {
      cachedCampsites = await fetchAllFromGoCamping(apiKey);
      cachedAt = Date.now();
    }
    return filterByQuery(cachedCampsites, query);
  } catch (err) {
    console.error("Failed to fetch GoCamping data, falling back to mock:", err);
    return filterByQuery(MOCK_CAMPSITES, query);
  }
}

export async function getCampsiteById(id: string): Promise<Campsite | null> {
  const all = await getCampsites();
  return all.find((c) => c.id === id) || null;
}

interface GoCampingImageItem {
  imageUrl: string;
}

export async function getCampsiteImages(contentId: string): Promise<string[]> {
  const apiKey = process.env.GOCAMPING_API_KEY;
  if (!apiKey) return [];

  const url = new URL(GOCAMPING_IMAGE_URL);
  url.searchParams.set("serviceKey", apiKey);
  url.searchParams.set("contentId", contentId);
  url.searchParams.set("MobileOS", "ETC");
  url.searchParams.set("MobileApp", "CampsiteExplorer");
  url.searchParams.set("_type", "json");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.response?.body?.items;
    if (!items) return [];
    const list: GoCampingImageItem[] = Array.isArray(items.item)
      ? items.item
      : [items.item];
    return list.map((i) => i.imageUrl).filter(Boolean);
  } catch (err) {
    console.error("Failed to fetch campsite images:", err);
    return [];
  }
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
