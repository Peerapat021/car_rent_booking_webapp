// src/app/app/api/booking_overview/calendar/route.ts

import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { NextRequest, NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/services/client/admin/calendar/get";
import { z } from "zod";
import { notFound } from "next/navigation";

const querySchema = z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ start ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)"),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ end ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD)").optional(),
    branchId: z.coerce.number().int().positive().optional(),
    statuses: z.string().optional(), // เช่น "confirmed,picked_up,pending"
});

export async function GET(request: NextRequest) {

    try {
        await requireAdmin();

        const searchParams = request.nextUrl.searchParams;

        const parsed = querySchema.safeParse({
            start: searchParams.get("start"),
            end: searchParams.get("end") ?? undefined,
            branchId: searchParams.get("branchId") ?? undefined,
            statuses: searchParams.get("statuses") ?? undefined,
        });

        if (!parsed.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: "พารามิเตอร์ไม่ถูกต้อง",
                    details: parsed.error.format(),
                },
                { status: 400 }
            );
        }

        const { start, end = start, branchId, statuses } = parsed.data;

        const statusArray = statuses
            ? statuses.split(",").map(s => s.trim()).filter(Boolean)
            : ["pending", "pending_balance", "confirmed", "picked_up"];

        const events = await getCalendarEvents({
            start,
            end,
            branchId,
            statuses: statusArray as any,
        });

        return NextResponse.json({
            success: true,
            events,
            meta: {
                range: `${start} ถึง ${end}`,
                total: events.length,
            },
        });
    } catch (err: any) {
        if (err instanceof Error && err.message === "FORBIDDEN") {
            notFound();
        }
        console.error("[CALENDAR API ERROR]", err);
        return NextResponse.json(
            { success: false, error: err.message || "เกิดข้อผิดพลาดภายใน" },
            { status: 500 }
        );
    }
}