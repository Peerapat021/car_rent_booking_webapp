export async function deleteCoupon(id: number) {
    const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "ลบคูปองไม่สำเร็จ");
    }

    return await res.json();
}