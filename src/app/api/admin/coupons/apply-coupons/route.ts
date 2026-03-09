
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { coupons, couponUsages } from "@/lib/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { notFound } from "next/navigation";

export async function POST(request: Request) {
    try {
        await requireAdmin();   
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return Response.json(
                { success: false, message: "กรุณาเข้าสู่ระบบก่อน" },
                { status: 401 }
            );
        }

        const userId = Number(session.user.id);
        const formData = await request.formData();

        const coupon_code = formData.get("coupon_code")?.toString()?.trim().toUpperCase();
        const booking_amount_str = formData.get("booking_amount")?.toString() || "0";
        const booking_amount = Number(booking_amount_str);

        if (!coupon_code) {
            return Response.json(
                { success: false, message: "กรุณาระบุรหัสคูปอง" },
                { status: 400 }
            );
        }

        // 1. ค้นหาคูปองที่ใช้งานได้
        const [coupon] = await db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.coupon_code, coupon_code),
                    eq(coupons.is_active, true),
                    gte(coupons.end_date, sql`CURRENT_DATE`),
                    lte(coupons.start_date, sql`CURRENT_DATE`)
                )
            )
            .limit(1);

        if (!coupon) {
            return Response.json(
                { success: false, message: "คูปองไม่ถูกต้อง หมดอายุ หรือไม่ได้เปิดใช้งาน" },
                { status: 400 }
            );
        }

        // 2. เช็ค จำนวนครั้งที่ใช้ได้ทั้งหมด
        if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
            return Response.json(
                { success: false, message: "คูปองหมดจำนวนการใช้งานแล้ว" },
                { status: 400 }
            );
        }

        // 3. เช็ค จำนวนครั้งที่ผู้ใช้นี้ใช้ไปแล้ว
        const usageCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(couponUsages)
            .where(
                and(
                    eq(couponUsages.coupon_id, coupon.coupon_id),
                    eq(couponUsages.user_id, userId)
                )
            );

        const usedByUser = Number(usageCountResult[0]?.count ?? 0);

        if (
            coupon.usage_limit_per_user !== null &&
            usedByUser >= coupon.usage_limit_per_user
        ) {
            return Response.json(
                {
                    success: false,
                    message: `คุณใช้คูปองนี้ครบโควต้าสูงสุด ${coupon.usage_limit_per_user} ครั้งแล้ว`,
                },
                { status: 400 }
            );
        }

        // 4. เช็ค ยอดขั้นต่ำ
        if (
            coupon.min_booking_amount !== null &&
            booking_amount < Number(coupon.min_booking_amount)
        ) {
            return Response.json(
                {
                    success: false,
                    message: `ยอดรวมต้องไม่ต่ำกว่า ${Number(coupon.min_booking_amount).toLocaleString()} บาท เพื่อใช้คูปองนี้`,
                },
                { status: 400 }
            );
        }

        // 5. คำนวณส่วนลดจริง
        let discount = 0;
        const value = Number(coupon.discount_value);

        if (coupon.discount_type === "percent") {
            discount = booking_amount * (value / 100);
            if (coupon.max_discount_amount !== null) {
                discount = Math.min(discount, Number(coupon.max_discount_amount));
            }
        } else {
            discount = value;
        }

        // ส่งข้อมูลกลับ
        return Response.json({
            success: true,
            coupon: {
                coupon_id: coupon.coupon_id,
                coupon_code: coupon.coupon_code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                max_discount_amount: coupon.max_discount_amount,
                min_booking_amount: coupon.min_booking_amount,
                usage_limit_per_user: coupon.usage_limit_per_user,
            },
            calculated_discount: discount.toFixed(2),
            final_amount: (booking_amount - discount).toFixed(2),
            message: "คูปองใช้ได้",
        });
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Apply coupon error:", error);
        return Response.json(
            { success: false, message: "เกิดข้อผิดพลาดในการตรวจสอบคูปอง" },
            { status: 500 }
        );
    }
}