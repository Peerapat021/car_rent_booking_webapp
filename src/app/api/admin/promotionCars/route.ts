// app/api/admin/promotionCars/route.ts
import { requireAdmin } from "@/app/api/auth/requireAdmin";
import { db } from "@/lib/db";
import { promotionCars, promotions, cars } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function GET(req: NextRequest) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(req.url);
        const carIdParam = searchParams.get("car_id");
        const scope = searchParams.get("scope") || "attached";

        if (scope === "available") {
            const availablePromos = await db
                .select({
                    promo_id: promotions.promo_id,
                    promo_code: promotions.promo_code,
                    discount_type: promotions.discount_type,
                    discount_value: promotions.discount_value,
                    promo_start: promotions.promo_start,
                    promo_end: promotions.promo_end,
                    promo_status: promotions.promo_status,
                })
                .from(promotions)
                .where(
                    and(
                        eq(promotions.promo_status, "active"),
                        sql`${promotions.promo_end} >= CURRENT_DATE()`
                    )
                )
                .orderBy(promotions.promo_start);

            return Response.json({ promotions: availablePromos });
        }

        // ✅ สร้าง array เก็บเงื่อนไข
        const conditions = [
            eq(promotions.promo_status, "active"),
            sql`${promotions.promo_end} >= CURRENT_DATE()`,
        ];

        if (carIdParam) {
            conditions.push(eq(promotionCars.car_id, Number(carIdParam)));
        }

        const result = await db
            .select({
                id: promotionCars.id,
                promo_id: promotionCars.promo_id,
                promo_code: promotions.promo_code,
                promo_type: promotions.discount_type,
                discount_value: promotions.discount_value,
                promo_start: promotions.promo_start,
                promo_end: promotions.promo_end,
                promo_status: promotions.promo_status,
                car_id: promotionCars.car_id,
                car_brand: cars.car_brand,
                car_model: cars.car_model,
            })
            .from(promotionCars)
            .leftJoin(promotions, eq(promotionCars.promo_id, promotions.promo_id))
            .leftJoin(cars, eq(promotionCars.car_id, cars.car_id))
            .where(and(...conditions))
            .orderBy(desc(promotionCars.id));

        return Response.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Get promotion cars error:", error);
        return new Response("ไม่สามารถโหลดข้อมูลได้", { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await requireAdmin();
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }
        if (session.user?.role !== "admin") return new Response("Forbidden", { status: 403 });


        if ((session.user?.role === "admin" || session.user?.role === "staff") && !session.user?.branch_id) {
            return new Response("พนักงานต้องมีสาขา", { status: 400 });
        }

        const body = await req.json();
        const { promo_id, car_id } = body;

        if (!promo_id || !car_id) {
            return new Response("Missing required fields", { status: 400 });
        }

        // ตรวจสอบว่าโปรมีอยู่จริง + active
        const [promo] = await db
            .select()
            .from(promotions)
            .where(
                and(
                    eq(promotions.promo_id, promo_id),
                    eq(promotions.promo_status, "active")
                )
            )
            .limit(1);

        if (!promo) {
            return new Response("Promotion not found or inactive", { status: 400 });
        }

        // ตรวจสอบว่ารถมีอยู่จริง
        const [car] = await db
            .select()
            .from(cars)
            .where(eq(cars.car_id, car_id))
            .limit(1);

        if (!car) {
            return new Response("Car not found", { status: 400 });
        }

        // กันผูกซ้ำ
        const [existing] = await db
            .select()
            .from(promotionCars)
            .where(
                and(
                    eq(promotionCars.promo_id, promo_id),
                    eq(promotionCars.car_id, car_id)
                )
            )
            .limit(1);

        if (existing) {
            return new Response("ขออภัยท่านใช้โปรโมชั่นนี้กับรถคันนี้แล้ว", {
                status: 400,
            });
        }

        const [result] = await db
            .insert(promotionCars)
            .values({
                promo_id,
                car_id,
            })
            .$returningId();

        return Response.json(result);
    } catch (error) {
        if (error instanceof Error && error.message === "FORBIDDEN") {
            notFound();
        }
        console.error("Create promotion car error:", error);
        return new Response("ไม่สามารถสร้างข้อมูลได้", { status: 500 });
    }
}