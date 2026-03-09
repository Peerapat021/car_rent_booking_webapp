// app/api/admin/notifications/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { notFound } from "next/navigation";

// ======================== GET: ดึงการแจ้งเตือน ========================
export async function GET(request: NextRequest) {

    try {
        await requireAdmin();
        const allNotifications = await db.select().from(notifications).orderBy(sql`${notifications.notification_id} DESC`);
        return NextResponse.json(allNotifications, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("GET /api/notifications error:", error);
        return new NextResponse("ไม่สามารถโหลดการแจ้งเตือนได้", { status: 500 });
    }
}
