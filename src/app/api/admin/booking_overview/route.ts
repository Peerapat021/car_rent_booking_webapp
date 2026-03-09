

import { db } from "@/lib/db";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { bookings, users, cars, payments, car_classes, notifications, notificationLogs } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";
import { notFound } from "next/navigation";

export async function GET(request: Request) {

  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("id");

    const query = db
      .select({
        // ข้อมูลหลักของ booking
        booking_id: bookings.booking_id,
        booking_status: bookings.booking_status,

        // วันที่สำคัญ (ทั้งแบบจองและแบบจริง)
        booking_start_date: bookings.booking_start_date,
        booking_end_date: bookings.booking_end_date,
        pickup_datetime: bookings.pickup_datetime,
        expected_return_datetime: bookings.expected_return_datetime,
        actual_return_datetime: bookings.actual_return_datetime,

        // ข้อมูลลูกค้า
        customer_name: users.name,
        customer_phone: users.user_phone,
        customer_email: users.email,
        contact_name: bookings.contact_name,
        contact_phone: bookings.contact_phone,
        contact_email: bookings.contact_email,

        // ข้อมูลรถ
        car_id: cars.car_id,
        car_brand: cars.car_brand,
        car_model: cars.car_model,
        car_license_plate: cars.car_license_plate,
        car_color: cars.car_color,
        car_class_name: car_classes.class_name,

        // ยอดเงินต่าง ๆ (จาก bookings)
        deposit_amount: bookings.deposit_amount,
        rental_amount: bookings.rental_amount,
        insurance_amount: bookings.insurance_amount,
        discount_coupon: bookings.discount_coupon,
        discount_promo: bookings.discount_promo,
        total_discount: bookings.total_discount,
        booking_total_price: bookings.booking_total_price,

        // ค่าปรับ/เพิ่มเติม 
        late_fee: bookings.late_fee,
        cancellation_fee_amount: bookings.cancellation_fee_amount,
        no_show_fee_amount: bookings.no_show_fee_amount,
        damage_fee: bookings.damage_fee,
        insurance_deducted: bookings.insurance_deducted,
        insurance_refund_amount: bookings.insurance_refund_amount,

        internal_note: bookings.internal_note,
        special_request: bookings.special_request,

        // total_paid: นับเฉพาะ 'deposit', 'full', 'remaining' ที่ status='paid'
        total_paid: sql<number>`
          COALESCE(
            SUM(
              CASE 
                WHEN ${payments.payment_status} = 'paid' 
                  AND ${payments.payment_type} IN ('deposit', 'full', 'remaining')
                THEN ${payments.payment_amount} 
                ELSE 0 
              END
            ), 
            0
          )
        `,

        paid_insurance_total: sql<number>`
        COALESCE(
          SUM(
            CASE 
              WHEN ${payments.payment_status} = 'paid' 
                AND ${payments.payment_type} = 'insurance'
              THEN ${payments.payment_amount} 
              ELSE 0 
            END
          ), 
          0
        )
      `,

        // remaining_amount: booking_total_price - total_paid (เฉพาะประเภทที่เกี่ยวข้อง)
        remaining_amount: sql<number>`
          ${bookings.booking_total_price}
          -
          COALESCE(
            SUM(
              CASE 
                WHEN ${payments.payment_status} = 'paid' 
                  AND ${payments.payment_type} IN ('deposit', 'full', 'remaining')
                THEN ${payments.payment_amount} 
                ELSE 0 
              END
            ), 
            0
          )
        `,

        // วิธีชำระเงิน (distinct + เรียงตามเวลา) 
        payment_methods_str: sql<string>`
          COALESCE(
            GROUP_CONCAT(
              DISTINCT 
              CASE 
                WHEN ${payments.payment_status} = 'paid'
                THEN ${payments.payment_method}
                ELSE NULL
              END
              ORDER BY ${payments.paid_at} ASC
              SEPARATOR ', '
            ),
            ''
          )
        `,

        // จำนวน transaction ที่ paid แล้ว
        paid_transaction_count: sql<number>`
          COUNT(
            CASE 
              WHEN ${payments.payment_status} = 'paid' THEN 1 
              ELSE NULL 
            END
          )
        `,
      })
      .from(bookings)
      .leftJoin(users, eq(bookings.user_id, users.id))
      .leftJoin(cars, eq(bookings.car_id, cars.car_id))
      .leftJoin(car_classes, eq(cars.class_id, car_classes.class_id))
      .leftJoin(payments, eq(bookings.booking_id, payments.booking_id));

    if (bookingId) {
      query.where(eq(bookings.booking_id, Number(bookingId)));
    }

    const data = await query
      .groupBy(
        bookings.booking_id,
        users.name,
        users.user_phone,
        users.email,
        cars.car_id,
        cars.car_brand,
        cars.car_model,
        cars.car_license_plate,
        cars.car_color,
        car_classes.class_name,
        bookings.booking_start_date,
        bookings.booking_end_date,
        bookings.pickup_datetime,
        bookings.expected_return_datetime,
        bookings.actual_return_datetime,
        bookings.deposit_amount,
        bookings.rental_amount,
        bookings.insurance_amount,
        bookings.discount_coupon,
        bookings.discount_promo,
        bookings.total_discount,
        bookings.booking_total_price,
        bookings.late_fee,
        bookings.damage_fee,
        bookings.insurance_deducted,
        bookings.insurance_refund_amount,
        bookings.booking_status,
        bookings.internal_note,
        bookings.special_request
        // ไม่ต้อง groupBy payments เพราะใช้ aggregate (SUM, COUNT) แล้ว
      )
      .orderBy(desc(bookings.booking_id));

    // Post-processing เหมือนเดิม
    const processedData = data.map(row => ({
      ...row,
      payment_methods: row.payment_methods_str
        ? row.payment_methods_str
          .split(',')
          .map(m => m.trim())
          .filter(Boolean)
        : [],
      payment_methods_str: undefined,
    }));

    if (bookingId) {
      return NextResponse.json(processedData[0] ?? null);
    }

    return NextResponse.json(processedData);
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
        notFound();
    }
    console.error("Get booking_overview error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถโหลดข้อมูลการจองได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const payload = await req.json();

    const booking_id = Number(payload.booking_id);

    if (!booking_id || isNaN(booking_id)) {
      return NextResponse.json(
        { error: "booking_id เป็นตัวเลขที่ถูกต้อง จำเป็นต้องระบุ" },
        { status: 400 }
      );
    }

    // รายการฟิลด์วันที่ที่อาจต้องแปลงจาก string เป็น Date
    const dateFields = [
      'booking_start_date',
      'booking_end_date',
      'pickup_datetime',
      'expected_return_datetime',
      'actual_return_datetime',
    ] as const;

    // สร้าง object สำหรับอัปเดต โดยแปลงวันที่ให้ถูกต้อง
    const updateData: Record<string, any> = {
      updated_at: new Date(),
    };

    // วนลูปผ่าน payload และจัดการแต่ละฟิลด์
    for (const key in payload) {
      if (key === 'booking_id') continue; // ข้าม booking_id เพราะใช้ใน where

      let value = payload[key];

      // จัดการฟิลด์วันที่
      if (dateFields.includes(key as any) && typeof value === 'string' && value.trim()) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          updateData[key] = date;
        } else {
          // ถ้าเป็นวันที่ไม่ถูกต้อง ให้ข้ามหรือตั้งเป็น null ตามต้องการ
          // ที่นี่เลือกข้ามเพื่อไม่ให้เกิด error
          continue;
        }
      }
      // จัดการฟิลด์ตัวเลขให้เป็น number
      else if (
        [
          'deposit_amount',
          'rental_amount',
          'insurance_amount',
          'discount_coupon',
          'discount_promo',
          'total_discount',
          'booking_total_price',
          'late_fee',
          'damage_fee',
          'insurance_deducted',
          'insurance_refund_amount',
        ].includes(key)
      ) {
        updateData[key] = value != null ? Number(value) : undefined;
      }
      // ฟิลด์อื่น ๆ รับตามที่ส่งมา
      else {
        updateData[key] = value;
      }
    }

    const result = await db.transaction(async (tx) => {
      // ดึงข้อมูล booking เดิมเพื่อตรวจสอบการมีอยู่
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.booking_id, booking_id));

      if (!booking) {
        throw new Error("BOOKING_NOT_FOUND");
      }

      // อัปเดตข้อมูล
      await tx
        .update(bookings)
        .set(updateData)
        .where(eq(bookings.booking_id, booking_id));

      // =====================================
      // EVENT: รับรถ (pickup)
      // =====================================
      // =====================================
      // EVENT: รับรถ (pickup)
      // =====================================
      const isPickupBeingSetNow =
        updateData.pickup_datetime instanceof Date &&
        !isNaN(updateData.pickup_datetime.getTime());

      const hadNoPickupBefore =
        !booking.pickup_datetime ||
        booking.pickup_datetime.getTime() === 0;  // ป้องกันกรณีวันที่ invalid หรือ epoch

      if (isPickupBeingSetNow && hadNoPickupBefore) {
        console.log(`[NOTIF PICKUP] Triggering for booking ${booking_id} at ${updateData.pickup_datetime.toISOString()}`);

        const title = "รับรถเรียบร้อยแล้ว";
        const message = `การจองเลขที่ ${booking_id} รับรถเรียบร้อยแล้ว ขอให้เดินทางปลอดภัย`;

        if (!booking.user_id) {
          console.warn(`[NOTIF PICKUP] Skip: No user_id for booking ${booking_id}`);
          // หรือ throw new Error ถ้าต้องการบังคับ
        } else {
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
            .$returningId();  // ใช้ $returningId() ถ้า driver รองรับ

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

          console.log(`[NOTIF PICKUP] Created notification ID ${notif.notification_id}`);
        }
      } else if (isPickupBeingSetNow) {
        console.log(`[NOTIF PICKUP] Skip: Already had pickup_datetime before for ${booking_id}`);
      } else {
        console.log(`[NOTIF PICKUP] Skip: No pickup_datetime in this update for ${booking_id}`);
      }

      // =====================================
      // EVENT: คืนรถ (return)
      // =====================================
      const isNewReturn =
        !booking.actual_return_datetime &&
        updateData.actual_return_datetime instanceof Date;

      if (isNewReturn) {
        const hasExtraCost =
          Number(updateData.late_fee || 0) > 0 ||
          Number(updateData.damage_fee || 0) > 0;
          

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
    if (error instanceof Error && error.message === "FORBIDDEN") {
        notFound();
    }
    console.error("PUT /api/booking_overview error:", error);

    if (error.message === "BOOKING_NOT_FOUND") {
      return NextResponse.json(
        { message: "ไม่พบการจองที่ระบุ" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล",
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
