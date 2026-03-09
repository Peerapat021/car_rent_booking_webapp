// src/app/api/dashboard-stats/recent/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { bookings, users, cars } from "@/lib/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";

export async function GET() {

    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);
        if (!session?.user || !["staff", "admin"].includes(session.user.role ?? "")) {
            return NextResponse.json(
                { success: false, message: "ไม่ได้รับอนุญาต (เฉพาะ Staff/Admin)" },
                { status: 401 }
            );
        }

        const recentBookings = await db
            .select({
                id: bookings.booking_id,
                customerName: sql<string>`COALESCE(${users.name}, ${users.email}, 'ไม่ระบุชื่อ')`,
                contactName: sql<string>`COALESCE(${bookings.contact_name}, ${bookings.contact_email}, 'ไม่ระบุชื่อ')`,
                contactPhone: sql<string>`COALESCE(${bookings.contact_phone}, 'ไม่ระบุเบอร์โทรศัพท์')`,
                carName: sql<string>`
                    CONCAT(
                    COALESCE(${cars.car_brand}, ''),
                    ' ',
                    COALESCE(${cars.car_model}, ''),
                    ' (',
                    COALESCE(${cars.car_license_plate}, '-'),
                    ')'
                    )
                    `,
                pickupDate: bookings.pickup_datetime,
                amount: bookings.booking_total_price,
                status: bookings.booking_status,
                createdAt: bookings.created_at_booking,
            })
            .from(bookings)
            .leftJoin(users, eq(bookings.user_id, users.id))
            .leftJoin(cars, eq(bookings.car_id, cars.car_id))
            .where(
                inArray(bookings.booking_status, [
                    "pending",
                    "pending_balance",
                    "confirmed",
                    "picked_up",
                    "returned",
                    "completed",
                ])
            )
            .orderBy(desc(bookings.created_at_booking))
            .limit(10);

        return NextResponse.json({
            success: true,
            data: recentBookings.map((b) => ({
                ...b,
                amount: Number(b.amount),
            })),
        });
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("[Recent Bookings API] Error:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูลการจองล่าสุด", error: error?.message },
            { status: 500 }
        );
    }
}