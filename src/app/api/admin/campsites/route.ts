import { NextRequest, NextResponse } from "next/server";
import { isValidSession, ADMIN_COOKIE } from "@/lib/admin-auth";
import { addCustomCampsite, deleteCustomCampsite } from "@/lib/custom-campsites";

function requireAdmin(request: NextRequest) {
  return isValidSession(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function POST(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "관리자만 추가할 수 있어요." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name || "").trim().slice(0, 60);
  const address = String(body?.address || "").trim().slice(0, 200);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const image = body?.image ? String(body.image).trim().slice(0, 500) : undefined;
  const intro = body?.intro ? String(body.intro).trim().slice(0, 500) : undefined;
  const tel = body?.tel ? String(body.tel).trim().slice(0, 30) : undefined;
  const homepage = body?.homepage ? String(body.homepage).trim().slice(0, 500) : undefined;

  if (!name || !address || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "name, address, lat, lng는 필수예요." },
      { status: 400 }
    );
  }

  const campsite = await addCustomCampsite({
    name,
    address,
    lat,
    lng,
    image,
    intro,
    tel,
    homepage,
  });

  if (!campsite) {
    return NextResponse.json(
      { error: "저장소가 연결되어 있지 않아요." },
      { status: 503 }
    );
  }

  return NextResponse.json({ campsite }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "관리자만 삭제할 수 있어요." }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id가 필요해요." }, { status: 400 });
  }

  const ok = await deleteCustomCampsite(id);
  return NextResponse.json({ ok });
}
