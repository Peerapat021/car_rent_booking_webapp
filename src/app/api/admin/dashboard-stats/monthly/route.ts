// src/app/api/dashboard-stats/monthly/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { sql, and, gte, lte, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);
        if (!session?.user || !["staff", "admin"].includes(session.user.role ?? "")) {
            return NextResponse.json(
                { success: false, message: "ไม่ได้รับอนุญาต (เฉพาะ Staff/Admin)" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const monthsParam = searchParams.get("months");
        const months = monthsParam ? Math.max(1, Math.min(24, parseInt(monthsParam))) : 6;

        const now = new Date();

        const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1, 0, 0, 0);
        startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());

        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());

        const revenueData = await db
            .select({
                month: sql<string>`DATE_FORMAT(${bookings.pickup_datetime}, '%Y-%m')`,
                revenue: sql<number>`COALESCE(SUM(${bookings.booking_total_price}), 0)`,
            })
            .from(bookings) 
            .where(
                and(
                    gte(bookings.pickup_datetime, startDate),
                    lte(bookings.pickup_datetime, endDate),
                    inArray(bookings.booking_status, [
                        "confirmed",
                        "picked_up",
                        "returned",
                        "completed",
                        // "pending_balance" ถ้าต้องการรวมยอดที่ยังไม่จ่ายเต็ม → ถ้าไม่ต้องการให้ comment ออก
                    ])
                )
            )
            .groupBy(sql`DATE_FORMAT(${bookings.pickup_datetime}, '%Y-%m')`)
            .orderBy(sql`DATE_FORMAT(${bookings.pickup_datetime}, '%Y-%m') ASC`);

        const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

        const formattedData = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const monthName = monthNames[date.getMonth()];

            const found = revenueData.find((item) => item.month === yearMonth);

            formattedData.push({
                month: monthName,
                yearMonth,
                revenue: found ? Number(found.revenue) : 0,
            });
        }

        const totalRevenue = formattedData.reduce((sum, item) => sum + item.revenue, 0);
        const avgRevenue = formattedData.length > 0 ? Math.round(totalRevenue / formattedData.length) : 0;

        return NextResponse.json({
            success: true,
            data: formattedData,
            summary: {
                totalRevenue,
                averageRevenue: avgRevenue,
                highestMonth: formattedData.reduce(
                    (max, item) => (item.revenue > max.revenue ? item : max),
                    formattedData[0] || { revenue: 0, month: "—", yearMonth: "—" }
                ),
            },
        });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("[Monthly Revenue API] Error:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายได้", error: error?.message },
            { status: 500 }
        );
    }
}