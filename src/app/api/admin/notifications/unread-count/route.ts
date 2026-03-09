import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(request: NextRequest) {
    await requireAdmin();

    try {
        const unreadNotifications = await db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.is_read, false),
                    inArray(notifications.notif_type, [
                        "booking_created",
                        "pickup_reminder",
                        "return_reminder",
                        "overdue",
                        "payment_success",
                        "refund",
                        "maintenance",
                    ])
                )
            );
        return NextResponse.json({
            unread: unreadNotifications.length,
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/notifications error:", error);
        return new NextResponse("ไม่สามารถโหลดการแจ้งเตือนได้", { status: 500 });
    }
}
