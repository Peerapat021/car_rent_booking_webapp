/* ======================= UPDATE BOOKING ======================= */
export async function putBooking(data: {
    id: string;
    booking_start_date: string;
    booking_end_date: string;
    booking_total_price: number | string;
    booking_status: "pending" | "confirmed" | "cancelled";
    contact_name: string;
    contact_email: string;
    contact_phone: string;
}) {
    const res = await fetch(`/api/admin/bookings/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        throw new Error("ไม่สามารถอัปเดตข้อมูลจองได้");
    }

    return res.json();
}