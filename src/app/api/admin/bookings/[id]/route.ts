// src/app/api/bookings/[id]/route.ts

import { db } from "@/lib/db";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { bookings, cars, notifications, notificationLogs } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

/* ===================== GET: ดึงรายละเอียดการจอง ===================== */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {

    const params = await context.params;
    const bookingId = Number(params.id);

    if (isNaN(bookingId)) {
        return Response.json({ error: "รหัสการจองไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        await requireAdmin();
        const result = await db
            .select({
                // field จาก bookings
                booking_id: bookings.booking_id,
                user_id: bookings.user_id,
                car_id: bookings.car_id,
                booking_start_date: bookings.booking_start_date,
                booking_end_date: bookings.booking_end_date,
                pickup_datetime: bookings.pickup_datetime,
                expected_return_datetime: bookings.expected_return_datetime,
                actual_return_datetime: bookings.actual_return_datetime,
                pickup_by: bookings.pickup_by,
                returned_by: bookings.returned_by,
                rental_amount: bookings.rental_amount,
                deposit_amount: bookings.deposit_amount,
                insurance_amount: bookings.insurance_amount,
                discount_coupon: bookings.discount_coupon,
                discount_promo: bookings.discount_promo,
                total_discount: bookings.total_discount,
                coupon_id: bookings.coupon_id,
                promo_id: bookings.promo_id,
                booking_total_price: bookings.booking_total_price,
                contact_name: bookings.contact_name,
                contact_email: bookings.contact_email,
                contact_phone: bookings.contact_phone,
                special_request: bookings.special_request,
                internal_note: bookings.internal_note,
                booking_status: bookings.booking_status,
                created_at_booking: bookings.created_at_booking,

                // field จาก cars (join เพื่อให้ frontend ได้ข้อมูลรถ)
                car_brand: cars.car_brand,
                car_model: cars.car_model,
                car_license_plate: cars.car_license_plate,
                car_year: cars.car_year,
                car_color: cars.car_color,
            })
            .from(bookings)
            .innerJoin(cars, eq(bookings.car_id, cars.car_id))  // join กับ cars
            .where(eq(bookings.booking_id, bookingId))
            .limit(1);

        if (result.length === 0) {
            return Response.json({ error: "ไม่พบการจอง" }, { status: 404 });
        }

        // ส่ง object เดียว (ไม่ใช่ array)
        return Response.json(result[0]);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get booking by id error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลการจองได้", { status: 500 });
    }
}

/* ===================== PATCH: เปลี่ยนสถานะ ===================== */
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params;
    const bookingId = Number(params.id);

    if (isNaN(bookingId)) {
        return Response.json({ error: "รหัสไม่ถูกต้อง" }, { status: 400 });
    }

    const { status } = await req.json();

    if (!["pending", "pending_balance", "confirmed", "cancelled"].includes(status)) {
        return Response.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    try {
        await requireAdmin();
        await db.transaction(async (tx) => {

            // =========================
            // โหลด booking ก่อน
            // =========================
            const [booking] = await tx
                .select()
                .from(bookings)
                .where(eq(bookings.booking_id, bookingId));

            if (!booking) {
                throw new Error("Booking not found");
            }

            if (!booking.user_id) {
                throw new Error("Booking ไม่มี user_id");
            }

            // =========================
            // update status
            // =========================
            await tx
                .update(bookings)
                .set({ booking_status: status })
                .where(eq(bookings.booking_id, bookingId));

            // =========================
            // map status → notification
            // =========================
            let notifType: any = "system";
            let title = "อัปเดตสถานะการจอง";
            let message = `สถานะการจอง ${bookingId} ถูกอัปเดตเป็น ${status}`;

            if (status === "confirmed") {
                notifType = "booking_confirmed";
                title = "ยืนยันการจองแล้ว";
                message = `การจองเลขที่ ${bookingId} ได้รับการยืนยันแล้ว`;
            }

            if (status === "cancelled") {
                notifType = "system";
                title = "ยกเลิกการจอง";
                message = `การจองเลขที่ ${bookingId} ถูกยกเลิก`;
            }

            // =========================
            // create notification
            // =========================
            const [notif] = await tx
                .insert(notifications)
                .values({
                    user_id: booking.user_id,
                    booking_id: bookingId,
                    title,
                    message,
                    notif_type: notifType,
                    notif_priority: "normal",
                    is_read: false,
                })
                .$returningId();

            // =========================
            // create notification log
            // =========================
            await tx.insert(notificationLogs).values({
                notification_id: notif.notification_id,
                user_id: booking.user_id,
                booking_id: bookingId,
                notif_type: notifType,
                notif_channel: "dashboard",
                notif_status: "success",
                notif_payload: JSON.stringify({
                    title,
                    message,
                }),
                notif_sent_at: new Date(),
            });

        });

        return Response.json({ success: true });

    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("PATCH booking status error:", error);

        return Response.json(
            { error: "อัปเดตสถานะไม่สำเร็จ" },
            { status: 500 }
        );
    }
}


/* ===================== PUT: แก้ข้อมูลการจอง ===================== */
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();

    if (result instanceof Response) {
        return result;
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const params = await context.params;
    const bookingId = Number(params.id);

    if (isNaN(bookingId)) {
        return new Response("Invalid id", { status: 400 });
    }

    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.booking_start_date)
        updateData.booking_start_date = new Date(body.booking_start_date);

    if (body.booking_end_date)
        updateData.booking_end_date = new Date(body.booking_end_date);

    if (body.booking_total_price !== undefined)
        updateData.booking_total_price = body.booking_total_price.toString();

    if (body.pickup_branch_id !== undefined)
        updateData.pickup_branch_id = body.pickup_branch_id;

    if (body.return_branch_id !== undefined)
        updateData.return_branch_id = body.return_branch_id;

    if (body.contact_name) updateData.contact_name = body.contact_name;
    if (body.contact_email) updateData.contact_email = body.contact_email;
    if (body.contact_phone) updateData.contact_phone = body.contact_phone;

    if (Object.keys(updateData).length === 0) {
        return new Response("No data to update", { status: 400 });
    }

    try {
        const result = await db
            .update(bookings)
            .set(updateData)
            .where(eq(bookings.booking_id, bookingId));

        if (result[0]?.affectedRows === 0) {
            return new Response("Booking not found", { status: 404 });
        }

        return Response.json({ message: "Booking updated" });
    } catch (error) {
        console.error("PUT booking error:", error);
        return new Response("Update failed", { status: 500 });
    }
}

/* ===================== DELETE ===================== */
export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const result = await requireAdmin();

    if (result instanceof Response) {
        return result;
    }
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const params = await context.params;
    const bookingId = Number(params.id);

    if (isNaN(bookingId)) {
        return new Response("Invalid id", { status: 400 });
    }

    try {
        const result = await db
            .delete(bookings)
            .where(eq(bookings.booking_id, bookingId));

        if (result[0]?.affectedRows === 0) {
            return new Response("Booking not found", { status: 404 });
        }

        return Response.json({ message: "Booking deleted" });
    } catch (error) {
        console.error("DELETE booking error:", error);
        return new Response("Delete failed", { status: 500 });
    }
}