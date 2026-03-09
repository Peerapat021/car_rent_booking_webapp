import { db } from "@/lib/db";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdmin();

    const { id } = await params;
    const booking_id = Number(id);

    return await db.transaction(async (tx) => {
        const [booking] = await tx
            .select()
            .from(bookings)
            .where(eq(bookings.booking_id, booking_id));

        if (!booking) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        if (booking.pickup_datetime) {
            return NextResponse.json({ error: "Already picked up" }, { status: 400 });
        }

        await tx.update(bookings)
            .set({
                pickup_datetime: new Date(),
                booking_status: "picked_up",
            })
            .where(eq(bookings.booking_id, booking_id));

        return NextResponse.json({ success: true });
    });
}