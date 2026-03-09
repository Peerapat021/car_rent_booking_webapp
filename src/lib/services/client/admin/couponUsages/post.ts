
export async function postCouponUsage(data: { usage_id: string, coupon_id: string, user_id: string, booking_id: string }) {
    const res = await fetch(`/api/admin/coupon_usages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถเพิ่มประวัติการใช้งานคูปองได้");
    }

    return res.json();
}