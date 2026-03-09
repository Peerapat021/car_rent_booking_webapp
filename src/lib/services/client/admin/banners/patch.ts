export async function updateBannerStatus(
    banner_id: number,
    new_status: "draft" | "published" | "inactive"
) {
    const res = await fetch(`/api/admin/banners/${banner_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner_status: new_status }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ไม่สามารถอัปเดตสถานะแบนเนอร์ได้");
    }

    return res.json();
}