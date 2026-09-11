"use client";

import { useRouter } from "next/navigation";

export default function AdminCustomCampsiteDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("이 캠핑장을 삭제할까요?")) return;
    const res = await fetch(`/api/admin/campsites?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-500 hover:underline"
    >
      삭제
    </button>
  );
}
