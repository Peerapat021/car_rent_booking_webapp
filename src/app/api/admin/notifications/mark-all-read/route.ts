import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

export async function PATCH(request: NextRequest) {
    try {
        await requireAdmin();
        await db
            .update(notifications)
            .set({ is_read: true })
            .where(eq(notifications.is_read, false));

        return NextResponse.json({
            success: true,
            message: "อ่านทั้งหมดแล้ว",
        });

    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error(error);

        return NextResponse.json(
            { error: "update all failed" },
            { status: 500 }
        );
    }
}
