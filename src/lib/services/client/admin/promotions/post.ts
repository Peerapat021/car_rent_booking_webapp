
export async function postPromotion(data: {
    promo_code: string;
    discount_type: "percent" | "fixed";
    discount_value: string;
    promo_start: number | null;
    promo_end: number | null;
    promo_status: "active" | "inactive";
}) {
    const res = await fetch(`/api/admin/promotions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "ไม่สามารถเพิ่มโปรโมชั่นได้");
    }

    return res.json();
}
