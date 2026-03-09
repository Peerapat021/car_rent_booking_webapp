// app/api/payments/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { payments, notifications, bookings, notificationLogs, systemSettings } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET() {
    try {
        await requireAdmin();
        const allPayments = await db
            .select()
            .from(payments)
            .orderBy(desc(payments.payment_id));

        return Response.json(allPayments);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get payments error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลได้", { status: 500 });
    }
}

export async function POST(request: NextRequest) {

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return NextResponse.json(
            { error: "Unauthorized - กรุณาเข้าสู่ระบบ" },
            { status: 401 }
        );
    }

    if (!["staff", "admin"].includes(session.user.role || "")) {
        return NextResponse.json(
            { error: "Forbidden - สิทธิ์ไม่เพียงพอ" },
            { status: 403 }
        );
    }

    const body = await request.json();

    const {
        booking_id,
        payment_amount: rawPaymentAmount,
        payment_method,
        payment_type,
        payment_status = "paid",
        paid_at,
        payment_note,
        is_pickup_payment = false,  // flag สำหรับการชำระตอนรับรถ
    } = body;

    const settings = await db.query.systemSettings.findFirst();

    // ตรวจ payment_method ว่าระบบเปิดไว้ไหม
    const methodAllowed = {
        qr: settings?.enable_qr_promptpay ?? false,
        credit_card: settings?.enable_credit_card ?? false,
        cash: settings?.enable_cash ?? false,
    };

    const validMethods = ["qr", "credit_card", "cash"] as const;
    type PaymentMethod = typeof validMethods[number];

    if (!validMethods.includes(payment_method as PaymentMethod)) {
        return NextResponse.json(
            { error: "Invalid payment method" },
            { status: 400 }
        );
    }

    if (!settings) {
        return NextResponse.json(
            { error: "Payment configuration error" },
            { status: 500 }
        );
    }

    if (!methodAllowed[payment_method as PaymentMethod]) {
        return NextResponse.json(
            { error: `วิธีชำระ "${payment_method}" ถูกปิดใช้งานในระบบ` },
            { status: 400 }
        );
    }

    // ตรวจ insurance: ถ้า require_insurance = false แต่ส่ง type = 'insurance' มา
    if (payment_type === 'insurance' && !settings?.require_insurance) {
        return NextResponse.json(
            { error: 'ระบบไม่ได้เปิดใช้งานการเก็บเงินประกัน' },
            { status: 400 }
        );
    }

    if (!rawPaymentAmount || isNaN(rawPaymentAmount) || Number(rawPaymentAmount) <= 0) {
        return NextResponse.json(
            { error: "ยอดชำระไม่ถูกต้อง" },
            { status: 400 }
        );
    }

    if (!payment_type || !["deposit", "full", "insurance", "remaining", "extra", "refund"].includes(payment_type)) {
        return NextResponse.json(
            { error: "ประเภทการชำระไม่ถูกต้อง" },
            { status: 400 }
        );
    }


    const payment_amount = Number(rawPaymentAmount).toFixed(2);
    const now = new Date();

    try {
        await requireAdmin();
        const result = await db.transaction(async (tx) => {
            // 1. บันทึก payment
            const insertPaymentResult = await tx
                .insert(payments)
                .values({
                    booking_id: booking_id ? Number(booking_id) : null,
                    user_id: Number(session.user.id),
                    payment_amount,
                    payment_method,
                    payment_type,
                    payment_status,
                    payment_note,
                    paid_at: paid_at ? new Date(paid_at) : now,
                    payment_created_by: Number(session.user.id),
                });

            const newPaymentId = insertPaymentResult[0].insertId; // MySQL style

            const [newPayment] = await tx
                .select()
                .from(payments)
                .where(eq(payments.payment_id, newPaymentId));

            // 3. แจ้งเตือนชำระเงินสำเร็จให้ลูกค้า (ทุกกรณี)
            let bookingUserId: number | null = null;
            if (newPayment.booking_id) {
                const [booking] = await tx
                    .select({ user_id: bookings.user_id })
                    .from(bookings)
                    .where(eq(bookings.booking_id, newPayment.booking_id));

                bookingUserId = booking?.user_id ?? null;

                if (bookingUserId) {
                    const insertPaymentNotif = await tx
                        .insert(notifications)
                        .values({
                            user_id: bookingUserId,
                            booking_id: newPayment.booking_id,
                            title: "ชำระเงินสำเร็จ",
                            message: `ระบบได้รับการชำระเงิน ${Number(newPayment.payment_amount).toLocaleString()} บาท (${payment_type})`,
                            notif_type: "payment_success",
                            notif_priority: "normal",
                            is_read: false,
                        });

                    const paymentNotifId = insertPaymentNotif[0].insertId;

                    await tx.insert(notificationLogs).values({
                        notification_id: paymentNotifId,
                        user_id: bookingUserId,
                        booking_id: newPayment.booking_id,
                        notif_type: "payment_success",
                        notif_channel: "dashboard",
                        notif_status: "success",
                        notif_payload: JSON.stringify({
                            title: "ชำระเงินสำเร็จ",
                            amount: newPayment.payment_amount,
                            method: payment_method,
                        }),
                        notif_sent_at: now,
                    });
                }
            }

            // 4. แจ้ง staff/admin (แจ้งว่าบันทึกสำเร็จ)
            await tx.insert(notifications).values({
                user_id: Number(session.user.id),
                booking_id: newPayment.booking_id,
                title: "บันทึกการชำระเงินสำเร็จ",
                message: `คุณได้บันทึกการชำระเงิน Booking #${newPayment.booking_id}`,
                notif_type: "system",
                notif_priority: "low",
                is_read: false,
            });

            return {
                newPayment,
            };
        });

        return NextResponse.json(
            {
                ...result.newPayment,
            },
            { status: 201 }
        );
    } catch (error: any) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("POST /api/payments error:", error);
        return NextResponse.json(
            {
                error: "ไม่สามารถบันทึกการชำระเงินได้",
                details: error.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}