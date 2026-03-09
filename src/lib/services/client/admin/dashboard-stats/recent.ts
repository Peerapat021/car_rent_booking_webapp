export interface RecentBooking {
    id: number;
    customerName: string | null;
    contactName: string | null;
    contactPhone: string | null;
    carName: string | null;
    pickupDate: Date | null;
    amount: number;
    status: string;
}

export async function getRecentBookings(): Promise<RecentBooking[]> {
    const response = await fetch("/api/admin/dashboard-stats/recent", {
        cache: "no-store",
    });

    if (!response.ok) throw new Error("Failed to fetch recent bookings");

    const json = await response.json();
    if (!json.success) throw new Error(json.message || "API error");

    return json.data.map((b: any) => ({
        id: b.id,
        customerName: b.customerName ?? null,
        contactName: b.contactName ?? null,
        contactPhone: b.contactPhone ?? null,
        carName: b.carName ?? null,
        pickupDate: b.pickupDate ? new Date(b.pickupDate) : null,
        amount: Number(b.amount || 0),
        status: b.status,
    }));
}