

export async function cancelBooking(booking_id: number) {
    const response = await fetch(`/api/admin/booking_overview/${booking_id}/cancel`, {
        method: "PATCH",
    });
    return response.json();
}