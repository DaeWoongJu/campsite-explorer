import { notFound } from "next/navigation";
import Link from "next/link";
import { getCampsiteById } from "@/lib/campsites";
import { getReservationLinks } from "@/lib/links";
import CampsiteMap from "@/components/CampsiteMap";

export default async function CampsiteDetailPage(
  props: PageProps<"/campsites/[id]">
) {
  const { id } = await props.params;
  const campsite = await getCampsiteById(id);
  if (!campsite) notFound();
  const reservations = getReservationLinks(campsite);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 p-4 md:p-8">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← 목록으로
        </Link>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={campsite.image}
          alt={campsite.name}
          className="h-64 w-full rounded-xl object-cover"
        />

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
      </div>
    </div>
  );
}
