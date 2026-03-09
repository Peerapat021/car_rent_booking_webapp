export async function putCoupon(id: number, formData: FormData) {
    const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "แก้ไขคูปองไม่สำเร็จ");
    }

    return await res.json();
}