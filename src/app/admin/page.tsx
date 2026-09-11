import { cookies } from "next/headers";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import { getStats } from "@/lib/stats";
import { getCampsiteById, getCampsites, hasLiveApi } from "@/lib/campsites";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authed = isValidSession(cookieStore.get(ADMIN_COOKIE)?.value);

  if (!authed) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <AdminLoginForm />
      </div>
    );
  }

  const stats = await getStats();
  const debugAll = await getCampsites();
  const debugInfo = `live=${hasLiveApi()} count=${debugAll.length} has101058=${debugAll.some((c) => c.id === "101058")} topIds=${JSON.stringify(
    stats.topCampsites.map((c) => ({ raw: c.id, len: c.id.length }))
  )}`;
  const topCampsites = await Promise.all(
    stats.topCampsites.map(async (c) => ({
      ...c,
      name: (await getCampsiteById(c.id))?.name ?? `(삭제됨/${c.id})`,
    }))
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            관리자
          </h1>
          <AdminLogoutButton />
        </div>

        <p className="text-xs text-zinc-400">DEBUG: {debugInfo}</p>

        {!stats.connected && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
            데이터베이스가 아직 연결되지 않았어요. 환경변수(KV_REST_API_URL /
            KV_REST_API_TOKEN)를 설정하면 아래 통계가 실제로 집계됩니다.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">오늘 방문</p>
            <p className="mt-1 text-2xl font-bold">{stats.todayVisits}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-xs text-zinc-500">전체 방문</p>
            <p className="mt-1 text-2xl font-bold">{stats.totalVisits}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            많이 클릭한 캠핑장 TOP 20
          </h2>
          {topCampsites.length === 0 ? (
            <p className="text-sm text-zinc-400">아직 데이터가 없어요.</p>
          ) : (
            <ol className="flex flex-col gap-1">
              {topCampsites.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span className="truncate">
                    <span className="mr-2 text-zinc-400">{i + 1}</span>
                    {c.name}
                  </span>
                  <span className="flex-shrink-0 font-semibold text-emerald-600 dark:text-emerald-400">
                    {c.count}회
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
