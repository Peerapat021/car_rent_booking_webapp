

import { db } from "@/lib/db";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { bookings, users, cars, payments, notifications, notificationLogs } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();

    if (result instanceof Response) {
        return result;
    }
    try {
        const booking_id = Number((await params).id);
        const payload = await req.json();

        const result = await db.transaction(async (tx) => {
            // ✅ ดึง booking เดิม
            const [booking] = await tx
                .select()
                .from(bookings)
                .where(eq(bookings.booking_id, booking_id));

            if (!booking) {
                throw new Error("BOOKING_NOT_FOUND");
            }

            // ✅ update booking
            await tx
                .update(bookings)
                .set({
                    ...payload,
                    updated_at: new Date(),
                })
                .where(eq(bookings.booking_id, booking_id));

            // =====================================
            // 🚗 PICKUP EVENT (รับรถ)
            // =====================================
            const isNewPickup =
                !booking.pickup_datetime &&
                payload.force_pickup_notification;

            if (isNewPickup) {
                const title = "รับรถเรียบร้อยแล้ว";
                const message = `การจองเลขที่ ${booking_id} รับรถเรียบร้อยแล้ว ขอให้เดินทางปลอดภัย`;

                if (!booking.user_id) {
                    throw new Error("Booking ไม่มี user_id");
                }

                const [notif] = await tx
                    .insert(notifications)
                    .values({
                        user_id: booking.user_id,
                        booking_id,
                        title,
                        message,
                        notif_type: "system",
                        notif_priority: "normal",
                        is_read: false,
                    })
                    .$returningId();

                await tx.insert(notificationLogs).values({
                    notification_id: notif.notification_id,
                    user_id: booking.user_id,
                    booking_id,
                    notif_type: "pickup_completed",
                    notif_channel: "dashboard",
                    notif_status: "success",
                    notif_payload: JSON.stringify({ title, message }),
                    notif_sent_at: new Date(),
                });
            }

            // =====================================
            // 🚗 RETURN EVENT (คืนรถ)
            // =====================================
            const isNewReturn =
                !booking.actual_return_datetime &&
                payload.actual_return_datetime;

            if (isNewReturn) {
                const hasExtraCost =
                    Number(payload.late_fee || 0) > 0 ||
                    Number(payload.damage_fee || 0) > 0;

                const title = "คืนรถเรียบร้อยแล้ว";

                const message = hasExtraCost
                    ? `การจองเลขที่ ${booking_id} คืนรถแล้ว มีค่าปรับเพิ่มเติม กรุณาตรวจสอบยอด`
                    : `การจองเลขที่ ${booking_id} คืนรถเรียบร้อยแล้ว ขอบคุณที่ใช้บริการ`;

                if (!booking.user_id) {
                    throw new Error("Booking ไม่มี user_id");
                }

                const [notif] = await tx
                    .insert(notifications)
                    .values({
                        user_id: booking.user_id,
                        booking_id,
                        title,
                        message,
                        notif_type: "system",
                        notif_priority: "normal",
                        is_read: false,
                    })
                    .$returningId();

                await tx.insert(notificationLogs).values({
                    notification_id: notif.notification_id,
                    user_id: booking.user_id,
                    booking_id,
                    notif_type: "return_completed",
                    notif_channel: "dashboard",
                    notif_status: "success",
                    notif_payload: JSON.stringify({ title, message }),
                    notif_sent_at: new Date(),
                });
            }

            return { success: true };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error(error);

        if (error.message === "BOOKING_NOT_FOUND") {
            return NextResponse.json(
                { message: "Booking not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const result = await requireAdmin();

    if (result instanceof Response) {
        return result;
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));

        if (!id) {
            return NextResponse.json(
                { error: 'ต้องระบุ booking_id' },
                { status: 400 }
            );
        }

        const [booking] = await db
            .select()
            .from(bookings)
            .where(eq(bookings.booking_id, id));

        if (!booking) {
            return NextResponse.json(
                { error: 'ไม่พบการจอง' },
                { status: 404 }
            );
        }

        // ห้ามลบถ้ามีการรับรถแล้ว
        if (booking.pickup_datetime) {
            return NextResponse.json(
                { error: 'ไม่สามารถลบการจองที่รับรถแล้ว' },
                { status: 400 }
            );
        }

        await db.delete(payments).where(eq(payments.booking_id, id));
        await db.delete(bookings).where(eq(bookings.booking_id, id));

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'ลบไม่สำเร็จ' },
            { status: 500 }
        );
    }
}
