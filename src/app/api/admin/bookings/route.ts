// app/api/bookings/route.ts
import { db } from "@/lib/db";
import {
    bookings,
    couponUsages,
    coupons,
    notifications,
    notificationLogs,
    systemSettings,
} from "@/lib/db/schema";

import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();

        const allBookings = await db
            .select()
            .from(bookings)
            .orderBy(desc(bookings.booking_id));

        return Response.json(allBookings);

    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error("Get bookings error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลการจองได้", { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return new Response("Unauthorized - กรุณาเข้าสู่ระบบ", { status: 401 });
    }

    const userId = Number(session.user.id);
    const body = await request.json();

    const {
        car_id,
        booking_start_date,
        booking_end_date,
        pickup_datetime,
        expected_return_datetime,
        pickup_by,
        rental_amount,
        deposit_amount,
        insurance_amount,
        late_fee = "0",
        damage_fee = "0",
        insurance_deducted = "0",
        insurance_refund_amount = "0",
        discount_coupon = "0",
        discount_promo = "0",
        total_discount = "0",
        coupon_id,
        promo_id,
        booking_total_price,
        total_paid,
        remaining_amount,
        contact_name,
        contact_email,
        contact_phone,
        special_request,
        internal_note,
    } = body;

    const requiredFields = [
        "car_id",
        "booking_start_date",
        "booking_end_date",
        "rental_amount",
        "deposit_amount",
        "insurance_amount",
        "booking_total_price",
        "contact_name",
        "contact_phone",
    ];

    const missing = requiredFields.filter((field) => !body[field] && body[field] !== 0);

    const settings = await db.query.systemSettings.findFirst();
    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
    });

    if (missing.length > 0) {
        return Response.json(
            {
                success: false,
                message: `ข้อมูลไม่ครบถ้วน กรุณากรอก: ${missing.join(", ")}`,
            },
            { status: 400 }
        );
    }


    if (settings?.enforce_deposit && Number(deposit_amount) <= 0) {
        return Response.json(
            { success: false, message: "ระบบบังคับเก็บค่ามัดจำ" },
            { status: 400 }
        );
    }

    if (settings?.min_renter_age) {
        if (!user?.birth_date) {
            return Response.json(
                { success: false, message: "กรุณากรอกวันเกิด" },
                { status: 400 }
            );
        }

        const age =
            new Date().getFullYear() -
            new Date(user.birth_date).getFullYear();

        if (age < settings.min_renter_age) {
            return Response.json(
                { success: false, message: "อายุไม่ถึงขั้นต่ำที่กำหนด" },
                { status: 400 }
            );
        }
    }

    try {
        await requireAdmin();
        const result = await db.transaction(async (tx) => {

            // ✅ สร้าง booking (บังคับ pending เท่านั้น)
            const [inserted] = await tx
                .insert(bookings)
                .values({
                    user_id: userId,
                    car_id: Number(car_id),
                    booking_start_date: new Date(booking_start_date),
                    booking_end_date: new Date(booking_end_date),
                    pickup_datetime: pickup_datetime ? new Date(pickup_datetime) : null,
                    expected_return_datetime: expected_return_datetime
                        ? new Date(expected_return_datetime)
                        : null,
                    pickup_by: pickup_by ? Number(pickup_by) : null,

                    rental_amount: String(rental_amount),
                    deposit_amount: String(deposit_amount),
                    insurance_amount: String(insurance_amount),
                    late_fee: String(late_fee),
                    damage_fee: String(damage_fee),
                    insurance_deducted: String(insurance_deducted),
                    insurance_refund_amount: String(insurance_refund_amount),

                    discount_coupon: String(discount_coupon),
                    discount_promo: String(discount_promo),
                    total_discount: String(total_discount),

                    coupon_id: coupon_id ? Number(coupon_id) : null,
                    promo_id: promo_id ? Number(promo_id) : null,

                    booking_total_price: String(booking_total_price),
                    total_paid: String(total_paid),
                    remaining_amount: String(remaining_amount),

                    contact_name: String(contact_name).trim(),
                    contact_email: String(contact_email).trim(),
                    contact_phone: String(contact_phone).trim(),
                    special_request: special_request ? String(special_request).trim() : null,
                    internal_note: internal_note ? String(internal_note).trim() : null,
                    
                    booking_status: "pending",
                })
                .$returningId();

            // ✅ สร้าง notification
            const [notif] = await tx
                .insert(notifications)
                .values({
                    user_id: userId,
                    booking_id: inserted.booking_id,
                    title: "สร้างการจองสำเร็จ",
                    message: `การจองเลขที่ ${inserted.booking_id} ถูกสร้างเรียบร้อยแล้ว`,
                    notif_type: "booking_created",
                    notif_priority: "normal",
                    is_read: false,
                })
                .$returningId();


            // ✅ log การส่ง dashboard (ถือว่าส่งทันที)
            await tx.insert(notificationLogs).values({
                notification_id: notif.notification_id,
                user_id: userId,
                booking_id: inserted.booking_id,

                notif_type: "booking_created",
                notif_channel: "dashboard",
                notif_status: "success",

                notif_payload: JSON.stringify({
                    title: "สร้างการจองสำเร็จ",
                }),

                notif_sent_at: new Date(),
            });


            // ✅ coupon usage
            if (coupon_id) {
                const couponIdNum = Number(coupon_id);

                await tx.insert(couponUsages).values({
                    coupon_id: couponIdNum,
                    user_id: userId,
                    booking_id: inserted.booking_id,
                    used_at: new Date(),
                });

                await tx
                    .update(coupons)
                    .set({
                        used_count: sql`${coupons.used_count} + 1`,
                    })
                    .where(eq(coupons.coupon_id, couponIdNum));
            }

            const [newBooking] = await tx
                .select()
                .from(bookings)
                .where(eq(bookings.booking_id, inserted.booking_id));

            return newBooking;
        });

        return Response.json(result, { status: 201 });

    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }

        console.error("POST /api/bookings error:", error);

        return Response.json(
            {
                success: false,
                message: "ไม่สามารถสร้างการจองได้",
                error: error.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
            },
            { status: 500 }
        );
    }
}
