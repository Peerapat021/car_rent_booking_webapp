// app/api/ฟnotifications/[id]/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();

    if (result instanceof Response) {
        return result;
    }
    try {
        const { id } = await params;
        const notificationId = Number(id);

        if (!notificationId || Number.isNaN(notificationId)) {
            return NextResponse.json(
                { error: "invalid id" },
                { status: 400 }
            );
        }

        await db
            .update(notifications)
            .set({ is_read: true })
            .where(eq(notifications.notification_id, notificationId));

        return NextResponse.json({
            success: true,
            message: "อ่านแล้ว",
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "update failed" },
            { status: 500 }
        );
    }
}
