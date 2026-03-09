interface PickupOptions {
    pickup_datetime?: string; 
}

export async function pickupBooking(booking_id: number, options: PickupOptions = {}) {
    const { pickup_datetime } = options;

    const body: any = {};
    if (pickup_datetime) {
        body.pickup_datetime = pickup_datetime;
    }

    const response = await fetch(`/api/admin/booking_overview/${booking_id}/pickup`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
}