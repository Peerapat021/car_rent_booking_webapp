// app/api/admin/cars/route.ts
import { db } from "@/lib/db";
import { cars, promotionCars, promotions } from "@/lib/db/schema";
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";

export async function GET() {
    try {
        // ─────────────────────────────────────────────
        // 1️⃣ ดึงรถทั้งหมด
        // ─────────────────────────────────────────────
        const allCars = await db
            .select()
            .from(cars);

        if (allCars.length === 0) {
            return NextResponse.json([]);
        }

        // ─────────────────────────────────────────────
        // 2️⃣ ดึงโปรโมชั่นที่ active + ยังไม่หมดอายุ
        // ─────────────────────────────────────────────
        const activePromos = await db
            .select({
                car_id: promotionCars.car_id,
                promo_id: promotions.promo_id,
                promo_code: promotions.promo_code,
                discount_type: promotions.discount_type,
                discount_value: promotions.discount_value,
            })
            .from(promotionCars)
            .leftJoin(
                promotions,
                eq(promotionCars.promo_id, promotions.promo_id)
            )
            .where(sql`
                ${promotions.promo_status} = 'active'
                AND ${promotions.promo_end} >= CURRENT_DATE()
            `);

        // ─────────────────────────────────────────────
        // 3️⃣ จัดกลุ่มโปรโมชั่นตาม car_id
        // ─────────────────────────────────────────────
        const promoMap: Record<number, any[]> = {};

        for (const promo of activePromos) {
            if (!promoMap[promo.car_id]) {
                promoMap[promo.car_id] = [];
            }

            promoMap[promo.car_id].push({
                promo_id: promo.promo_id,
                promo_code: promo.promo_code,
                discount_type: promo.discount_type,
                discount_value: promo.discount_value,
            });
        }

        // ─────────────────────────────────────────────
        // 4️⃣ รวม promotions เข้าแต่ละรถ
        // ─────────────────────────────────────────────
        const formatted = allCars.map((car) => ({
            ...car,
            promotions: promoMap[car.car_id] || [],
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("GET /api/admin/cars error:", error);
        return new NextResponse("ไม่สามารถโหลดข้อมูลรถได้", { status: 500 });
    }
}