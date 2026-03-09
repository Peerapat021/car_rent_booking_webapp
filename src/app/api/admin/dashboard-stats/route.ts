
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { bookings, cars } from "@/lib/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        // ตรวจสอบสิทธิ์ (เฉพาะ admin/staff)
        const session = await getServerSession(authOptions);
        if (!session?.user || !["admin", "staff"].includes(session.user.role ?? "")) {
            return NextResponse.json(
                { success: false, message: "ไม่ได้รับอนุญาต (เฉพาะ Admin/Staff)" },
                { status: 401 }
            );
        }

        // จัดการวันที่ timezone ประเทศไทย (+07:00)
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        todayStart.setMinutes(todayStart.getMinutes() - todayStart.getTimezoneOffset());

        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        todayEnd.setMinutes(todayEnd.getMinutes() - todayEnd.getTimezoneOffset());

        // ───────────────────────────────────────────────
        // Query ทั้ง 4 ตัว
        // 1. รถพร้อมเช่า
        const availableRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(cars)
            .where(eq(cars.car_status, "available"));

        const availableCars = Number(availableRes[0]?.count ?? 0);

        // 2. กำลังเช่าอยู่
        const rentedRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(eq(bookings.booking_status, "picked_up"));

        const rentedCars = Number(rentedRes[0]?.count ?? 0);

        // 3. ต้องรับรถวันนี้
        const pickupRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(
                and(
                    gte(bookings.pickup_datetime, todayStart),
                    lte(bookings.pickup_datetime, todayEnd),
                    sql`booking_status IN ('pending', 'pending_balance', 'confirmed')`
                )
            );

        const pickupToday = Number(pickupRes[0]?.count ?? 0);

        // 4. ต้องคืนรถวันนี้
        const returnRes = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(
                and(
                    gte(bookings.expected_return_datetime, todayStart),
                    lte(bookings.expected_return_datetime, todayEnd),
                    eq(bookings.booking_status, "picked_up")
                )
            );

        const returnToday = Number(returnRes[0]?.count ?? 0);

        // Response
        return NextResponse.json({
            success: true,
            data: {
                availableCars,
                rentedCars,
                pickupToday,
                returnToday,
                timestamp: now.toISOString(),
                // ข้อมูล debug timezone (เอาไว้ตรวจสอบปัญหาได้)
                debugTimezone: {
                    nowLocal: now.toLocaleString("th-TH"),
                    todayStart: todayStart.toISOString(),
                    todayEnd: todayEnd.toISOString(),
                    offsetUsed: todayStart.getTimezoneOffset(),
                },
            },
        });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("[Dashboard Stats] Error:", error);
        return NextResponse.json(
            {
                success: false,
                message: "เกิดข้อผิดพลาดในการดึงข้อมูลแดชบอร์ด",
                error: error?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}