import { db } from "@/lib/db";
import { promotions } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { desc } from "drizzle-orm";

export async function getPromotionsServer() {
    await requireAdmin();

    const allPromotions = await db.select().from(promotions).orderBy(desc(promotions.promo_id));

    return allPromotions;
}