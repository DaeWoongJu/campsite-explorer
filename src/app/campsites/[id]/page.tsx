import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getCampsiteById, getCampsiteImages } from "@/lib/campsites";
import { getReservationLinks } from "@/lib/links";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import CampsiteMap from "@/components/CampsiteMap";
import PhotoGallery from "@/components/PhotoGallery";
import ReviewSection from "@/components/ReviewSection";

export default async function CampsiteDetailPage(
  props: PageProps<"/campsites/[id]">
) {
  const { id } = await props.params;
  const [campsite, extraImages, cookieStore] = await Promise.all([
    getCampsiteById(id),
    getCampsiteImages(id),
    cookies(),
  ]);
  if (!campsite) notFound();
  const isAdmin = isValidSession(cookieStore.get(ADMIN_COOKIE)?.value);
  const reservations = getReservationLinks(campsite);
  const carCampingNote = campsite.carCampingNote;
  const images = Array.from(
    new Set([campsite.image, ...extraImages].filter(Boolean))
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← 목록으로
        </Link>

        <PhotoGallery images={images} alt={campsite.name} />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{campsite.name}</h1>
            {campsite.type && (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                {campsite.type}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">{campsite.address}</p>
        </div>

        <p className="text-zinc-700 dark:text-zinc-300">{campsite.intro}</p>

        {carCampingNote ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            <span className="font-semibold">🚗 차박 관련 안내 (캠핑장 소개글 발췌)</span>
            <p className="mt-1">&ldquo;{carCampingNote}&rdquo;</p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
              공식 확인된 정보가 아니라 캠핑장이 직접 쓴 소개글 문장이에요. 예약/문의 시 다시 확인해주세요.
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-400">
            🚗 차박 가능 여부는 이 캠핑장 소개글에 나와있지 않아요. 예약 전 캠핑장에 직접 문의해주세요.
          </p>
        )}

        {campsite.facilities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {campsite.facilities.map((f) => (
              <span
                key={f}
                className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {campsite.tel && (
            <a
              href={`tel:${campsite.tel}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              📞 {campsite.tel}
            </a>
          )}
          {reservations.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 ${
                r.isFallback ? "bg-zinc-500" : "bg-emerald-600"
              }`}
            >
              {r.label}
            </a>
          ))}
        </div>

        <div className="h-64 w-full">
          <CampsiteMap campsites={[campsite]} selectedId={campsite.id} />
        </div>

        <ReviewSection campsiteId={campsite.id} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
