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
    const body = await req.json();

    return await db.transaction(async (tx) => {
        // 🔹 ดึง booking
        const [booking] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.booking_id, bookingId));

        if (!booking)
            return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (booking.actual_return_datetime)
            return NextResponse.json({ error: "Already returned" }, { status: 400 });

        // 🔹 ต้องมีเวลาคืนจริง
        if (!body.actual_return_datetime)
            return NextResponse.json(
                { error: "Missing actual return date" },
                { status: 400 }
            );

        const actualReturn = new Date(body.actual_return_datetime);

        if (isNaN(actualReturn.getTime()))
            return NextResponse.json(
                { error: "Invalid actual return date" },
                { status: 400 }
            );

        // 🔹 หา expected return date
        const expectedReturnDate =
            booking.expected_return_datetime || booking.booking_end_date;

        if (!expectedReturnDate)
            return NextResponse.json(
                { error: "Missing expected return date" },
                { status: 400 }
            );

        const expected = new Date(expectedReturnDate);

        // 🔹 ดึง system setting
        const [sys] = await tx.select().from(systemSettings);
        if (!sys)
            return NextResponse.json(
                { error: "System settings missing" },
                { status: 500 }
            );

        // ===============================
        // 🔥 คำนวณ Late Fee รายชั่วโมง
        // ===============================
        let lateFee = 0;

        if (actualReturn > expected) {
            const diffMs = actualReturn.getTime() - expected.getTime();
            const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
            lateFee = diffHours * Number(sys.late_fee_per_hour);
        }

        // 🔹 Damage Fee
        const damageFee = Number(body.damage_fee ?? 0);
        if (isNaN(damageFee) || damageFee < 0)
            return NextResponse.json(
                { error: "Invalid damage fee" },
                { status: 400 }
            );

        // 🔹 คำนวณยอดรวมใหม่
        const basePrice = Number(booking.booking_total_price ?? 0);
        const totalPaid = Number(booking.total_paid ?? 0);
        const cancellationFee = Number(booking.cancellation_fee_amount ?? 0);
        const noShowFee = Number(booking.no_show_fee_amount ?? 0);

        const finalTotal =
            basePrice +
            lateFee +
            damageFee +
            cancellationFee +
            noShowFee;

        const remaining = finalTotal - totalPaid;

        // 🔹 จัดการเงินประกัน
        const deposit = Number(booking.deposit_amount ?? 0);

        let insuranceDeducted = 0;
        let insuranceRefund = deposit;

        if (damageFee > 0) {
            insuranceDeducted = Math.min(damageFee, deposit);
            insuranceRefund = deposit - insuranceDeducted;
        }

        // 🔹 อัปเดต booking
        await tx
            .update(bookings)
            .set({
                actual_return_datetime: actualReturn,
                late_fee: lateFee.toString(),
                damage_fee: damageFee.toString(),
                remaining_amount: remaining.toString(),
                insurance_deducted: insuranceDeducted.toString(),
                insurance_refund_amount: insuranceRefund.toString(),
                booking_status: "completed",
            })
            .where(eq(bookings.booking_id, bookingId));

        return NextResponse.json({
            success: true,
            late_fee: lateFee,
            damage_fee: damageFee,
            remaining_amount: remaining,
            insurance_deducted: insuranceDeducted,
            insurance_refund_amount: insuranceRefund,
        });
    });
}