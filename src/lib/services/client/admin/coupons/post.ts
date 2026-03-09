// lib/services/coupons/post.ts
export async function postCoupon(formData: FormData) {
    const res = await fetch("/api/admin/coupons", {
        method: "POST",
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "เพิ่มคูปองไม่สำเร็จ");
    }

    return await res.json();
}