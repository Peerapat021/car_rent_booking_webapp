import { db } from "@/lib/db";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { bookings, systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();

    const { id } = await params;
    const bookingId = Number(id);

    return await db.transaction(async (tx) => {

        const [booking] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.booking_id, bookingId));

        if (!booking) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        // 🔒 กัน null ชัด ๆ
        if (!booking.booking_status) {
            return NextResponse.json(
                { error: "Invalid booking status" },
                { status: 400 }
            );
        }

        if (booking.booking_status === "no_show") {
            return NextResponse.json(
                { error: "Already marked no-show" },
                { status: 400 }
            );
        }

        if (
            ["picked_up", "returned", "completed", "cancelled"]
                .includes(booking.booking_status)
        ) {
            return NextResponse.json(
                { error: "Invalid status for no-show" },
                { status: 400 }
            );
        }

        const [sys] = await tx.select().from(systemSettings);

        if (!sys) {
            return NextResponse.json(
                { error: "System settings missing" },
                { status: 500 }
            );
        }

        const noShowFee = Number(sys.no_show_fee ?? 0);
        const basePrice = Number(booking.booking_total_price ?? 0);
        const totalPaid = Number(booking.total_paid ?? 0);

        const finalTotal = basePrice + noShowFee;

        let remaining = finalTotal - totalPaid;

        // 🔒 กันติดลบ
        if (remaining < 0) remaining = 0;

        await tx.update(bookings)
            .set({
                no_show_fee_amount: noShowFee.toFixed(2),
                cancellation_fee_amount: "0.00",
                late_fee: "0.00",
                damage_fee: "0.00",
                remaining_amount: remaining.toFixed(2),
                booking_status: "no_show",
            })
            .where(eq(bookings.booking_id, bookingId));

        return NextResponse.json({
            success: true,
            no_show_fee_amount: noShowFee,
            remaining_amount: remaining,
        });
    });
}