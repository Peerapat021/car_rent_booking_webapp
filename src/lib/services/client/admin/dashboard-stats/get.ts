export interface DashboardStats {
    availableCars: number;
    rentedCars: number;
    pickupToday: number;
    returnToday: number;
    timestamp: string;
    debugTimezone?: {
        nowLocal: string;
        todayStart: string;
        todayEnd: string;
        offsetUsed: number;
    };
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const response = await fetch("/api/admin/dashboard-stats", {
            method: "GET",
            cache: "no-store",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${response.status}`);
        }

        const json = await response.json();

        if (!json.success) {
            throw new Error(json.message || "API response not successful");
        }

        return json.data as DashboardStats;
    } catch (err: any) {
        console.error("[getDashboardStats]", err);
        throw new Error(
            err.message || "ไม่สามารถดึงข้อมูลแดชบอร์ดได้ กรุณาลองใหม่ภายหลัง"
        );
    }
}