import { getCampsites, hasLiveApi } from "@/lib/campsites";
import ExplorerView from "@/components/ExplorerView";

export default async function Home() {
  const campsites = await getCampsites();
  return (
    <div className="h-full flex-1">
      <ExplorerView initialCampsites={campsites} live={hasLiveApi()} />
    </div>
  );
}
