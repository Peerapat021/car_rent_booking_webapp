export interface MonthlyRevenue {
    month: string;
    yearMonth: string;
    revenue: number;
}

export interface RevenueData {
    data: MonthlyRevenue[];
    summary: {
        totalRevenue: number;
        averageRevenue: number;
        highestMonth: MonthlyRevenue;
    };
}

export async function getMonthlyRevenue(months: number = 6): Promise<RevenueData> {
    try {
        const response = await fetch(`/api/admin/dashboard-stats/monthly?months=${months}`, {
            method: "GET",
            cache: "no-store",
        });

        const json = await response.json();

        if (!response.ok || !json.success) {
            throw new Error(json.message || `HTTP ${response.status}`);
        }

        return {
            data: json.data.map((item: any) => ({
                ...item,
                revenue: Number(item.revenue),
            })),
            summary: {
                totalRevenue: Number(json.summary.totalRevenue),
                averageRevenue: Number(json.summary.averageRevenue),
                highestMonth: json.summary.highestMonth,
            },
        };
    } catch (err: any) {
        console.error("[getMonthlyRevenue]", err);
        throw new Error(
            err.message || "ไม่สามารถดึงข้อมูลรายได้ได้ กรุณาลองใหม่ภายหลัง"
        );
    }
}
