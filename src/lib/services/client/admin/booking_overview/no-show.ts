

export async function markNoShow(booking_id: number) {
    const response = await fetch(`/api/admin/booking_overview/${booking_id}/no-show`, {
        method: "PATCH",
    });
    return response.json();
}