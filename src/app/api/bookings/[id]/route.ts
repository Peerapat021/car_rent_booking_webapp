import { db } from "@/lib/db";
import { bookings, cars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";

/* ===================== GET: ดึงรายละเอียดการจอง ===================== */
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // เช็ค session — ต้อง login ก่อนถึงจะดูรายละเอียดได้
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return Response.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const params = await context.params;
    const bookingId = Number(params.id);

    if (isNaN(bookingId)) {
        return Response.json({ error: "รหัสการจองไม่ถูกต้อง" }, { status: 400 });
    }

    try {
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

        // เช็คว่าเป็นเจ้าของ booking หรือไม่
        if (result[0].user_id !== Number(session.user.id)) {
            return Response.json({ error: "ไม่มีสิทธิ์เข้าถึงการจองนี้" }, { status: 403 });
        }

        // ส่ง object เดียว (ไม่ใช่ array)
        return Response.json(result[0]);
    } catch (error) {
        console.error("Get booking by id error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลการจองได้", { status: 500 });
    }
}


export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
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
        // เช็คว่าเป็นเจ้าของ booking ก่อนลบ
        const booking = await db
            .select({ user_id: bookings.user_id })
            .from(bookings)
            .where(eq(bookings.booking_id, bookingId))
            .limit(1);

        if (booking.length === 0) {
            return new Response("Booking not found", { status: 404 });
        }

        if (booking[0].user_id !== Number(session.user.id)) {
            return new Response("ไม่มีสิทธิ์ลบการจองนี้", { status: 403 });
        }

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