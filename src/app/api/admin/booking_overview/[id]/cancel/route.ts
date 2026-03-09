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

        if (!booking)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (
            booking.booking_status &&
            ["picked_up", "returned", "completed"].includes(booking.booking_status)
        ) {
            return NextResponse.json(
                { error: "Cannot cancel after pickup" },
                { status: 400 }
            );
        }

        if (
            ["picked_up", "returned", "completed"].includes(
                booking.booking_status ?? ""
            )
        ) {
            return NextResponse.json(
                { error: "Cannot cancel after pickup" },
                { status: 400 }
            );
        }
        if (booking.booking_status === "cancelled")
            return NextResponse.json({ error: "Already cancelled" }, { status: 400 });

        const [sys] = await tx.select().from(systemSettings);

        if (!sys)
            return NextResponse.json({ error: "System settings missing" }, { status: 500 });

        const cancelFee = Number(sys.cancellation_fee);

        const basePrice = Number(booking.booking_total_price);
        const totalPaid = Number(booking.total_paid);

        // 🔥 คำนวณใหม่ทั้งหมด
        const finalTotal =
            basePrice +
            cancelFee;

        const remaining = finalTotal - totalPaid;

        await tx.update(bookings)
            .set({
                cancellation_fee_amount: cancelFee.toString(),
                no_show_fee_amount: "0.00",
                late_fee: "0.00",
                damage_fee: "0.00",
                remaining_amount: remaining.toString(),
                booking_status: "cancelled",
            })
            .where(eq(bookings.booking_id, bookingId));

        return NextResponse.json({
            success: true,
            cancellation_fee_amount: cancelFee,
            remaining_amount: remaining,
        });
    });
}