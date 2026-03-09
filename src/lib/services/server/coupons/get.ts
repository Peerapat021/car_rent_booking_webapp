import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { desc } from "drizzle-orm";

export async function getCouponsServer() {
    await requireAdmin();

    const allCoupons = await db
        .select()
        .from(coupons)
        .orderBy(desc(coupons.coupon_id));

    const formattedCoupons = allCoupons.map((c) => ({
        coupon_id: c.coupon_id,
        coupon_code: c.coupon_code,
        coupon_image: c.coupon_image,
        discount_type: c.discount_type,
        discount_value: c.discount_value,
        max_discount_amount: c.max_discount_amount,
        min_booking_amount: c.min_booking_amount,
        usage_limit: c.usage_limit,
        usage_limit_per_user: c.usage_limit_per_user,
        used_count: c.used_count,
        start_date: c.start_date ? c.start_date.toISOString() : null,
        end_date: c.end_date ? c.end_date.toISOString() : null,
        is_active: c.is_active,
        created_at: c.created_at.toISOString(),
    }));

    return formattedCoupons;
}