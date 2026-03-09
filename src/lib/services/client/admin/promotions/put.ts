export type PromotionPayload = {
    promo_code: string;
    discount_type: "percent" | "fixed";
    discount_value: string;
    promo_start: number | null;
    promo_end: number | null;
    promo_status: "active" | "inactive";
};

export async function putPromotion(
    promoId: number,
    payload: PromotionPayload
) {
    if (!promoId) {
        throw new Error("promoId is required");
    }

    const res = await fetch(`/api/admin/promotions/${promoId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ไม่สามารถแก้ไขโปรโมชั่นได้");
    }

    return res.json();
}
