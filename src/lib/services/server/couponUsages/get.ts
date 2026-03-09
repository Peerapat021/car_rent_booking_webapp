import { db } from "@/lib/db";
import { couponUsages } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { desc } from "drizzle-orm";

export async function getCouponUsagesServer() {
    await requireAdmin();

    const allCouponUsages = await db.select().from(couponUsages).orderBy(desc(couponUsages.usage_id));

    return allCouponUsages;
}