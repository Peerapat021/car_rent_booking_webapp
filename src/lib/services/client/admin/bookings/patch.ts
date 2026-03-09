/* ======================= UPDATE STATUS ======================= */
export async function updateBookingStatus(
    booking_id: number,
    new_status: "pending" | "pending_balance" | "confirmed" | "cancelled"
) {
    const res = await fetch(`/api/admin/bookings/${booking_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: new_status }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "ไม่สามารถอัปเดตสถานะการจองได้");
    }

    return res.json();
}