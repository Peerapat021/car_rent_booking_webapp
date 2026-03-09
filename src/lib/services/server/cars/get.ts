import { db } from "@/lib/db";
import { cars, promotionCars, promotions } from "@/lib/db/schema";
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { eq, sql } from "drizzle-orm";

export async function getCarsServer() {
    await requireAdmin();

    const allCars = await db.select().from(cars);

    if (allCars.length === 0) return [];

    // ดึงโปรโมชั่นที่ active + ยังไม่หมดอายุ
    const activePromos = await db
        .select({
            car_id: promotionCars.car_id,
            promo_id: promotions.promo_id,
            promo_code: promotions.promo_code,
            discount_type: promotions.discount_type,
            discount_value: promotions.discount_value,
            promo_start: promotions.promo_start,
            promo_end: promotions.promo_end,
        })
        .from(promotionCars)
        .leftJoin(promotions, eq(promotionCars.promo_id, promotions.promo_id))
        .where(sql`
      ${promotions.promo_status} = 'active'
      AND DATE(${promotions.promo_end}) >= CURDATE()
    `);

    // จัดกลุ่มโปรโมชั่นตาม car_id
    const promoMap: Record<number, any[]> = {};
    for (const promo of activePromos) {
        if (!promoMap[promo.car_id]) promoMap[promo.car_id] = [];

        const end = new Date(promo.promo_end as any);
        end.setUTCHours(23, 59, 59, 999); // ← แก้ timezone

        promoMap[promo.car_id].push({
            promo_id: promo.promo_id,
            promo_code: promo.promo_code,
            discount_type: promo.discount_type,
            discount_value: Number(promo.discount_value) || 0,
            promo_start: new Date(promo.promo_start as any).toISOString(),
            promo_end: end.toISOString(),
        });
    }

    // รวม promotions เข้าแต่ละรถ
    return allCars.map((car) => ({
        ...car,
        promotions: promoMap[car.car_id] || [],
    }));
}