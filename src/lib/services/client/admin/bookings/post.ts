export async function postBooking(data: {
    car_id: number;
    booking_start_date: string;
    booking_end_date: string;

    rental_amount: number | string;
    discount_coupon: number | string;
    discount_promo: number | string;
    total_discount: number | string;

    booking_total_price: number | string;
    total_paid: number | string;
    remaining_amount: number | string;
    deposit_amount: number | string;

    coupon_id: number | null;
    promo_id: number | null;

    booking_status?: "pending" | "confirmed" | "cancelled" | "pending_balance";

    contact_name: string;
    contact_email: string;
    contact_phone: string;

    special_request?: string | null;
    internal_note?: string | null;
}) {
    const payload = {
        ...data,
        special_request: data.special_request ?? null,
        internal_note: data.internal_note ?? null,
    };

    const res = await fetch(`/api/admin/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ไม่สามารถเพิ่มข้อมูลจองได้");
    }

    return res.json();
}
